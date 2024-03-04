import Home from './pages/Home';
import AI from './pages/AI';
import History from './pages/History';
import Personal from './pages/Personal';
import { Link, Tab, Tabs, User } from '@nextui-org/react';
import { useContext, useState } from 'react';
import PhotoGallery from './components/PhotoGallery';
import { userContext } from './lib/userContext';

function App() {

  const [userState, _] = useContext(userContext)
  const pageList = [
    { name: '首页', key: 'Home' },
    { name: 'AI生成', key: 'AI' },
    { name: '历史生成', key: 'History' },
    { name: '印花商城', key: 'Store' },
    { name: '个人主页', key: 'Personal' },
  ]

  const [curPage, setCurPage] = useState('Home')

  return (
    <div className="App w-screen h-screen flex flex-col" >
      <div className="w-screen h-[100px] fixed p-4 flex flex-row justify-around items-center bg-transparent backdrop-blur-md z-50">
        <div className='hidden md:block'>
          <p className="text-3xl font-mono font-bold pt-3">🤖</p>
        </div>
        <Tabs
          selectedKey={curPage}
          color="primary"
          variant="underlined"
          classNames={{
            tabList: "gap-10 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-[#12A150]",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-[#12A150]"
          }}>
          {
            pageList.map((page) =>
              <Tab
                key={page.key}
                title={
                  <div className="flex items-center" onClick={() => setCurPage(page.key)}>
                    <span className="text-3xl font-mono font-bold">{page.name}</span>
                  </div>
                }
              />
            )
          }
        </Tabs >
        <User
          className='cursor-pointer hover:bg-slate-100'
          onClick={() => setCurPage('Personal')}
          name={userState.username}
          description="个人用户"
          avatarProps={{
            src: userState.state ==='offline' ? "" :"https://notzjw.top/document/notworld/src/asserts/ailun.jpg"
          }}
        />
      </div>

      <div className='w-screen h-[100px] flex-shrink-0'></div>

      <AI visible={curPage === 'AI'} />
      <Home visible={curPage === 'Home'} />
      <PhotoGallery visible={curPage === 'History'} />
      <History visible={curPage === 'Store'} />
      <Personal visible={curPage === 'Personal'} />

      <div className='w-screen h-[50px] flex flex-row justify-around items-center flex-shrink-0'>
        {/* <div>
          版权信息
        </div>
        <div>
          版权信息
        </div>
        <div>
          版权信息
        </div> */}
      </div>
    </div>
  );
}

export default App;