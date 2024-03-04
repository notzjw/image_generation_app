import React from 'react'
import coverImg1 from '../assets/1.png'
import coverImg2 from '../assets/2.png'
import coverImg3 from '../assets/3.png'
import coverImg4 from '../assets/4.png'

import { Card, CardHeader, CardBody, Image, Button, useDisclosure } from "@nextui-org/react";
import Text2image from '../components/Text2image';
import Image2image from '../components/Image2Image';
import ImageInterpolation from '../components/ImageInterpolation';
import TextImage2image from '../components/TextImage2image';

type AICardInfo = {
  title: string
  entitle: string
  image: any
  disclosure: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onOpenChange: () => void;
    isControlled: boolean;
    getButtonProps: (props?: any) => any;
    getDisclosureProps: (props?: any) => any;
  },
  cls: string
}

function AICard(props: AICardInfo) {
  return (
    <Card className={"w-[300px] pt-4 " + props.cls}>
      <CardHeader className="pb-0 pt-2 px-4 flex-row justify-between items-center">
        <div className='flex-col items-start'>
          <h4 className="font-bold text-large">{props.title}</h4>
          <small className="text-default-500">{props.entitle}</small>
        </div>
        <Button variant='flat' color="default" radius="lg" size='md'
          onClick={props.disclosure.onOpen}
          endContent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          }>
        </Button>
      </CardHeader>

      <CardBody className="overflow-visible flex justify-center">
        <Image
          alt="Card background"
          className="object-cover rounded-xl"
          src={props.image}
        />
      </CardBody>
    </Card>
  )
}



export default function AI({ visible }: { visible: boolean }) {

  const displaycls = visible ? 'visible' : 'hidden'

  const AICardList: AICardInfo[] = [
    {
      title: '文生图',
      entitle: 'text -> image',
      image: coverImg1,
      disclosure: useDisclosure(),
      cls: 'justify-self-end'
    },
    {
      title: '文图生图',
      entitle: 'text + image -> image',
      image: coverImg2,
      disclosure: useDisclosure(),
      cls: 'justify-self-start'
    },
    {
      title: '图像变换',
      entitle: 'image -> image',
      image: coverImg3,
      disclosure: useDisclosure(),
      cls: 'justify-self-end'
    },
    {
      title: '图像插值',
      entitle: 'image + image -> image',
      image: coverImg4,
      disclosure: useDisclosure(),
      cls: 'justify-self-start'
    }
  ]

  return (
    <div className={'w-full h-full grid grid-cols-2 place-content-center gap-10 py-4 px-12 relative ' + displaycls}>
      {
        AICardList.map(info => <AICard {...info} />)
      }
      {/* 功能页面，悬浮在上方 */}
      {
        AICardList[0].disclosure.isOpen &&
        <div className='absolute inset-0 z-40 bg-white'>
          <Text2image close={AICardList[0].disclosure.onClose} />
        </div>
      }
      {
        AICardList[1].disclosure.isOpen &&
        <div className='absolute inset-0 z-40 bg-white'>
          <TextImage2image close={AICardList[1].disclosure.onClose} />
        </div>
      }
      {
        AICardList[2].disclosure.isOpen &&
        <div className='absolute inset-0 z-40 bg-white'>
          <Image2image close={AICardList[2].disclosure.onClose} />
        </div>
      }
      {
        AICardList[3].disclosure.isOpen &&
        <div className='absolute inset-0 z-40 bg-white'>
          <ImageInterpolation close={AICardList[3].disclosure.onClose} />
        </div>
      }
    </div>
  )
}
