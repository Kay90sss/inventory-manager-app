// frontend/src/pages/CustomerSalesHistoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
// Removed ShoppingBagIcon as it was unused. Ensure only used icons are imported.
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';

const CustomerSalesHistoryPage = () => {
  const { customerId } = useParams(); // Get customerId from URL
  const [customerDetails, setCustomerDetails] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSaleItemsCount, setTotalSaleItemsCount] = useState(0);
  const itemsPerPage = 5;

  const fetchCustomerSalesHistory = useCallback(async (pageToFetch = 1) => {
    console.log(`fetchCustomerSalesHistory called for customerId: ${customerId}, page: ${pageToFetch}`);
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/customers/${customerId}/sales`, {
        params: {
          page: pageToFetch,
          limit: itemsPerPage,
        },
      });
      console.log("API response data (customer sales history):", response.data);
      setCustomerDetails(response.data.customer);
      setSalesHistory(Array.isArray(response.data.sales) ? response.data.sales : []);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalSaleItemsCount(response.data.totalItems);
    } catch (err) {
      console.error(`Failed to fetch sales history for customer ${customerId}:`, err);
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลประวัติการซื้อของลูกค้าได้');
      setCustomerDetails(null);
      setSalesHistory([]);
      setTotalPages(0);
      setTotalSaleItemsCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, itemsPerPage]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerSalesHistory(currentPage);
    }
  }, [customerId, currentPage, fetchCustomerSalesHistory]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchCustomerSalesHistory(newPage);
    }
  };

  if (isLoading && !customerDetails) {
    return (
      <div className="text-center py-10 bg-white p-6 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
        <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลลูกค้าและประวัติการซื้อ...</p>
      </div>
    );
  }

  if (!customerDetails) {
    return (
      <div className="container mx-auto text-center py-10 bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">ไม่พบข้อมูลลูกค้า</h1>
        <p className="text-gray-600 mb-6">อาจจะไม่มีลูกค้ารหัส {customerId} หรือเกิดข้อผิดพลาดในการดึงข้อมูล</p>
        <Link 
          to="/customers" 
          className="text-sky-600 hover:text-sky-700 font-medium inline-flex items-center py-2 px-4 rounded-lg border border-sky-600 hover:bg-sky-50 transition"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          กลับไปหน้ารายการลูกค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            ประวัติการซื้อของ: {customerDetails.customerName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">รหัสลูกค้า: {customerDetails.customerId}</p>
        </div>
        <Link 
          to="/customers" 
          className="mt-4 sm:mt-0 text-sky-600 hover:text-sky-700 font-medium inline-flex items-center py-2.5 px-5 rounded-lg border border-sky-600 hover:bg-sky-50 transition"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          กลับไปหน้ารายการลูกค้า
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <p><strong>ชื่อ-นามสกุล:</strong> {customerDetails.customerName}</p>
          <p><strong>เบอร์โทรศัพท์:</strong> {customerDetails.customerPhone || '-'}</p>
          <p className="md:col-span-2"><strong>ที่อยู่:</strong> {customerDetails.customerAddress || '-'}</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-700 mb-4">รายการใบขาย ({totalSaleItemsCount} รายการ)</h2>
      
      {isLoading && salesHistory.length === 0 && (
         <div className="text-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div><p className="mt-2 text-sm text-gray-500">กำลังโหลดรายการขาย...</p></div>
      )}

      {salesHistory.length > 0 ? (
        <div className="space-y-6">
          {salesHistory.map((sale) => (
            <div key={sale.saleId} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-sky-700">ใบขายเลขที่ #{sale.saleId}</h3>
                  <p className="text-xs text-gray-500">
                    วันที่: {new Date(sale.saleDate).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <Link 
                    to={`/sales-history/${sale.saleId}`}
                    className="mt-2 sm:mt-0 text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center py-1 px-3 rounded-md hover:bg-indigo-50 transition"
                >
                    <EyeIcon className="h-4 w-4 mr-1.5"/> ดูรายละเอียดใบขาย
                </Link>
              </div>
              
              {sale.items && sale.items.length > 0 ? (
                <div className="overflow-x-auto mt-2 mb-3 border-t border-b py-2">
                    <table className="min-w-full text-sm">
                        <thead className="text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="py-1.5 px-2 text-left">สินค้า</th>
                                <th className="py-1.5 px-2 text-right">จำนวน</th>
                                <th className="py-1.5 px-2 text-right">ราคา/หน่วย</th>
                                <th className="py-1.5 px-2 text-right">รวมย่อย</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {sale.items.map((item, index) => (
                            <tr key={index}>
                            <td className="py-1.5 px-2 whitespace-nowrap">{item.productName}</td>
                            <td className="py-1.5 px-2 whitespace-nowrap text-right">{item.quantity.toLocaleString('th-TH')}</td>
                            <td className="py-1.5 px-2 whitespace-nowrap text-right">{item.priceAtSale.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="py-1.5 px-2 whitespace-nowrap text-right font-medium">{item.subtotal.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic my-2">ไม่พบรายการสินค้าในใบขายนี้</p>
              )}

              <div className="text-right">
                <p className="text-sm"><strong>ยอดรวมใบขาย:</strong> {sale.totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</p>
                <p className="text-xs text-gray-600"><strong>กำไรจากใบขายนี้:</strong> {sale.profit.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <p className="text-gray-500 text-center py-6 bg-white rounded-xl shadow-lg">ไม่พบประวัติการซื้อสำหรับลูกค้ารายนี้</p>
      )}

      {/* Pagination Controls for Sales History */}
      {totalPages > 1 && !isLoading && (
        <div className="flex justify-between items-center mt-8 py-3">
          <span className="text-sm text-gray-700">
            หน้า {currentPage} จาก {totalPages} (ทั้งหมด {totalSaleItemsCount} ใบขาย)
          </span>
          <div className="space-x-1">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50">ก่อนหน้า</button>
            {[...Array(totalPages).keys()].map(num => {
                const pageNum = num + 1;
                // Corrected and simplified logic for showing limited page numbers
                const showEllipsisBefore = pageNum === currentPage - 2 && pageNum > 2;
                const showEllipsisAfter = pageNum === currentPage + 2 && pageNum < totalPages -1;
                const showPage = totalPages <= 7 || 
                                 pageNum <= 2 || 
                                 pageNum >= totalPages - 1 || 
                                 Math.abs(pageNum - currentPage) <= 1;

                if (showPage) {
                    return (
                        <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-3 py-1 text-sm border rounded-md ${currentPage === pageNum ? 'bg-sky-600 text-white' : 'hover:bg-gray-100'}`}>
                            {pageNum}
                        </button>
                    );
                } else if (showEllipsisBefore || showEllipsisAfter) {
                    return <span key={`ellipsis-${pageNum}`} className="px-2 py-1 text-sm">...</span>;
                }
                return null;
            })}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50">ถัดไป</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSalesHistoryPage;
