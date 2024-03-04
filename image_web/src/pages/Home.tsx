import React from 'react'
import cover from '../assets/5.png'

export default function Home({ visible }: { visible: boolean }) {
    const displaycls = visible ? 'visible' : 'hidden'
    return (
        <div className={"w-full h-full flex flex-col " + displaycls}>
            {/* <NavBar defaultSelectedKey='Home'/> */}
            <div className='flex-grow flex flex-col-reverse md:flex-row justify-around items-center'>
                <div className='animate-slideBottom flex flex-col gap-4'>
                    <p className='md:mt-2 text-4xl text-center md:text-left font-mono'>你好,欢迎使用</p>
                    <p className='text-6xl text-center font-bold md:text-left font-mono'>数码印花智能生成软件</p>
                </div>
                <img src={cover} alt='avatar'
                    className='w-2/4 md:w-1/4 aspect-square object-contain rounded-full shadow-lg shadow-gray-400 animate-zoomInAndFloat' />
            </div>
        </div>
    )
}
