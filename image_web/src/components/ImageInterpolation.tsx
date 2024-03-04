import { Button, Textarea, Image, Radio, RadioGroup, Switch, CircularProgress, Tabs, Card, Tab, CardBody, Slider } from '@nextui-org/react';
import { api, client } from '../lib/api';
import Upload from './Upload';
import { useEffect, useState } from 'react';
type Props = {
  close: () => void;
}

let interval: string | number | NodeJS.Timer | undefined;

export default function ImageInterpolation(props: Props) {
  // 是否生成中间连续渐变图。特征权重为 0.2 0.4 0.6 0.8
  const [flag, setFlag] = useState<boolean>(true)
  // 权重
  const [weight, setWeight] = useState<number>(0.5)
  // 输入图片，会显示在输入栏中
  const [ImageUrl1, setImageUrl1] = useState<string>('')
  // 输入图片，会显示在输入栏中
  const [ImageUrl2, setImageUrl2] = useState<string>('')
  // 存放生成图的url和是否生成完毕标志
  const [genImageData, setGenImageData] = useState<{ progress_key: string, progress: number, gen_image_url_list: string[] }>({ progress_key: '', progress: 0, gen_image_url_list: [] })


  console.log(ImageUrl1, ImageUrl2)
  console.log(genImageData)

  const generate_image = async () => {
    // 1、先发出图生图请求，拿到生成图像的name
    const resp = await api.ai.imageInterpolation(ImageUrl1, ImageUrl2, flag ? -1 : weight)
    if (resp.success) {
      setGenImageData(resp.data)
      // 2、轮询后端，每隔1秒查询是否生成完毕
      if (interval) {
        clearInterval(interval)
      }
      interval = setInterval(async () => {
        // 否则持续查询
        const value = await api.util.search(resp.data.progress_key)
        if (value.success) {
          setGenImageData(prev => ({ ...prev, progress: value.data.progress }))
        }
        // 如果结果都生成完毕，将timer删除
        if (value.data.progress >= 100) {
          console.log('清除定时器', genImageData)
          clearInterval(interval)
          return
        }
      }, 1000)
    }
  }

  const reset = () => {
    setImageUrl1('')
    setImageUrl2('')
    setGenImageData({ progress_key: '', progress: 0, gen_image_url_list: [] })
  }

  return (
    <div className='w-full h-full px-4 flex flex-col gap-10 justify-start'>
      {/* 顶部为操作栏 */}
      <div className='flex flex-row justify-center gap-10 items-start'>
        <Button onClick={props.close} endContent={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M7.28 7.72a.75.75 0 0 1 0 1.06l-2.47 2.47H21a.75.75 0 0 1 0 1.5H4.81l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        }>
          返回
        </Button>
        <div className='flex flex-row items-center gap-8'>
          <div className='flex flex-col relative'>
            <Slider
              size="lg"
              step={0.1}
              color="foreground"
              label={weight}
              showSteps={true}
              maxValue={1}
              minValue={0}
              isDisabled={flag}
              defaultValue={weight}
              hideValue
              onChange={e => setWeight(e as number)}
              className="max-w-md"
            />
            <div className='top-0 right-0 absolute'>
              {Math.ceil((1 - weight) * 10) / 10}
            </div>
            <div className='top-0 inset-x-0 absolute flex justify-center'>
              特征权重
            </div>
            <div className='flex flex-row items-center gap-2'>
              <div className='w-[100px]'>
                <Upload ImageUrl={ImageUrl1} setImageUrl={setImageUrl1} />
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <div className='w-[100px]'>
                <Upload ImageUrl={ImageUrl2} setImageUrl={setImageUrl2} />
              </div>
            </div>
          </div>
          <div className='flex flex-col justify-end gap-2'>
            <Switch defaultSelected={flag} onValueChange={e => setFlag(e)} >
              渐变图
            </Switch>
            <Button onClick={generate_image} endContent={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>}
            >
              生成
            </Button>
            <Button onClick={reset} endContent={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>}
            >
              清空
            </Button>
          </div>
        </div>
        <div></div>
      </div>
      {/* 下方为生成图展示区域 */}
      <div className='w-full h-full flex flex-row justify-center gap-4'>
        {/* <div className='h-full flex justify-center items-start'>
          <Image
            shadow='md'
            alt="Card background"
            src='http://10.12.13.99/results/interpolations/%e6%b8%90%e5%8f%98%e5%9b%be_20240302160654__mihui1817__20240302160658__mihui1843.png'
          />
        </div> */}
        {
          genImageData.gen_image_url_list.map((image_url, index) => {
            if (genImageData.progress >= 100) {
              return (
                <div className='h-full flex justify-center items-start'>
                  <Image
                    key={index}
                    shadow='md'
                    alt="Card background"
                    src={image_url}
                  />
                </div>
              )
            } else {
              return (<div className='aspect-square border-2 rounded-2xl shadow-md flex justify-center items-center' key={index}>
                <CircularProgress
                  classNames={{
                    svg: "w-2/3 h-2/3 m-auto drop-shadow-md",
                    track: "stroke-white/10",
                    value: "text-4xl font-bold",
                    label: "text-lg font-semibold",
                  }}
                  value={genImageData.progress}
                  showValueLabel={true}
                  strokeWidth={4}
                  label='generating...'
                />
              </div>)
            }
          }
          )
        }
      </div>
    </div >
  )
}
