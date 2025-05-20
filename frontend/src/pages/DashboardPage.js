// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // เพิ่ม Link สำหรับคลิกไปยังรายละเอียดการขาย
// ตรวจสอบให้แน่ใจว่าได้ import ไอคอนที่ต้องการทั้งหมดแล้ว
import { 
    ChartBarIcon as CubeIconForCard,
    UsersIcon as UsersIconForCard, 
    CurrencyDollarIcon, 
    ExclamationTriangleIcon,
    UserGroupIcon,
    ShoppingCartIcon // ไอคอนสำหรับการสั่งซื้อล่าสุด
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Icon Components
const ProductStatIcon = () => <CubeIconForCard className="h-10 w-10 md:h-12 md:w-12 text-white opacity-80" />;
const CustomerStatIcon = () => <UsersIconForCard className="h-10 w-10 md:h-12 md:w-12 text-white opacity-80" />;
const SalesTodayStatIcon = () => <CurrencyDollarIcon className="h-10 w-10 md:h-12 md:w-12 text-white opacity-80" />;
const LowStockStatIcon = () => <ExclamationTriangleIcon className="h-10 w-10 md:h-12 md:w-12 text-white opacity-80" />;
const OutstandingCustomerStatIcon = () => <UserGroupIcon className="h-10 w-10 md:h-12 md:w-12 text-white opacity-80" />;
const RecentSaleIcon = () => <ShoppingCartIcon className="h-6 w-6 text-blue-500" />; // ไอคอนสำหรับรายการสั่งซื้อล่าสุด


const DashboardPage = () => {
  console.log("DashboardPage component rendering...");

  const [summaryData, setSummaryData] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    salesToday: 0,
    lowStockItems: 0,
    outstandingCustomers: 0,
  });
  const [salesChartData, setSalesChartData] = useState([]);
  const [recentSales, setRecentSales] = useState([]); // State ใหม่สำหรับเก็บข้อมูลการสั่งซื้อล่าสุด
  const [isLoading, setIsLoading] = useState(true); // ใช้ isLoading ตัวเดียวสำหรับข้อมูล Dashboard ทั้งหมด
  const [error, setError] = useState(null);

  const lastFetchedDateRef = useRef(new Date().toISOString().split('T')[0]);

  const fetchDashboardData = useCallback(async () => {
    console.log("[Frontend] fetchDashboardData called");
    setIsLoading(true);
    setError(null);
    try {
      const promises = [
        axios.get('/api/products?page=1&limit=1'),
        axios.get('/api/customers?page=1&limit=1'),
        axios.get('/api/reports/sales-today-summary'),
        axios.get('/api/products/low-stock/count?threshold=10'),
        axios.get('/api/reports/weekly-sales-chart'),
        axios.get('/api/customers/outstanding/count'),
        axios.get('/api/sales/recent?limit=5') // <<< เรียก API ใหม่สำหรับ Recent Sales (ดึง 5 รายการ)
      ];
      const [
        productsSummaryRes, 
        customersSummaryRes, 
        salesTodayRes, 
        lowStockRes, 
        weeklySalesChartRes,
        outstandingCustomersRes,
        recentSalesRes // <<< รับผลลัพธ์จาก API ใหม่
      ] = await Promise.all(promises);

      setSummaryData({
        totalProducts: productsSummaryRes.data?.totalItems || 0,
        totalCustomers: customersSummaryRes.data?.totalItems || 0,
        salesToday: salesTodayRes.data?.totalSalesAmount || 0,
        lowStockItems: lowStockRes.data?.count || 0,
        outstandingCustomers: outstandingCustomersRes.data?.count || 0,
      });

      if (Array.isArray(weeklySalesChartRes.data)) {
        const formattedChartData = weeklySalesChartRes.data.map(item => {
          const itemDate = new Date(item.date + 'T00:00:00');
          return {
            dateISO: item.date,
            name: itemDate.toLocaleDateString('th-TH', { weekday: 'short' }),
            sales: item.sales,
          };
        });
        setSalesChartData(formattedChartData);
      } else {
        setSalesChartData([]);
      }

      // ตั้งค่า state สำหรับ recentSales
      if (Array.isArray(recentSalesRes.data)) {
        setRecentSales(recentSalesRes.data);
      } else {
        setRecentSales([]);
        console.warn("[Frontend] recentSalesRes.data is not an array:", recentSalesRes.data);
      }

      lastFetchedDateRef.current = new Date().toISOString().split('T')[0];

    } catch (err) {
      console.error("[Frontend] Failed to fetch dashboard data:", err);
      setError('ไม่สามารถดึงข้อมูลสำหรับ Dashboard ได้: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      console.log("[Frontend] fetchDashboardData finished");
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentDateStr = new Date().toISOString().split('T')[0];
      if (currentDateStr !== lastFetchedDateRef.current) {
        fetchDashboardData();
      }
    }, 60000 * 5); 
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, icon, colorClass = "bg-sky-600", unit = "" }) => (
    <div className={`p-5 md:p-6 rounded-xl shadow-lg text-white flex items-center space-x-3 md:space-x-4 ${colorClass} hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out`}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-grow">
        <p className="text-sm uppercase font-semibold tracking-wider">{title}</p>
        {isLoading && value === 0 && !error ? (
            <div className="h-8 w-20 bg-white/30 animate-pulse rounded-md mt-1"></div>
        ) : (
            <p className="text-2xl md:text-3xl font-bold">{value.toLocaleString()}{unit && <span className="text-lg ml-1">{unit}</span>}</p>
        )}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
          <p className="label font-semibold text-gray-700">{`วัน${label}`}</p>
          <p className="intro text-indigo-600">{`ยอดขาย : ${payload[0].value.toLocaleString()} บาท`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard ภาพรวมระบบ</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md" role="alert">
          <p className="font-bold">เกิดข้อผิดพลาด:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10"> 
        <StatCard title="สินค้าทั้งหมด" value={summaryData.totalProducts} icon={<ProductStatIcon />} colorClass="bg-blue-600" unit="รายการ"/>
        <StatCard title="ลูกค้าทั้งหมด" value={summaryData.totalCustomers} icon={<CustomerStatIcon />} colorClass="bg-green-600" unit="คน"/>
        <StatCard title="ยอดขายวันนี้" value={summaryData.salesToday} icon={<SalesTodayStatIcon />} colorClass="bg-amber-500" unit="บาท"/>
        <StatCard title="สินค้าใกล้หมด" value={summaryData.lowStockItems} icon={<LowStockStatIcon />} colorClass="bg-red-600" unit="รายการ"/>
        <StatCard 
            title="ลูกค้าค้างชำระ" 
            value={summaryData.outstandingCustomers} 
            icon={<OutstandingCustomerStatIcon />} 
            colorClass="bg-purple-600"
            unit="คน"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">กราฟยอดขาย 7 วันล่าสุด</h2>
          {isLoading && salesChartData.length === 0 && !error ? (
            <div className="h-72 flex items-center justify-center"> <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div> </div>
          ) : salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0"/>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200, 200, 200, 0.3)' }}/>
                <Bar dataKey="sales" name="ยอดขาย" radius={[4, 4, 0, 0]} >
                    {salesChartData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={index === salesChartData.length - 1 ? '#22c55e' : (index % 2 === 0 ? '#38bdf8' : '#0ea5e9')} /> ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : ( !isLoading && !error && <div className="h-72 flex items-center justify-center rounded-lg bg-gray-50"> <p className="text-gray-500 text-center">ไม่พบข้อมูลยอดขายสำหรับสร้างกราฟ</p> </div> )}
        </div>

        {/* Notifications & Recent Sales Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">รายการแจ้งเตือน & สั่งซื้อล่าสุด</h2>
          
          {/* Notifications */}
          {isLoading && summaryData.lowStockItems === 0 && summaryData.outstandingCustomers === 0 && !error ? (
            <p className="text-sm text-gray-500 mb-4">กำลังโหลดข้อมูลการแจ้งเตือน...</p>
          ) : (
            <div className="space-y-3 mb-6">
                {summaryData.lowStockItems > 0 && (
                    <div className="flex items-start p-3 bg-yellow-100 border border-yellow-300 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 pt-0.5"><LowStockStatIcon /></div>
                        <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">สินค้าใกล้หมดสต็อก</p>
                        <p className="text-sm text-yellow-700">มีสินค้า {summaryData.lowStockItems} รายการที่จำนวนเหลือน้อยกว่า 10 ชิ้น</p>
                        </div>
                    </div>
                )}
                {summaryData.outstandingCustomers > 0 && (
                    <div className="flex items-start p-3 bg-orange-100 border border-orange-300 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 pt-0.5"><OutstandingCustomerStatIcon /></div>
                        <div className="ml-3">
                        <p className="text-sm font-medium text-orange-800">ลูกค้าค้างชำระ</p>
                        <p className="text-sm text-orange-700">มีลูกค้า {summaryData.outstandingCustomers} รายที่ยังมียอดค้างชำระ</p>
                        </div>
                    </div>
                )}
                {(summaryData.lowStockItems === 0 && summaryData.outstandingCustomers === 0 && !isLoading && !error) && (
                     <p className="text-sm text-gray-500">ยังไม่มีการแจ้งเตือนที่สำคัญในขณะนี้</p>
                )}
            </div>
          )}

          {/* Recent Sales */}
          <div>
            <h3 className="text-md font-semibold text-gray-600 mb-2 border-t pt-4">การสั่งซื้อล่าสุด</h3>
            {isLoading && recentSales.length === 0 && !error ? (
                <p className="text-sm text-gray-500">กำลังโหลดข้อมูลการสั่งซื้อล่าสุด...</p>
            ) : recentSales.length > 0 ? (
                <ul className="space-y-3">
                    {recentSales.map(sale => (
                        <li key={sale.saleId} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors">
                            <Link to={`/sales-history/${sale.saleId}`} className="block hover:text-sky-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <RecentSaleIcon />
                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                            ใบขาย #{sale.saleId} - {sale.customerName || 'ลูกค้าทั่วไป'}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-500">{new Date(sale.saleDate).toLocaleDateString('th-TH')}</span>
                                </div>
                                <p className="text-sm text-green-600 font-semibold mt-1">
                                    ยอดรวม: {sale.totalAmount.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                !isLoading && !error && <p className="text-sm text-gray-500">ยังไม่มีข้อมูลการสั่งซื้อล่าสุด</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
