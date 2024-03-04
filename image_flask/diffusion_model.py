from pathlib import Path
from celery import Celery
from dalle2_pytorch.train_configs import DecoderConfig
from logger import logger
import torch
import json
import numpy
import random
import time
import threading

import queue
# 创建优先级队列
priority_queue = queue.PriorityQueue()

class Task:
    def __init__(self, priority, description):
        self.priority = priority
        self.description = description
    
    def __lt__(self, other):
        return self.priority < other.priority

class Diffusion_Pipe:
    def __init__(self, ) -> None:
        pass


def setup_seed(seed):
     torch.manual_seed(seed)
     torch.cuda.manual_seed_all(seed)
     numpy.random.seed(seed)
     random.seed(seed)
     torch.backends.cudnn.deterministic = True
# 设置随机数种子
setup_seed(20)

logger.info('cdm 扩散模型 开始加载')
# 1、读取decoder配置
decoder_config = dict()
with open('/mnt/disk/zjw/dalle2_pytorch_v1_12_4_v2/configs/epoch184_unet64_256_512/config.json') as f:
    decoder_config: dict = json.load(f)
# 2、创建decoder
decoder = DecoderConfig(**decoder_config['decoder']).create()
# 3、读取权重
logger.info('cdm 扩散模型 读取权重')
decoder_state_dict = torch.load('/mnt/disk/zjw/dalle2_pytorch_v1_12_4_v2/configs/epoch184_unet64_256_512/model.pth', map_location = 'cpu')
# 4、加载权重
logger.info('cdm 扩散模型 加载权重')
decoder.load_state_dict(decoder_state_dict)
# 5、cuda加速
decoder.to('cuda')
# 6、eval推理模式
decoder.eval()

# 查询当前已分配的显存量
allocated_memory = torch.cuda.memory_allocated() / 1024 / 1024
max_allocated_memory = torch.cuda.max_memory_allocated()/ 1024 / 1024
logger.info('cdm 扩散模型加载完毕')
logger.info(f"当前已分配显存量 / 最大显存（MB）: {allocated_memory} / {max_allocated_memory}")

# decoder.img2img_for_flask('image_flask/images/file_30592.png', ['image_flask/images/file_305921212.png'])

def set_redis_to_decoder(redis_client):
    decoder.set_redis_client(redis_client)


# 1. Interpolations
def interpolations(image_path1: Path, image_path2: Path, weight: float):
    '''
        weight = -1 or 0-1的浮点数
        -1：生成中间图连续图
        0-1的浮点数：特征权重
    '''
    print('开始图像插值任务')

    # 本地路径path list
    save_image_path = []
    # 网络路径url list
    gen_image_url_list = []
    if weight == -1:
        merge_image_name = 'gradient_' + time.strftime("%Y%m%d%H%M%S_", time.localtime()) +'.png'
        save_image_path.append(Path('/mnt/disk/zjw/image_app/image_flask/results/interpolations') / merge_image_name)
        gen_image_url_list.append('http://10.12.13.99/results/interpolations/' + merge_image_name)
    else:
        for i in range(3):
            timestamp = time.strftime("%Y%m%d%H%M%S_", time.localtime())
            merge_image_name = f"{timestamp}_{i}.png"  
            save_image_path.append(Path('/mnt/disk/zjw/image_app/image_flask/results/interpolations') / merge_image_name)
            gen_image_url_list.append('http://10.12.13.99/results/interpolations/' + merge_image_name)

    # 创建一个线程对象，并传递函数参数
    thread = threading.Thread(target=decoder.interpolate, args=(image_path1, image_path2, save_image_path, weight))
    # 启动线程
    thread.start()

    return gen_image_url_list

# 2. Variations
def variations(image_path: Path, gen_num: int):
    print('开始图像变换任务')


    # 本地路径path list
    save_path_list = [
        str(Path('/mnt/disk/zjw/image_app/image_flask/results/variations') / (time.strftime("%Y%m%d%H%M%S_", time.localtime()) + '_' + str(i) + '.png'))
        for i in range(gen_num) # 至少1张，最多3张
    ]
    # 网络路径url list
    gen_image_url_list = [
        'http://10.12.13.99/results/variations/' + Path(save_path).name
        for save_path in save_path_list 
    ]
    # 创建一个线程对象，并传递函数参数
    thread = threading.Thread(target=decoder.img2img_for_flask, args=(image_path, save_path_list))
    # 启动线程
    thread.start()

    return gen_image_url_list



if __name__ == '__main__':
    pass

