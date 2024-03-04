import queue
import threading
import time

class Task:
    def __init__(self, priority, task_type, sleeptime, taskname):
        self.priority = priority
        self.task_type = task_type
        self.sleeptime = sleeptime
        self.taskname = taskname
    def __lt__(self, other):
        return self.priority < other.priority

class Diffusion_Pipe:
    def __init__(self, ) -> None:
        # 创建优先级队列
        self.priority_queue = queue.PriorityQueue()
        self.working = False
        pass

    def add_task(self, priority, task_type, sleeptime,taskname):
        self.priority_queue.put(Task(priority, task_type, sleeptime,taskname))   

    def start_work(self):
        timer = threading.Timer(1, self.start_work)
        timer.start()

        if not self.priority_queue.empty() and not self.working:
            next_task = self.priority_queue.get()
            # 创建一个线程对象，并传递函数参数
            thread = threading.Thread(target=self.g1, args=([next_task.taskname, next_task.sleeptime]))
            self.working = True
            # 启动线程
            thread.start()

        current_second = int(time.time() % 60)
        # print(f"start_work: {current_second}")

    def g1(self, taksname, sleeptime):
        for i in range(sleeptime):
            time.sleep(1)
            current_second = int(time.time() % 60)
            print(f"{taksname} : {current_second}")
        self.working = False
dp = Diffusion_Pipe()

dp.add_task(3,1,2,'taks1: ')
dp.add_task(2,1,3,'taks2: ')
dp.add_task(1,1,4,'taks3: ')

dp.start_work()

print('1111111')