// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom'; // เราจะให้ App.js redirect

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  // const navigate = useNavigate(); // ไม่จำเป็นต้องใช้ navigate ที่นี่ถ้า App.js จัดการ redirect

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await login(username, password);
    if (success) {
      // ไม่ต้อง navigate ที่นี่ ให้ App.js จัดการการแสดงผล component ตาม isAuthenticated
      // navigate('/'); // Redirect to dashboard or main page
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 to-indigo-700 p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-sky-700 mb-8">
          InventoryPro Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="เช่น admin หรือ user"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="คือ password123"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-medium text-white transition duration-150 ease-in-out ${
                isLoggingIn
                  ? 'bg-sky-400 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
              }`}
            >
              {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </form>
        <p className="text-xs text-center text-gray-500 mt-6">
          (User ทดสอบ: admin/password123 หรือ user/password123)
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
