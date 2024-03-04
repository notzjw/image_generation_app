from itertools import islice
import json
from pathlib import Path
import torch
from torch.utils.data import DataLoader
from torchvision import utils
from dalle2_pytorch import CLIP, DALLE2, DiffusionPriorNetwork, DiffusionPrior, Unet, Decoder, OpenAIClipAdapter
from dalle2_pytorch.dataloaders import create_image_embedding_dataloader
from dalle2_pytorch.dataloaders.simple_image_only_dataloader import get_images_dataloader
from tqdm import tqdm
from ema_pytorch import EMA
from torch import nn
from dalle2_pytorch.optimizer import get_optimizer
# openai pretrained clip - defaults to ViT-B/32
import webdataset as wds
from torchvision import transforms
from dalle2_pytorch.train_configs import DecoderConfig
import matplotlib.pyplot as plt
import wandb
from torchmetrics.image.fid import FrechetInceptionDistance
from torchmetrics.image.inception import InceptionScore
from torchmetrics.image.kid import KernelInceptionDistance
from torchmetrics.image.lpip import LearnedPerceptualImagePatchSimilarity

import time

def exists(val):
    return val is not None

class Timer:
    def __init__(self):
        self.reset()

    def reset(self):
        self.last_time = time.time()

    def elapsed(self):
        return time.time() - self.last_time
    
def print_model_parm_nums(model):
    total = sum([param.nelement() for param in model.parameters()])
    print('  + Number of params: %.2fM' % (total / 1e6))


class MyDecoderTrainer(nn.Module):
    def __init__(self, config, decoder: Decoder):
        super().__init__()

        self.config = config

        self.decoder = decoder.cuda()

        self.unets_number = len(config['decoder']['unets'])

        self.optimizers = [
            get_optimizer(
                self.decoder.unets[i].parameters(),
                lr=self.config['train']['lr'][i],
                wd=self.config['train']['wd'],
                eps=self.config['train']['eps']
            ) if self.config['train']['is_unet_training'][i] else None
            for i in range(0, self.unets_number)
        ]

        self.schedulers = [
            torch.optim.lr_scheduler.StepLR(self.optimizers[i], step_size=self.config['train']['epochs'] // 5, gamma=0.5)
            if self.config['train']['is_unet_training'][i] else None
            for i in range(0, self.unets_number)
        ]

        self.ema_unets = nn.ModuleList([])

        if self.config['train']['use_ema']:
            for i in range(0, self.unets_number):
                self.ema_unets.append(EMA(self.decoder.unets[i], beta=0.99))

        self.train_dataloader, self.val_dataloader, self.test_dataloader = get_images_dataloader(**self.config['data'])
        self.start_epoch = 0
        self.total_steps = 0

    def train_decoder(self):
        Path(self.config['train']['save_dir'] + '/images').mkdir(parents=True, exist_ok=True)
        Path(self.config['train']['save_dir'] + '/pth').mkdir(parents=True, exist_ok=True)
        # 保存本次训练的配置文件
        with open(self.config['train']['save_dir']+'/train_decoder_config.json', 'w') as f:
            json.dump(self.config, f, indent=4)
        
        # wandb
        wandb.init(
            project="dalle2", 
            config=self.config
        )

        print(f'-----start tarin with epoch: {self.start_epoch} total step: {self.total_steps}----')
        timer = Timer()
        for epoch in range(1, self.config['train']['epochs']):
            # 1、train
            self.train()
            timer.reset()
            for images in self.train_dataloader:
                images: torch.Tensor = images.to('cuda')
                # 滤除非RGB图像
                if images.shape[1] != 3:
                    continue
                images_embed, __ = self.decoder.clip.embed_image(images)
                
                unets_loss = [0 for _ in range(self.unets_number)]
                for i in range(0, self.unets_number):
                    # 该层unet不进行训练
                    if not self.config['train']['is_unet_training'][i]:
                        continue
                    # this can optionally be decoder(images, text) if you wish to condition on the text encodings as well, though it was hinted in the paper it didn't do much
                    loss = self.decoder(images, image_embed = images_embed, unet_number = i + 1) 
                    # 计算梯度
                    loss.backward()
                    # 梯度裁剪
                    torch.nn.utils.clip_grad_norm_(parameters=self.decoder.unets[i].parameters(), max_norm=self.config['train']['max_grad_norm'], norm_type=2)
                    # 反向传播
                    self.optimizers[i].step()
                    # 梯度归零
                    self.optimizers[i].zero_grad()
                    # ema平滑参数变化 更易收敛
                    if self.config['train']['use_ema']:
                        self.ema_unets[i].update()
                    # 保存loss
                    unets_loss[i] = loss.item()

                # 显示epoch、loss等一些信息
                if self.total_steps % self.config['train']['show_loss_freq'] == 0:
                    trainTime_per_batch = timer.elapsed() / self.config['data']['batch_size'] / self.config['train']['show_loss_freq']
                    timer.reset()
                    unets_loss_dict = {}
                    for i, loss in enumerate(unets_loss):
                        if self.config['train']['is_unet_training'][i]:
                            unets_loss_dict[f"unet{i}_loss"] = loss
                    if self.config['train']['use_ema']:
                        wandb.log({
                            "epoch": epoch, 
                            "total_step": self.total_steps,
                            "learning rate": self.schedulers[1].get_lr(),
                            "trainTime_per_batch": trainTime_per_batch,
                            **unets_loss_dict,
                            **{
                                f"ema_unet{i}_decay": ema_unet.get_current_decay()
                                for i, ema_unet in enumerate(self.ema_unets)
                            }
                        })
                    else:
                        wandb.log({
                            "epoch": epoch, 
                            "total_step": self.total_steps,
                            "learning rate": self.schedulers[1].get_lr(),
                            "trainTime_per_batch": trainTime_per_batch,
                             **unets_loss_dict,
                        })
                
                self.total_steps += self.config['data']['batch_size']
                
            for scheduler in self.schedulers:
                if scheduler:
                    scheduler.step()
            
            # 2、validation
            self.eval()
            timer.reset()
            for index, images in enumerate(self.val_dataloader):
                images: torch.Tensor = images.to('cuda')
                # 滤除非RGB图像
                if images.shape[1] != 3:
                    continue
                images_embed, __ = self.decoder.clip.embed_image(images)
                
                unets_loss = [0 for _ in range(self.unets_number)]
                for i in range(0, self.unets_number):
                    # 该层unet不进行训练
                    if not self.config['train']['is_unet_training'][i]:
                        continue
                    # this can optionally be decoder(images, text) if you wish to condition on the text encodings as well, though it was hinted in the paper it didn't do much
                    loss = self.decoder(images, image_embed = images_embed, unet_number = i + 1) 
                    # 保存、显示epoch、loss等一些信息
                    unets_loss[i] = loss.item()

                if index % self.config['train']['show_loss_freq'] == 0:
                    unets_loss_dict = {}
                    for i, loss in enumerate(unets_loss):
                        if self.config['train']['is_unet_training'][i]:
                            unets_loss_dict[f"unet{i}_val_loss"] = loss
                    valTime_per_batch = timer.elapsed() / self.config['data']['batch_size'] / self.config['train']['show_loss_freq']
                    wandb.log({
                        "valTime_per_batch": valTime_per_batch,
                        **unets_loss_dict,
                    })
            
            # 3、evaluate
            timer.reset()
            print("Evaluate, Saving images......")
            batch_size = self.config['data']['batch_size']
            unit_image_size = (self.config['decoder']['image_sizes'][-1], self.config['decoder']['image_sizes'][-1])
            resize_image = lambda img: torch.nn.functional.interpolate(img, unit_image_size, mode='nearest')
            result_list = []
            for images in self.test_dataloader:
                images: torch.Tensor = images.to('cuda')
                # images --clip--> img_embed
                image_embed = self.decoder.clip.embed_image(images).image_embed
                # img_embed --> unet_denoing--> images
                restruct_images, cond_images = self.decoder.sample(image_embed = image_embed)
                # 原图
                origin_images = utils.make_grid(resize_image(images), nrow=batch_size)
                # 中间生成图
                cond_images = [
                    utils.make_grid(resize_image(cond_image), nrow=batch_size) 
                    for cond_image in cond_images
                ]
                # 最终结果图
                result_images = utils.make_grid(resize_image(restruct_images), nrow=batch_size)
                result = torch.cat([origin_images, *cond_images, result_images], dim=1)

                result_list.append(result)

                if len(result_list) >= self.config['train']['images_sample']:
                    break
            # 按宽度拼接起来
            generated_images_grid = torch.cat(result_list, dim=2)
            utils.save_image(generated_images_grid, self.config['train']['save_dir']+'/images/%s_%s.png' % (epoch, self.total_steps))
            metrics = self.evaluate(**self.config['evaluate'])
            wandb.log({
                "evaluate_time": timer.elapsed(),
                "image": wandb.Image(generated_images_grid.float().cpu()),
                **metrics,
            })

            # 4、保存模型文件、训练中间文件
            if epoch % self.config['train']['save_model_epoch_freq'] == 0:
                print(f"Saving decoder state_dict at epoch {epoch}......")
                self.save(epoch=epoch)

    def evaluate(self, n_evaluation_samples = 1000, FID=None, IS=None, KID=None, LPIPS=None) -> dict:
        real_image_list = []
        generated_image_list = []
        for image in self.test_dataloader:
            image = image.to('cuda')
            image_embed, __ = self.decoder.clip.embed_image(image)
            # img_embed --> unet_denoing--> images
            generated_image, cond_images = self.decoder.sample(image_embed = image_embed)
            real_image_list.append(image)
            generated_image_list.append(generated_image)
            if len(real_image_list) >= n_evaluation_samples:
                break

        # real_images, generated_images: (n, c, h, w)
        real_images = torch.cat(real_image_list, dim=0).to(device='cuda', dtype=torch.float)
        generated_images = torch.cat(generated_image_list, dim=0).to(device='cuda', dtype=torch.float)
        int_real_images = real_images.mul(255).add(0.5).clamp(0, 255).type(torch.uint8)
        int_generated_images = generated_images.mul(255).add(0.5).clamp(0, 255).type(torch.uint8)

        metrics = {}
        if exists(FID):
            fid = FrechetInceptionDistance(**FID)
            fid.to(device='cuda')
            fid.update(int_real_images, real=True)
            fid.update(int_generated_images, real=False)
            metrics["FID"] = fid.compute().item()
        if exists(IS):
            inception = InceptionScore(**IS)
            inception.to(device='cuda')
            inception.update(int_real_images)
            is_mean, is_std = inception.compute()
            metrics["IS_mean"] = is_mean.item()
            metrics["IS_std"] = is_std.item()
        if exists(KID):
            kernel_inception = KernelInceptionDistance(**KID)
            kernel_inception.to(device='cuda')
            kernel_inception.update(int_real_images, real=True)
            kernel_inception.update(int_generated_images, real=False)
            kid_mean, kid_std = kernel_inception.compute()
            metrics["KID_mean"] = kid_mean.item()
            metrics["KID_std"] = kid_std.item()
        if exists(LPIPS):
            # Convert from [0, 1] to [-1, 1]
            renorm_real_images = real_images.mul(2).sub(1).clamp(-1,1)
            renorm_generated_images = generated_images.mul(2).sub(1).clamp(-1,1)
            lpips = LearnedPerceptualImagePatchSimilarity(**LPIPS)
            lpips.to(device='cuda')
            lpips.update(renorm_real_images, renorm_generated_images)
            metrics["LPIPS"] = lpips.compute().item()

        return metrics
    
    def save(self, epoch: int):
        train_state_dict_save_path = Path(self.config['train']['save_dir'] + '/pth/train_decoder_%s.pth' % epoch)
        state_dict_save_path = Path(self.config['train']['save_dir'] + '/pth/inference_decoder_%s.pth' % epoch)

        # 父目录
        if not train_state_dict_save_path.parent.exists():
            train_state_dict_save_path.parent.mkdir(parents = True, exist_ok = True)
        
        # 保存训练用的优化器、权重文件...
        save_obj = dict(
            epoch = epoch,
            total_step = self.total_steps,
            model = self.decoder.state_dict(),
        )
        for index in range(0, self.unets_number):
            if self.config['train']['is_unet_training'][index]:
                optimizer_key = f'optim{index}'
                scheduler_key = f'sched{index}'
                optimizer_state_dict = self.optimizers[index].state_dict() 
                scheduler_state_dict = self.schedulers[index].state_dict()
                save_obj = {
                    **save_obj, 
                    optimizer_key: optimizer_state_dict, 
                    scheduler_key: scheduler_state_dict
                }
        if self.config['train']['use_ema']:
            save_obj = {**save_obj, 'ema': self.ema_unets.state_dict()}
        torch.save(save_obj, str(train_state_dict_save_path))

        # 保存推理用的权重文件
        torch.save(self.decoder.state_dict(), str(state_dict_save_path))

    def draw_figure(self, data: list, label: str):
        plt.figure()
        plt.plot(data,'b',label = label)
        plt.ylabel(label)
        plt.xlabel('step / %s' % self.config['train']['show_loss_freq'])
        plt.legend()
        plt.savefig(f"{self.config['train']['save_dir']}/{label}.jpg")

    def load(self, path: Path, only_model = False, strict = True):

        loaded_obj = torch.load(str(path), map_location = 'cpu')
        print('----------------- load from ' + str(loaded_obj['epoch']) + ' -------------')

        self.load_train_state_dict(loaded_obj, only_model = only_model, strict = strict)
        print('----------------- load over ' + '-------------')
        return loaded_obj

    def load_train_state_dict(self, loaded_obj, only_model = False, strict = True):
        self.decoder.load_state_dict(loaded_obj['model'], strict = strict)

        if only_model:
            return

        for index in range(0, self.unets_number):
            if self.config['train']['is_unet_training'][index]:
                optimizer_key = f'optim{index}'
                scheduler_key = f'sched{index}'
                self.optimizers[index].load_state_dict(loaded_obj[optimizer_key])
                self.schedulers[index].load_state_dict(loaded_obj[scheduler_key])

        if self.config['train']['use_ema']:
            assert 'ema' in loaded_obj
            self.ema_unets.load_state_dict(loaded_obj['ema'], strict = strict)

    def resume_train(self, pth_path: Path, resume_from_epoch: int):
        self.start_epoch = resume_from_epoch
        self.load(pth_path)
        self.train_decoder()