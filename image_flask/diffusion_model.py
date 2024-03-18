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
import uuid
import queue

class Task:
    def __init__(self, priority, task_type, model_input):
        self.priority = priority
        self.task_type = task_type
        self.model_input = model_input
        self.task_id = str(uuid.uuid4())

    def __lt__(self, other):
        return self.priority < other.priority
    
class Diffusion_Pipe:
    def __init__(self, ) -> None:
        # 创建优先级队列
        self.priority_queue = queue.PriorityQueue()
        self.decoder = None
        self.load_decoder('/mnt/disk/zjw/dalle2_pytorch_v1_12_4_v2/configs/epoch184_unet64_256_512')
    
    def set_redis(self, redis_client):
        self.decoder.redis_client = redis_client

    def load_decoder(self, model_path: str):
        logger.info('扩散模型 开始加载')
        # 1、读取decoder配置
        decoder_config = dict()
        with open(f'{model_path}/config.json') as f:
            decoder_config: dict = json.load(f)
        # 2、创建decoder
        self.decoder = DecoderConfig(**decoder_config['decoder']).create()
        # 3、读取权重
        logger.info('扩散模型 读取权重')
        decoder_state_dict = torch.load(f'{model_path}/model.pth', map_location = 'cpu')
        # 4、加载权重
        logger.info('扩散模型 加载权重')
        self.decoder.load_state_dict(decoder_state_dict)
        # 5、cuda加速
        self.decoder.to('cuda')
        # 6、eval推理模式
        self.decoder.eval()
        logger.info('扩散模型 加载完毕')
        # 查询当前已分配的显存量
        allocated_memory = torch.cuda.memory_allocated() / 1024 / 1024
        max_memory = torch.cuda.get_device_properties(torch.device("cuda")).total_memory / 1024 / 1024
        logger.info(f"当前已分配显存量 / 最大显存（MB）: {int(allocated_memory)} / {int(max_memory)}")

    def add_task(self, priority, task_type, model_input):
        # 1、创建任务
        new_task = Task(priority, task_type, model_input=model_input)
        self.priority_queue.put(new_task)
        # 2、任务进度初始化为 0
        self.decoder.redis_client.set(new_task.task_id, 0)
        # 3、logger
        logger.info(' ')
        logger.info(f'【新增任务】 任务类型: {new_task.task_type} 任务id: {new_task.task_id}')
        return new_task.task_id
    
    def print_task_list(self):
        # 打印所有任务作业
        status = 'RUNNING' if self.decoder.working else 'IDLE'
        c = 1 if self.decoder.working else 0
        logger.info(f'【查询优先级队列】 当前任务作业数量：{len(self.priority_queue.queue)+c} 当前工作状态：{status}')
        if status == 'RUNNING':
            task_progress = self.decoder.redis_client.get(self.decoder.task_id).decode('utf-8')
            logger.info(f'[0] 任务类型: {self.decoder.task_type} 任务id: {self.decoder.task_id} 任务进度: {task_progress}%')
        for i, task in enumerate(self.priority_queue.queue):
            task_progress = self.decoder.redis_client.get(task.task_id).decode('utf-8')
            logger.info(f'[{i+1}] 任务类型: {task.task_type} 任务id: {task.task_id} 任务进度: {task_progress}%')
        logger.info('-' * 80)
        logger.info(' ')
        
    def start_work(self):
        timer = threading.Timer(1, self.start_work)
        timer.start()
        self.print_task_list()
        if not self.priority_queue.empty() and not self.decoder.working:
            next_task: Task = self.priority_queue.get()
            logger.info(f'【执行任务】, 任务类型: {next_task.task_type}, 任务id: {next_task.task_id}')
            logger.info(' ')
            if next_task.task_type == 'interpolations':
                # 创建一个线程对象，并传递函数参数
                self.decoder.task_id = next_task.task_id
                self.decoder.task_type = next_task.task_type
                self.decoder.working = True
                thread = threading.Thread(target=self.decoder.interpolations, kwargs=next_task.model_input)
                thread.start()
            elif next_task.task_type == 'variations':
                # 创建一个线程对象，并传递函数参数
                self.decoder.task_id = next_task.task_id
                self.decoder.task_type = next_task.task_type
                self.decoder.working = True
                thread = threading.Thread(target=self.decoder.variations, kwargs=next_task.model_input)
                thread.start()
    def setup_seed(self, seed):
        torch.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        numpy.random.seed(seed)
        random.seed(seed)
        torch.backends.cudnn.deterministic = True

# decoder.img2img_for_flask('image_flask/images/file_30592.png', ['image_flask/images/file_305921212.png'])

# 1. Interpolations
def interpolations(image_path1: Path, image_path2: Path, weight: float):
    '''
        weight = -1 or 0-1的浮点数
        -1：生成中间图连续图
        0-1的浮点数：特征权重
    '''
    print('开始图像融合任务')

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

