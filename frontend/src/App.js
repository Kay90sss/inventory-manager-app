// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Heroicons
import {
  ChartBarIcon,
  CubeIcon,
  UsersIcon,
  ShoppingCartIcon,
  ArchiveBoxArrowDownIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon // ไอคอนสำหรับ "ยอดค้างชำระ"
} from '@heroicons/react/24/outline';

// Auth Context
import { AuthProvider, useAuth } from './contexts/AuthContext'; // ตรวจสอบ path ให้ถูกต้อง

// Page Components
import DashboardPage from './pages/DashboardPage';
import ProductPage from './pages/ProductPage';
import CustomerPage from './pages/CustomerPage';
import CreateSalePage from './pages/CreateSalePage';
import ReceiveStockPage from './pages/ReceiveStockPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SaleDetailPage from './pages/SaleDetailPage';
import CustomerSalesHistoryPage from './pages/CustomerSalesHistoryPage';
import OutstandingSalesPage from './pages/OutstandingSalesPage';

// Layout Component (Sidebar, Navbar, Logout button with Icons)
function Layout() {
  const { user, logout } = useAuth();

  const navLinkClasses = ({ isActive }) =>
    `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ease-in-out group ${
      isActive
        ? 'bg-sky-700 text-white shadow-md'
        : 'text-sky-100 hover:bg-sky-600 hover:text-white'
    }`;

  const iconClass = "h-6 w-6 mr-3 text-sky-300 group-hover:text-white transition-colors";
  const activeIconClass = "h-6 w-6 mr-3 text-white";

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sky-800 text-white flex flex-col shadow-lg">
        <div className="px-6 py-5 border-b border-sky-700">
          <h1 className="text-2xl font-bold text-center">InventoryPro</h1>
          {user && <p className="text-xs text-center text-sky-300 mt-1">สวัสดี, {user.name || user.username}</p>}
        </div>
        <nav className="flex-grow px-4 py-4 space-y-2">
          <NavLink to="/" end className={navLinkClasses}>
            {({ isActive }) => (<><ChartBarIcon className={isActive ? activeIconClass : iconClass} />Dashboard</>)}
          </NavLink>
          <NavLink to="/products" className={navLinkClasses}>
            {({ isActive }) => (<><CubeIcon className={isActive ? activeIconClass : iconClass} />จัดการสินค้า</>)}
          </NavLink>
          <NavLink to="/customers" className={navLinkClasses}>
            {({ isActive }) => (<><UsersIcon className={isActive ? activeIconClass : iconClass} />จัดการลูกค้า</>)}
          </NavLink>
          <NavLink to="/sales/create" className={navLinkClasses}>
            {({ isActive }) => (<><ShoppingCartIcon className={isActive ? activeIconClass : iconClass} />สร้างใบขาย</>)}
          </NavLink>
          <NavLink to="/sales-history" className={navLinkClasses}>
            {({ isActive }) => (<><ClipboardDocumentListIcon className={isActive ? activeIconClass : iconClass} />ประวัติการขาย</>)}
          </NavLink>
          {/* VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV */}
          {/* แก้ไข NavLink สำหรับ "ยอดค้างชำระ" ให้แสดงไอคอนและข้อความถูกต้อง         */}
          <NavLink to="/outstanding-sales" className={navLinkClasses}>
            {({ isActive }) => (
              <>
                <BanknotesIcon className={isActive ? activeIconClass : iconClass} />
                ยอดค้างชำระ
              </>
            )}
          </NavLink>
          {/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
          <NavLink to="/stock/receive" className={navLinkClasses}>
            {({ isActive }) => (<><ArchiveBoxArrowDownIcon className={isActive ? activeIconClass : iconClass} />รับสินค้าเข้า</>)}
          </NavLink>
          <NavLink to="/reports" className={navLinkClasses}>
            {({ isActive }) => (<><DocumentChartBarIcon className={isActive ? activeIconClass : iconClass} />รายงาน</>)}
          </NavLink>
        </nav>
        <div className="px-4 py-4 mt-auto border-t border-sky-700">
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 ease-in-out flex items-center justify-center group"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-red-300 group-hover:text-white transition-colors" />
            ออกจากระบบ
          </button>
          <p className="text-xs text-sky-300 text-center mt-3">&copy; {new Date().getFullYear()} InventoryPro</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-700">Inventory Management System</h2>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-600"></div><p className="ml-3">กำลังโหลด...</p></div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Main Application Content Router
function AppContent() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-600"></div><p className="ml-3">กำลังเริ่มต้นระบบ...</p></div>;
  }
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductPage />} />
        <Route path="customers" element={<CustomerPage />} />
        <Route path="customers/:customerId/sales-history" element={<CustomerSalesHistoryPage />} />
        <Route path="sales/create" element={<CreateSalePage />} />
        <Route path="sales-history" element={<SalesHistoryPage />} />
        <Route path="sales-history/:saleId" element={<SaleDetailPage />} />
        <Route path="outstanding-sales" element={<OutstandingSalesPage />} />
        <Route path="stock/receive" element={<ReceiveStockPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<div className="p-6"><h1 className="text-2xl font-bold">404 - ไม่พบหน้า</h1><p>ขออภัย, ไม่พบหน้าที่คุณกำลังค้นหา</p></div>} />
      </Route>
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
