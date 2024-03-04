import { Button, Textarea, Image, Radio, RadioGroup, Switch, CircularProgress, Tabs, Tab, Code, Snippet } from '@nextui-org/react';
import patternImg from '../assets/MH0771308_原图.jpg'
import { api } from '../lib/api';
import Upload from './Upload';
import { useState } from 'react';

type Props = {
  close: () => void;
}

let interval: string | number | NodeJS.Timer | undefined;

export default function Text2image(props: Props) {


  // api.ai.text2image()
  // 生成几张图
  const [text, setText] = useState<string>('')
  // 生成几张图
  const [gen_num, setGen_num] = useState<number>(1)
  // 存放生成图的url和是否生成完毕标志
  const [genImageData, setGenImageData] = useState<{ progress_key: string, progress: number, gen_image_url_list: string[] }>({ progress_key: '', progress: 0, gen_image_url_list: [] })

  const generate_image = async () => {
    // 1、先发出图生图请求，拿到生成图像的name
    const resp = await api.ai.text2image(text, gen_num)
    if (resp.success) {
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
  return (
    <div className='w-full h-full px-8 flex flex-col gap-8'>
      {/* 顶部为操作栏 */}
      <div className='flex flex-row justify-center gap-10 items-start'>
        <Button onClick={props.close} endContent={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M7.28 7.72a.75.75 0 0 1 0 1.06l-2.47 2.47H21a.75.75 0 0 1 0 1.5H4.81l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        }>
          返回
        </Button>
        <div className='h-full flex flex-row gap-4'>
          <Textarea
            labelPlacement="outside"
            placeholder="Enter your description"
            className="max-w-xs"
            onChange={e => e.target}
          />
          <div className='flex flex-col justify-between'>
            <Tabs aria-label="Options" onSelectionChange={e => setGen_num(+(e as number))}>
              <Tab key={1} title="1">
              </Tab>
              <Tab key={2} title="2">
              </Tab>
              <Tab key={3} title="3">
              </Tab>
            </Tabs>
            <Button onClick={generate_image} endContent={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>}
            >
              生成
            </Button>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-1'>
          <Snippet symbol='' color="default">white flowers on a blue background</Snippet>
          <Snippet symbol='' color="default">butterfly, animal pattern</Snippet>
        </div>

      </div>
      {/* 下方为生成图展示区域 */}
      <div className='h-3/4 flex flex-row justify-center gap-4'>
        <div className='aspect-square border-2 rounded-2xl shadow-md flex justify-center items-center'>
          <CircularProgress
            classNames={{
              svg: "w-2/3 h-2/3 m-auto m-auto drop-shadow-md",
              track: "stroke-white/10",
              value: "text-4xl font-bold",
              label: "text-lg font-semibold",
            }}
            value={23}
            showValueLabel={true}
            strokeWidth={4}
            label='generating...'
          />
        </div>
        <div className='aspect-square border-2 rounded-2xl shadow-md flex justify-center items-center' >
          <CircularProgress
            classNames={{
              svg: "w-2/3 h-2/3 m-auto drop-shadow-md",
              track: "stroke-white/10",
              value: "text-4xl font-bold",
              label: "text-lg font-semibold",
            }}
            value={99}
            showValueLabel={true}
            strokeWidth={4}
            label='generating...'
          />
        </div>
        <div className='aspect-square flex justify-center items-center'>
          <Image
            shadow='md'
            alt="Card background"
            src={'http://10.12.13.99/results/variations/20240304195951__0.png'}
          />
        </div>

        {
          genImageData.gen_image_url_list.map((image_url, index) => {
            if (genImageData.progress >= 100) {
              return (
                <div className='h-full aspect-square flex justify-center items-center'>
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
                  value={11}
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

    </div>
  )
}
