// frontend/src/contexts/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';

import axios from 'axios';

import { toast } from 'react-toastify';



const AuthContext = createContext(null);



export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null); // เก็บข้อมูล user ที่ login แล้ว

  const [isLoading, setIsLoading] = useState(true); // สถานะการโหลดข้อมูล user ตอนเริ่ม



  // ตรวจสอบสถานะ login จาก localStorage ตอนเริ่มแอป

  useEffect(() => {

    const storedUser = localStorage.getItem('inventoryUser');

    if (storedUser) {

      try {

        setUser(JSON.parse(storedUser));

      } catch (error) {

        console.error("Error parsing stored user data:", error);

        localStorage.removeItem('inventoryUser');

      }

    }

    setIsLoading(false); // โหลดเสร็จแล้ว ไม่ว่าจะมี user หรือไม่

  }, []);



  const login = async (username, password) => {

    try {

      const response = await axios.post('/api/auth/login', { username, password });

      if (response.data.success) {

        setUser(response.data.user);

        localStorage.setItem('inventoryUser', JSON.stringify(response.data.user)); // เก็บข้อมูล user

        toast.success(response.data.message || 'เข้าสู่ระบบสำเร็จ!');

        return true;

      } else {

        // Backend ควรจะตอบกลับด้วย status ที่เหมาะสม แต่ถ้าไม่ ก็ใช้ message จาก response

        toast.error(response.data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');

        return false;

      }

    } catch (error) {

      console.error("Login error:", error);

      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');

      return false;

    }

  };



  const logout = () => {

    setUser(null);

    localStorage.removeItem('inventoryUser');

    toast.info('ออกจากระบบเรียบร้อยแล้ว');

    // ไม่ต้อง redirect ที่นี่ ให้ App.js จัดการ

  };



  // ค่าที่จะส่งผ่าน Context: user, isLoading (สำหรับเช็คตอนเริ่ม), login function, logout function

  const value = {

    user, // ถ้า user เป็น null คือยังไม่ได้ login, ถ้ามี object คือ login แล้ว

    isAuthenticated: !!user, // true ถ้า user ไม่ใช่ null

    isLoadingAuth: isLoading, // เปลี่ยนชื่อเพื่อไม่ให้สับสนกับ isLoading อื่นๆ

    login,

    logout,

  };



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

};



export const useAuth = () => {

  return useContext(AuthContext);

};