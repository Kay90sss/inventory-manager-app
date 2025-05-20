// frontend/src/pages/SalesHistoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom'; // <<< เพิ่ม Import นี้
import { EyeIcon } from '@heroicons/react/24/outline'; // Icon สำหรับปุ่มดูรายละเอียด

const SalesHistoryPage = () => {
  console.log("SalesHistoryPage component rendering...");

  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Filter states - สามารถเพิ่มทีหลังได้
  // const [customers, setCustomers] = useState([]);
  // const [selectedCustomerId, setSelectedCustomerId] = useState('');
  // const [startDate, setStartDate] = useState('');
  // const [endDate, setEndDate] = useState('');

  const fetchSalesHistory = useCallback(async (pageToFetch = 1) => {
    console.log(`fetchSalesHistory called. Page: ${pageToFetch}`);
    setIsLoading(true);
    try {
      const params = {
        page: pageToFetch,
        limit: itemsPerPage,
        // customerId: selectedCustomerId,
        // startDate: startDate,
        // endDate: endDate,
      };
      const response = await axios.get('/api/sales-history', { params });
      console.log("API response data (sales history):", response.data);
      setSales(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (err) {
      console.error("Failed to fetch sales history:", err);
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลประวัติการขายได้');
      setSales([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
      console.log("fetchSalesHistory finished");
    }
  }, [itemsPerPage /*, selectedCustomerId, startDate, endDate */]);

  useEffect(() => {
    fetchSalesHistory(currentPage);
  }, [currentPage, fetchSalesHistory]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchSalesHistory(newPage);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ประวัติการขาย</h1>
      </div>

      {isLoading && sales.length === 0 && (
         <div className="text-center py-10 bg-white rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลประวัติการขาย...</p>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">เลขที่ใบขาย</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">วันที่ขาย</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อลูกค้า</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ยอดขายรวม (บาท)</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">กำไร (บาท)</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">รายละเอียด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!isLoading && sales.length > 0 ? (
              sales.map((sale, index) => (
                <tr key={sale.saleId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition'}>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{sale.saleId}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(sale.saleDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{sale.customerName || '-'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{sale.totalAmount != null ? sale.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-right text-green-600">{sale.profit != null ? sale.profit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-center">
                    <Link 
                      to={`/sales-history/${sale.saleId}`} 
                      className="text-sky-600 hover:text-sky-800 font-medium inline-flex items-center"
                    >
                      <EyeIcon className="h-5 w-5 mr-1" />
                      ดูรายละเอียด
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              !isLoading && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500"> {/* เปลี่ยน colSpan เป็น 6 */}
                    ไม่พบข้อมูลประวัติการขาย
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls (เหมือนเดิม) */}
      {totalPages > 0 && !isLoading && (
        <div className="flex justify-between items-center mt-6 py-3">
          <span className="text-sm text-gray-700">
            หน้า {currentPage} จาก {totalPages} (ทั้งหมด {totalItems} รายการ)
          </span>
          <div className="space-x-1">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50">ก่อนหน้า</button>
            {[...Array(totalPages).keys()].map(num => {
                const pageNum = num + 1;
                if (totalPages > 7 && (pageNum > 3 && pageNum < totalPages - 2 && pageNum !== currentPage && Math.abs(pageNum-currentPage) > 1) ) {
                    if (pageNum === 4 || pageNum === totalPages - 3) return <span key={pageNum} className="px-3 py-1 text-sm">...</span>;
                    return null;
                }
                return (<button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-3 py-1 text-sm border rounded-md hover:bg-gray-100 ${currentPage === pageNum ? 'bg-sky-600 text-white border-sky-600' : ''}`}>{pageNum}</button>);
            })}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50">ถัดไป</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
