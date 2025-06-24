import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // App.tsxへのパスを修正
import './index.css'; // index.cssをインポート

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);