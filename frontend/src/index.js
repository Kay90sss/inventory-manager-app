import './print-styles.css'; // เพิ่ม path ให้ถูกต้องถ้าจำเป็น
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios'; // <-- เพิ่มบรรทัดนี้

// เพิ่มโค้ด 2 บรรทัดนี้ (ใต้ imports)
axios.defaults.baseURL = process.env.REACT_APP_API_URL;
console.log("API Base URL:", axios.defaults.baseURL); // บรรทัดนี้สำหรับ Debug เท่านั้น ลบทิ้งได้เมื่อใช้งานจริง
// จบส่วนที่เพิ่ม

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();