from functools import wraps
import random
import time
from flask import Flask, jsonify, request
from sql import add_new_user_to_mysql, get_userInfo_by_username, user_login_auth
from logger import logger
from diffusion_model import interpolations, variations, set_redis_to_decoder
from flask_cors import CORS
from pathlib import Path
import redis
from flask_mail import Mail, Message
import string
import jwt
from jwt import exceptions

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app)
# 1、配置邮箱服务
app.config['MAIL_SERVER'] = 'smtp.163.com'  # 邮件服务器地址
app.config['MAIL_PORT'] = 25               # 邮件服务器端口
app.config['MAIL_USE_TLS'] = True          # 启用 TLS
app.config['MAIL_USERNAME'] = 'notzjw1999@163.com'
app.config['MAIL_PASSWORD'] =  'NGPQITOEPZJHQUGD'
mail = Mail(app)

# 2、 Redis连接实例
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)
set_redis_to_decoder(redis_client)
# 3、JWT身份验证
app.config['SECRET_KEY'] = 'zjw19980211..'  # 使用一个安全的密钥
def create_token(username):
    headers = {
        'alg': 'HS256',
        'typ': 'JWT'
    }
    payload = {
        'username': username
    }
    token = jwt.encode(payload=payload, key=app.config['SECRET_KEY'], algorithm='HS256', headers=headers)
    return token
def validate_token(token):
    payload = None
    msg = None
    try:
        payload = jwt.decode(jwt=token, key=app.config['SECRET_KEY'], algorithms='HS256')
    except exceptions.ExpiredSignatureError:
        msg = 'token已过期！'
    except jwt.DecodeError:
        msg = 'token认证失败！'
    except jwt.InvalidTokenError:
        msg = '非法的token！'

    return payload, msg
def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        access_token = request.cookies['access_token']
        if not access_token:
            return jsonify({'success': False, 'message': 'Token is missing', 'data': None}), 401
        payload, msg = validate_token(access_token)
        if payload and not msg:
            return f(payload['username'], *args, **kwargs)
        else:
            return jsonify ({'success': False, 'message': 'Invalid access_token', 'data': None}), 401

    return decorated_function


# 4、celery
# celery = Celery('diffusion_task_list', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')
# # 设置并发限制为1
# celery.conf.task_concurrency = 1


@app.route('/autologin', methods=['POST'])
@token_required
def auto_login(username):
    try:
        logger.info(f'用户【{username}】尝试自动登录')
        user_info = get_userInfo_by_username(username)
        logger.info(f'用户【{username}】自动登录成功')
        return {
            "success": True, 
            "message": '自动登录成功',
            "data": user_info
        } 
    except Exception as e:
        logger.info('自动登录报错' + str(e))
        return {
            "success": False, 
            "message": '自动登录报错'+ str(e),
            "data": None
        } 

# 用户请求邮箱验证码
@app.route('/emailverify', methods=['POST'])
def send_email_verification_code():
    try:
        # 拿到post的数据
        email = request.get_json()['email']
        logger.info('用户【%s】获取验证码' % email)
        code = ''.join(random.choices(string.digits, k=6))
        msg = Message('注册验证码----数码印花智能生成软件', sender='notzjw1999@163.com', recipients=[email])
        msg.body=code
        mail.send(msg)
        # 把code加入redis，等待后续验证
        redis_client.set(email, code)
        return {
            "success": True, 
            "message": '邮箱验证码发送成功',
            "data": None
        } 
    except Exception as e:
        logger.info('邮箱验证码发送失败：' + str(e))
        return {
            "success": False, 
            "message": '邮箱验证码发送失败：'+ str(e),
            "data": None
        } 

# 用户注册接口
@app.route('/register', methods=['POST'])
def user_register():
    try:
        # 拿到post的数据
        user_data = request.get_json()
        logger.info('用户【%s】进行注册' % user_data['email'])
        # 读取redis缓存中的code，并进行验证
        redis_code = redis_client.get(user_data['email']).decode('utf-8')
        logger.info('redis code: %s, user code %s' % (redis_code, user_data['code']))
        if user_data['code'] == redis_code:
            # 如果注册成功，将redis缓存中的code删除
            redis_client.delete(user_data['email'])
            # 数据库交互
            add_new_user_to_mysql(user_data)
            logger.info('用户【%s】进行注册成功，用户名：【%s】' % (user_data['email'], user_data['username']))
            return {
                "success": True, 
                "message": '注册成功',
                "data": None
            } 
        else:
             return {
                "success": False, 
                "message": '注册失败，验证码错误',
                "data": None
            } 
    except Exception as e:
        logger.info('注册出错，' + str(e))
        return {
            "success": False, 
            "message": '注册出错，'+ str(e),
            "data": None
        } 

# 用户注册接口
@app.route('/login', methods=['POST'])
def user_login():
    try:
        # 拿到post的数据
        user_login_data = request.get_json()
        # 验证用户密码正确性, 如果用户登陆成功，返回用户信息，否则返回None
        result = user_login_auth(user_login_data)
        if result:
            logger.info('用户【%s】登录成功' % {user_login_data['username']})
            # 生成token
            access_token = create_token(user_login_data['username'])
            # 生成resp
            resp = jsonify({
                "success": True, 
                "message": '登录成功',
                "data": result
            })
            # 给resp的cookie设值access_token
            resp.set_cookie('access_token', access_token)
            return resp
        else:
             logger.info('用户【%s】登录失败' % {user_login_data['username']})
             return {
                "success": False, 
                "message": '登录失败',
                "data": None
            } 
    except Exception as e:
        return {
            "success": False, 
            "message": '登录失败'+ str(e),
            "data": None
        } 

@app.route('/ping', methods=['GET', 'POST'])
def ping():
    access_token = create_token('usernamezjw')
    # 生成resp
    resp = jsonify({
        "success": True, 
        "message": '登录成功',
        "data": access_token
    })
    # 给resp的cookie设值access_token
    resp.set_cookie('access_token', access_token)
    return resp
    # return {
    #     'message': 'ping success !!!',
    #     'ip_addr': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    # }, 200

# 上传图片
@app.route('/upload', methods=['GET', 'POST'])
def upload():
    try:
        # 存储图像到本地
        logger.info('用户上传图片')
        files = request.files.to_dict()
        filename = ''
        for sizeType, file in files.items():
            if sizeType == 'file':
                filename = time.strftime("%Y%m%d%H%M%S_", time.localtime()) + '.png'  # 图片名 'origin_xxx.jpg'
                logger.info(f'图片filename: {filename}')
                file.save(f'/mnt/disk/zjw/image_app/image_flask/images/{filename}')
        logger.info('上传完毕, 图片的url：' +  'http://10.12.13.99/images/' + filename)
        # 返回图片的url
        return  'http://10.12.13.99/images/' + filename
    
    except Exception as e:
        logger.info('上传图片发生错误：' + str(e))
        return ''
    
# variations
@app.route('/variations', methods=['POST'])
def api_variation():
    try:
        # 清除上一次的progress
        redis_client.set('progress_uuid', 0)
        # 拿到post的数据
        data = request.get_json()
        image_url = Path(data['image_url'])
        gen_num = data['gen_num']
        # 本地路径
        image_path = Path('/mnt/disk/zjw/image_app/image_flask/images') / image_url.name

        gen_image_url_list = variations(image_path, gen_num)
        
        return {
            "success": True, 
            "message": '图像变换成功',
            "data": { 
                'progress_key': 'progress_uuid',
                'progress': 0,
                'gen_image_url_list': gen_image_url_list
            }
        } 
    
    except Exception as e:
        logger.info('图像变换失败', e)
        return {
            "success": False, 
            "message": '图像变换失败'+ str(e),
            "data": None
        }
    
# interpolations
@app.route('/interpolations', methods=['POST'])
@token_required
def api_interpolation(username: str):
    try:
        # 清除上一次的progress
        redis_client.set('progress_uuid', 0)
        
        # 拿到post的数据
        data = request.get_json()
        image_url1 = Path(data['image_url1'])
        image_url2 = Path(data['image_url2'])
        weight = data['weight']
        logger.info('收到图像插值请求：')
        logger.info('图1：' + str(image_url1))
        logger.info('图2：' + str(image_url2))
        logger.info('weight:' + str(weight))

        image_path1 = Path('/mnt/disk/zjw/image_app/image_flask/images') / image_url1.name
        image_path2 = Path('/mnt/disk/zjw/image_app/image_flask/images') / image_url2.name
        gen_image_url_list = interpolations(image_path1, image_path2, weight)
        return {
            "success": True, 
            "message": '开始图像插值',
            "data": { 
                'progress_key': 'progress_uuid',
                'progress': 0,
                'gen_image_url_list': gen_image_url_list
            }
        } 
    
    except Exception as e:
        logger.info('图像插值报错', e)
        return {
            "success": False, 
            "message": '图像插值报错'+ str(e),
            "data": []
        }

# 查询是否生成完毕
@app.route('/search', methods=['GET', 'POST'])
@token_required
def search(username: str):
    logger.info(username)
    try:
        data = request.get_json()
        image_name_list: list = data['image_name_list']
        # 查询路径
        retData = []
        for image_name in image_name_list:
            image_path: Path = Path('/mnt/disk/zjw/image_app/image_flask/results') / data['mode'] / image_name
            print('查询:', str(image_path))
            if image_path.exists():
                retData.append({
                    "image_url" : f"http://10.12.13.99/results/{data['mode']}/{image_name}",
                    "exist": True
                })
            else:
                retData.append({
                    "image_url" : f"http://10.12.13.99/results/{data['mode']}/{image_name}",
                    "exist": False
                })
        # 返回图片的url list
        print(retData)
        return {
            "success": True, 
            "message": '查询图像成功',
            "data": retData
        }
    
    except Exception as e:
        logger.info('查询图像失败', e)
        return {
            "success": False, 
            "message": '查询图像失败'+ str(e),
            "data": []
        }

# 查询是否生成完毕
@app.route('/get_gen_progress', methods=['GET', 'POST'])
@token_required
def get_gen_progress(username):
    try:
        progress_key = request.get_json()['progress_key']
        progress = redis_client.get(progress_key).decode('utf-8')
        logger.info(f'用户【{username}】查询生成进度：{progress}%')
        # 返回图片的url list
        return {
            "success": True, 
            "message": '查询生成进度成功',
            "data": { 
                'progress': int(progress)
            }
        } 
    except Exception as e:
        logger.info('查询生成进度报错', e)
        return {
            "success": False, 
            "message": '查询生成进度报错'+ str(e),
            "data": None
        }

@app.route('/history', methods=['POST'])
@token_required
def get_history(username: str):
    logger.info('用户【%s】查询历史生成记录' % username)
    try:
        interpolations_dir = Path('/mnt/disk/zjw/image_app/image_flask/results/interpolations')
        variations_dir = Path('/mnt/disk/zjw/image_app/image_flask/results/variations')
        
        result_url_list = {
            "interpolations": [ "http://10.12.13.99/results/interpolations/" + path.name for path in interpolations_dir.iterdir()],
            "variations": [ "http://10.12.13.99/results/variations/" + path.name for path in variations_dir.iterdir()],
        }
        
        return {
                "success": True, 
                "message": '获取历史生成图像url成功',
                "data": result_url_list
            }
    except Exception as e:
        logger.info('获取历史生成图像url失败', e)
        return {
            "success": False, 
            "message": '获取历史生成图像url失败'+ str(e),
            "data": {
                "interpolations": [],
                "variations": [],
            }   
        }
    pass

#  ----------------------test 函数

# variations
@app.route('/test_variation_progress', methods=['GET', 'POST'])
def test_variation_progress():
    try:
        image_url = Path('http://10.12.13.99/images/20240302143738__mihui1817.jpg')
        # 本地路径
        image_path = Path('/mnt/disk/zjw/image_app/image_flask/images') / image_url.name
        save_path_list = [
            str(Path('/mnt/disk/zjw/image_app/image_flask/results/variations') / (time.strftime("%Y%m%d%H%M%S_", time.localtime()) + '_' + str(i) + '.png'))
            for i in range(2) # 至少1张，最多3张
        ]
        gen_image_url_list = variations(image_path, save_path_list)
        # 返回图片的url list
        return {
            "success": True, 
            "message": '图像变换成功',
            "data": { 
                'progress_key': 'progress_uuid',
                'gen_image_url_list': gen_image_url_list
            }
        } 
    
    except Exception as e:
        logger.info('图像变换失败', e)
        return {
            "success": False, 
            "message": '图像变换失败'+ str(e),
            "data": []
        }
# variations
@app.route('/test_search/<task_id>', methods=['GET', 'POST'])
def test_search(task_id):
    return redis_client.get(task_id).decode('utf-8')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555, debug=False)