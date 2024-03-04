from pathlib import Path

import torch
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms, utils

from PIL import Image

# helpers functions

def cycle(dl):
    while True:
        for data in dl:
            yield data

# dataset and dataloader

class MyDataset(Dataset):
    def __init__(
        self,
        dir,
        preprocessing,
        exts = ['jpg', 'jpeg', 'png']
    ):
        super().__init__()
        self.datasetDir = dir
        self.paths = [p for ext in exts for p in Path(f'{self.datasetDir}').glob(f'**/*.{ext}')]

        self.transform = transforms.Compose([
            transforms.RandomResizedCrop(**preprocessing['RandomResizedCrop']),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor()
        ])

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, index):

        path = self.paths[index]

        img = Image.open(path)
        img = self.process_image(img)
        return self.transform(img)
    
    def process_image(self, image: Image.Image) -> Image.Image:
            # If the image has an alpha channel, then we need to remove it.
            if image.mode == 'RGB':
                return image
            else:
                return image.convert('RGB')

def get_images_dataloader(
    train_dir: str,
    test_dir: str,
    preprocessing: dict,
    batch_size: int,
    shuffle = True,
    pin_memory = False, # 节省显存
    split_ratio = [8, 2] # 训练集，验证集的比例
):
    train_dataset = MyDataset(train_dir, preprocessing)
    test_set = MyDataset(test_dir, preprocessing)

    train_set_len = int(train_dataset.__len__() * split_ratio[0] / (split_ratio[0] + split_ratio[1]))
    val_set_len = train_dataset.__len__() - train_set_len

    train_set, val_set = random_split(train_dataset, [
        train_set_len, 
        val_set_len
    ])

    train_dataloader = DataLoader(train_set, batch_size = batch_size, shuffle = shuffle, pin_memory = pin_memory)
    val_dataloader = DataLoader(val_set, batch_size = batch_size, shuffle = shuffle, pin_memory = pin_memory)
    test_dataloader = DataLoader(test_set, batch_size = batch_size, shuffle = shuffle, pin_memory = pin_memory)
    return train_dataloader, val_dataloader, test_dataloader
