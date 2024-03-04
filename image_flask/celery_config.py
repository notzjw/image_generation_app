# celery_config.py
from celery import Celery

celery = Celery(
    'diffusion_task_list',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0',
)

# celery.conf.update(
#     result_expires=3600,
# )
# # 设置并发限制为1
# celery.conf.task_concurrency = 1
# 4、celery
