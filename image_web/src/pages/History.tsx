import { Image } from '@nextui-org/react';
import { api } from '../lib/api';
import { useEffect, useState } from 'react';

export default function History({ visible }: { visible: boolean }) {
  const displaycls = visible ? 'visible' : 'hidden'

  const [historyGeneration, setHistoryGeneration] = useState<{ variations: string[], interpolations: string[] }>({ variations: [], interpolations: [] })
  useEffect(() => {
    api.util.history().then(resp => {
      if (resp.success) {
        setHistoryGeneration(resp.data)
      }
    })
  }, [])
  return (
    <div className={'w-full h-full pt-4 pb-20 px-40 flex flex-wrap justify-items-center items-center gap-4 overflow-scroll ' + displaycls}>
      {
        historyGeneration.variations.map((imageUrl, index) =>
          <Image
            classNames={{
              img: 'h-[150px]'
            }}
            key={index}
            shadow='md'
            alt="Card background"
            src={imageUrl}
          />
        )
      }
      {
        historyGeneration.interpolations.map((imageUrl, index) =>
          <Image
            classNames={{
              img: 'h-[150px]'
            }}
            key={index}
            shadow='md'
            alt="Card background"
            src={imageUrl}
          />
        )
      }
    </div>
  )
}
