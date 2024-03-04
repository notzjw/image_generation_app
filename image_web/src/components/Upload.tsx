
/* eslint-disable*/
import { client } from "../lib/api";
import { Card, Progress, Image, CardBody } from "@nextui-org/react";
import { Dispatch, SetStateAction, useState } from 'react'
import axios, { AxiosProgressEvent, Canceler } from 'axios'


type UploadFile = {
  key: number,
  name: string, // 文件名
  progress: number, // 上传进度
  cancel: Canceler
}

type Props = {
  ImageUrl: string
  setImageUrl: Dispatch<SetStateAction<string>>
}

export default function Upload(props: Props) {
  // const [curFiles, setCurFiles] = useState<UploadFile[]>([])

  // input onChange/onDrag的回调
  const handlerUploadDoc = (e: any) => {
    const fileList: FileList = e.target.files

    new Array(fileList.length).fill('0').map(async (_, index) => {
      // 二进制流
      const formData = new FormData()
      formData.append('file', fileList[index])
      // 回调函数，用于更新上传进度
      const callbackProcessEvent = (progressEvent: AxiosProgressEvent) => {
        console.log(progressEvent.progress) // progress存放着上传进度
      }
      // source用于取消上传
      // source.token用于表示某个请求，是一个Promise类型
      // source.cancel是一个方法，当被调用时，则取消token注入的那个请求
      const source = axios.CancelToken.source();

      // 返回resp为图片的url
      const resp = await client.post(
        '/upload',
        formData,
        {
          cancelToken: source.token,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress(progressEvent) {
            callbackProcessEvent(progressEvent)
          },
        }
      ).catch(function (thrown) {
        // 判断是否是因主动取消导致的
        if (axios.isCancel(thrown)) {
          console.log('Request canceled', thrown.message);
        } else {
          // handle error
          console.error(thrown);
        }
      })

      props.setImageUrl(resp as unknown as string)
    })
  }

  //style={{padding:0}}
  return (
    <Card className="w-full aspect-square cursor-pointer" >
      <CardBody className="w-full flex flex-col items-center relative">
        <div className="w-full h-full rounded-lg ">

          <div className='inset-0 absolute flex flex-col justify-center items-center'>
            <div className='w-11/12 aspect-square border-dashed border-3 rounded-lg flex justify-center items-center whitespace-nowrap'>
              &nbsp; 上传图片 <br />
              点击 / 拖拽
            </div>
          </div>

          <div className='inset-0 absolute flex justify-center items-center '>
            <Image className="rounded-lg" src={props.ImageUrl} ></Image>
          </div>

          <input className='inset-0 z-50 absolute opacity-0 cursor-pointer' type="file" value={''} multiple onChange={e => {
            e.preventDefault()
            handlerUploadDoc(e)
          }}
            onDrag={e => {
              e.preventDefault()
              handlerUploadDoc(e)
            }}

          />

        </div>
        {/* <div className="w-full max-h-[400px] flex flex-col items-center gap-2 overflow-hidden">
          {
            curFiles.map(file => {
              return <SingleUploadDoc
                key={file.key}
                name={file.name}
                progress={file.progress * 100}
                cancel={file.cancel} />
            })
          }
        </div> */}
      </CardBody>
    </Card>
  )
}


function SingleUploadDoc(props: UploadFile) {

  console.log('【SingleUploadDoc】', props)
  const handleCancel = () => {
    console.log('取消上传')
    console.log(props)
    props.cancel('取消上传')
  }
  if (props.progress > 0) {
    handleCancel()
  }

  return (
    <div className="w-full aspect-[10/1] rounded-lg p-4">
      <div className="mb-2 flex justify-between">
        <div>{props.name}</div>
      </div>
      <Progress
        className="single-uplpad-doc-progress"
        color="success"
        size={'sm'}
        value={props.progress} />
    </div>
  )
}

