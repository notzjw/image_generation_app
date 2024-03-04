import React from 'react';
import { NextUIProvider } from "@nextui-org/react";
import { BrowserRouter } from 'react-router-dom';

import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import { UserProvider } from './lib/userContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <NextUIProvider>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </NextUIProvider>
);
