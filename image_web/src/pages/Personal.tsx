import { Card, CardBody, CardHeader, User, Image, Code, CardFooter, Button, Input, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, Checkbox, Link, ModalFooter, useDisclosure } from '@nextui-org/react'
import React, { useContext, useState } from 'react'
import { api } from '../lib/api'
import { defaultUserState, userContext } from '../lib/userContext'

export type RegisterData = {
  email: string,
  username: string,
  password1: string,
  password2: string,
  code: string
}


export default function Personal({ visible }: { visible: boolean }) {

  const displaycls = visible ? ' visible' : ' hidden'

  // 当前用户
  const [userState, setUserState] = useContext(userContext)
  // 注册
  const [userRegisterData, setUserRegisterData] = useState({ email: '', username: '', password1: '', password2: '', code: '' })
  const user_register = async () => {
    const resp = await api.user.register(userRegisterData)
    window.alert(resp.message)
  }
  // 登录
  const [userLoginData, setUserLoginData] = useState({ username: '', password: '' })
  const user_login = async () => {
    const resp = await api.user.login(userLoginData.username, userLoginData.password)
    if (resp.success) {
      setUserState(resp.data)
    }
    window.alert(resp.message)
  }
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    // <div className={"w-full h-full flex flex-col items-center" + displaycls}>
    //   <>
    //     <Button onPress={onOpen} color="primary">Open Modal</Button>
    //     <Modal
    //       backdrop='blur' 
    //       isOpen={isOpen}
    //       onOpenChange={onOpenChange}
    //       placement="top-center"
    //     >
    //       {/* <ModalContent>
    //         {(onClose) => (
    //           <>
    //             <ModalHeader className="flex flex-col gap-1">注册</ModalHeader>
    //             <ModalBody>
    //             <Input
    //                 autoFocus
    //                 // endContent={
    //                 //   <MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
    //                 // }
    //                 label="邮箱"
    //                 variant="bordered"
    //               />
    //               <Input
    //                 autoFocus
    //                 // endContent={
    //                 //   <MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
    //                 // }
    //                 label="用户名"
    //                 variant="bordered"
    //               />
    //               <Input
    //                 // endContent={
    //                 //   <LockIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
    //                 // }
    //                 label="密码"
    //                 type="password"
    //                 variant="bordered"
    //               />
    //               <Input
    //                 // endContent={
    //                 //   <LockIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
    //                 // }
    //                 label="邮箱验证码"
    //                 type="text"
    //                 variant="bordered"
    //               />
    //               <div className="flex py-2 px-1 justify-between">
    //               </div>
    //             </ModalBody>
    //             <ModalFooter>
    //               <Button color="primary" variant="flat" onPress={onClose}>
    //                 获取验证码
    //               </Button>
    //               <Button color="primary" onPress={onClose}>
    //                 注册
    //               </Button>
    //             </ModalFooter>
    //           </>
    //         )}
    //       </ModalContent> */}
    //       <ModalContent>
    //         {(onClose) => (
    //           <>
    //             <ModalHeader className="flex flex-col gap-1">登陆</ModalHeader>
    //             <ModalBody>
    //               <Input
    //                 autoFocus
    //                 // endContent={
    //                 //   <MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
    //                 // }
    //                 label="邮箱"
    //                 placeholder="Enter your email"
    //                 variant="bordered"
    //               />
    //               <Input
    //                 // endContent={
    //                 //   <LockIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
    //                 // }
    //                 label="密码"
    //                 placeholder="Enter your password"
    //                 type="password"
    //                 variant="bordered"
    //               />
    //               <div className="flex py-2 px-1 justify-between">
    //                 <Checkbox
    //                   classNames={{
    //                     label: "text-small",
    //                   }}
    //                 >
    //                   记住密码
    //                 </Checkbox>
    //                 <Link color="primary" href="#" size="sm">
    //                   忘记密码?
    //                 </Link>
    //               </div>
    //             </ModalBody>
    //             <ModalFooter>
    //               <Button color="danger" variant="flat" onPress={onClose}>
    //                 关闭
    //               </Button>
    //               <Button color="primary" onPress={onClose}>
    //                 登录
    //               </Button>
    //             </ModalFooter>
    //           </>
    //         )}
    //       </ModalContent>
    //     </Modal>
    //   </>
    // </div>
    <div className={"w-full h-full flex flex-col items-center" + displaycls}>
      <div className='w-1/3 h-full'>
        {/* 在线 */
          userState.state === 'online' &&
          < Card className="h-full py-4">
            <CardHeader className="pb-0 pt-2 px-8 flex-col items-start">
              <User
                classNames={{
                  name: 'text-xl',
                  description: 'text-md'
                }}
                name={userState.username}
                description="个人用户"
                avatarProps={{
                  size: 'lg',
                  src: "https://notzjw.top/document/notworld/src/asserts/ailun.jpg"
                }} />
            </CardHeader>
            <CardBody className="overflow-visible px-8 py-2 mt-4">
              <Code className='text-xl bg-transparent' color="default">出生日期： xxxx年xx月xx日</Code>
              <Code className='text-xl bg-transparent' color="default">电子邮箱： {userState.email}</Code>
              <Code className='text-xl bg-transparent' color="default">电话号码： xxxxxxxxx</Code>
              <Code className='text-xl bg-transparent' color="default">所在地区： 浙江</Code>
              <Code className='text-xl bg-transparent' color="default">从事行业： 学生</Code>
            </CardBody>
            <CardFooter>
              <Button className='m-auto'>编辑</Button>
              <Button className='m-auto' onClick={() => setUserState(defaultUserState)}>登出</Button>
            </CardFooter>
          </Card>
        }
        {/* 登录 / 注册 */
          userState.state === 'offline' &&
          <Card className="h-full py-4">
            <CardBody className="w-full flex flex-col justify-start items-center gap-4  py-2 mt-4">
              <Tabs aria-label="Options">
                <Tab key="logining" title="登录" >
                  <div className="flex flex-col gap-4">
                    <Input
                      type="text"
                      label="用户名"
                      placeholder="username"
                      value={userLoginData.username}
                      onValueChange={value => setUserLoginData(prev => ({ ...prev, username: value }))}
                      labelPlacement="outside-left"
                      endContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      }
                    />
                    <Input
                      type="password"
                      label="密&emsp;码"
                      placeholder="password"
                      value={userLoginData.password}
                      onValueChange={value => setUserLoginData(prev => ({ ...prev, password: value }))}
                      labelPlacement="outside-left"
                      endContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                      }
                    />
                    <Button className='m-auto' onClick={user_login}>OK😄</Button>
                  </div>
                </Tab>
                <Tab key="registering" title="注册" >
                  <div className="flex flex-col gap-4">
                    <Input
                      type="email"
                      label="邮&emsp;箱"
                      placeholder="you@example.com"
                      value={userRegisterData.email}
                      onValueChange={value => setUserRegisterData(prev => ({ ...prev, email: value }))}
                      labelPlacement="outside-left"
                      endContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                      }
                    />
                    <Input
                      type="text"
                      label="用户名"
                      placeholder="username"
                      value={userRegisterData.username}
                      onValueChange={value => setUserRegisterData(prev => ({ ...prev, username: value }))}
                      labelPlacement="outside-left"
                      endContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>

                      }
                    />
                    <Input
                      type="password"
                      label="密&emsp;码"
                      placeholder="password"
                      value={userRegisterData.password1}
                      onValueChange={value => setUserRegisterData(prev => ({ ...prev, password1: value }))}
                      labelPlacement="outside-left"
                      endContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>

                      }
                    />
                    <Input
                      type="password"
                      label="密&emsp;码"
                      placeholder="password"
                      value={userRegisterData.password2}
                      onValueChange={value => setUserRegisterData(prev => ({ ...prev, password2: value }))}
                      labelPlacement="outside-left"
                      endContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                      }
                    />
                    <Input
                      type="text"
                      label="验证码"
                      placeholder="131242"
                      value={userRegisterData.code}
                      onValueChange={value => setUserRegisterData(prev => ({ ...prev, code: value }))}
                      labelPlacement="outside-left"
                      endContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                      }
                    />
                    <div className='flex flex-row justify-around'>
                      <Button className='m-auto' onClick={user_register}>OK😄</Button>
                      <Button className='m-auto' onClick={() => api.user.emailverify(userRegisterData.email)}>验证码</Button>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        }
      </div>
    </div >
  )
}
