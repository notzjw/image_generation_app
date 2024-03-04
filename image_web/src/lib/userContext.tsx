import React, { createContext, useState, ReactNode, useEffect } from 'react'
import { api } from './api'

type Props = {
  children: ReactNode
}

export type UserState = {
  email: string,
  username: string,
  avatarUrl: string,
  state: 'online' | 'offline'
}
export const defaultUserState: UserState = {
  email: '',
  username: '',
  avatarUrl: '',
  state: 'offline'
}

const userContext = createContext<
  [
    UserState,
    React.Dispatch<React.SetStateAction<UserState>>,
  ]
>(
  [
    defaultUserState,
    () => { }
  ]
)

const UserProvider: React.FC<Props> = ({ children }) => {

  const [userState, setUserState] = useState<UserState>(defaultUserState)
  // 自动登录
  useEffect(() => {
    console.log('尝试自动登录')
    api.user.autologin().then(
      (resp) => {
        if (resp.success) {
          setUserState(resp.data)
        }
      }
    )
  }, [])
  console.log('用户信息刷新 ', userState)
  return (
    <userContext.Provider value={[userState, setUserState]}>
      {children}
    </userContext.Provider>
  )
}

export { userContext, UserProvider }