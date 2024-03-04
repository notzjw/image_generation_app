/* eslint-disable */
import axios from 'axios'
import { RegisterData } from '../pages/Personal'
import { UserState } from './userContext'

export const client = axios.create({
    baseURL: 'http://10.12.13.99/cdm',
    timeout: 10000, // 10s
    headers: {
        'Access-Control-Allow-Origin': "POST, GET, OPTIONS, DELETE",
    }
})
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

/**
 * 请求拦截器
 */
client.interceptors.request.use(
    config => {
        // console.log(`Request To ${config.url}`, config.data)
        return config
    },
    error => {
        // console.log('请求拦截器 error', error)
        httpErrorStatusHandle(error)
        return Promise.reject(error)
    }
)

/**
 * 响应拦截器
 */
client.interceptors.response.use(
    /**
    * 传输层：接口正常或异常，用http状态码
    * 业务层：业务正常或异常，用自定义状态码
    */
    // 请求成功 
    response => {
        // console.log(`Response From ${response.config.url}`, response)
        return response.data
    },
    error => {
        // console.log('响应拦截器 error', error)
        if (error.response) {
        } else {
            // console.log('响应拦截器 error', error)
        }
    }
)

/**
 * 后端返回code统一处理
 * @param url  请求url
 * @param data 后端返回信息
 */
const errorHandle = (url: string | undefined, data: ResponseData<any>) => {
    if (!url) return
    switch (url) {
        case '/users/info':
    }
}

/**
 * 处理异常
 * @param {*} error 
 */
function httpErrorStatusHandle(error: any) {
    // 处理被取消的请求
    // if(axios.isCancel(error)) return console.error('请求的重复请求：' + error.message);

    let message = '';
    if (error && error.response) {
        switch (error.response.status) {
            case 302: message = '接口重定向了！'; break;
            case 400: message = '参数不正确！'; break;
            case 401: message = '您未登录，或者登录已经超时，请先登录！'; break;
            case 403: message = '您没有权限操作！'; break;
            case 404: message = `请求地址出错: ${error.response.config.url}`; break; // 在正确域名下
            case 408: message = '请求超时！'; break;
            case 409: message = '系统已存在相同数据！'; break;
            case 500: message = '服务器内部错误！'; break;
            case 501: message = '服务未实现！'; break;
            case 502: message = '网关错误！'; break;
            case 503: message = '服务不可用！'; break;
            case 504: message = '服务暂时无法访问，请稍后再试！'; break;
            case 505: message = 'HTTP版本不受支持！'; break;
            default: message = '异常问题，请联系管理员！'; break
        }
    }
    if (error.message.includes('timeout')) message = '网络请求超时！';
    if (error.message.includes('Network')) message = window.navigator.onLine ? '服务端异常！' : '您断网了！';
}


export type ResponseData<data> = Promise<{
    success: number,
    message: string,
    data: data
}>

// 定义接口 api
export const api = {
    user: {
        ping:
            () => {
                return client.post('/ping')
            },
        emailverify:
            (email: string): ResponseData<null> => {
                return client.post('/emailverify', { email: email })
            },
        register:
            (registerData: RegisterData): ResponseData<null> => {
                return client.post('/register', registerData)
            },
        login:
            (username: string, password: string): ResponseData<UserState> => {
                return client.post('/login', { username: username, password: password })
            },
        autologin:
            (): ResponseData<UserState> => {
                return client.post('/autologin')
            },
    },
    ai: {
        text2image:
            (text: string, gen_num: number):
                ResponseData<{ progress_key: string, progress: number, gen_image_url_list: string[] }> => {
                return client.post('/text2image', {
                    text: text,
                    gen_num: gen_num,
                })
            },
        image2image:
            (image_url: string, gen_num: number):
                ResponseData<{ progress_key: string, progress: number, gen_image_url_list: string[] }> => {
                return client.post('/variations', {
                    image_url: image_url,
                    gen_num: gen_num,
                })
            },
        imageInterpolation:
            (image_url1: string, image_url2: string, weight: number):
                ResponseData<{ progress_key: string, progress: number, gen_image_url_list: string[] }> => {
                return client.post('/interpolations', {
                    image_url1: image_url1,
                    image_url2: image_url2,
                    weight: weight,
                })
            },
    },
    util: {
        search:
            (progress_key: string):
                ResponseData<{ progress: number }> => {
                return client.post('/get_gen_progress', {
                    progress_key: progress_key
                })
            },
        history:
            ():
                ResponseData<{ variations: string[], interpolations: string[] }> => {
                return client.post('/history')
            },
    }
}

