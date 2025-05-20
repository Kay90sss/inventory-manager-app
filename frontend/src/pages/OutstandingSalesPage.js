// frontend/src/pages/OutstandingSalesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { EyeIcon, BanknotesIcon as RecordPaymentIcon, CreditCardIcon } from '@heroicons/react/24/outline'; // Added CreditCardIcon for "Pay Full"

// Modal Component for Recording Payment
const RecordPaymentModal = ({ isOpen, onClose, sale, onPaymentRecorded }) => {
  const [amountReceivedNow, setAmountReceivedNow] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Reset amountReceivedNow when sale data changes or modal opens
  useEffect(() => {
    if (isOpen && sale) {
      setAmountReceivedNow(''); // Clear previous input
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const balanceDue = (sale.totalAmount || 0) - (sale.amountPaid || 0);

  const processPayment = async (amountToPay) => {
    if (isNaN(amountToPay) || amountToPay <= 0) {
      toast.error("จำนวนเงินที่ชำระต้องเป็นตัวเลขที่มากกว่า 0");
      return;
    }
    // Allow overpayment recording, backend should handle or cap it.
    // Or add specific handling here if needed.
    // if (amountToPay > balanceDue + 0.001) {
    //   if (!window.confirm(`จำนวนเงินที่ชำระ (${amountToPay.toFixed(2)}) มากกว่ายอดค้างชำระ (${balanceDue.toFixed(2)})\nยอดเงินส่วนเกินจะถูกบันทึกเป็นการชำระเกิน คุณต้องการดำเนินการต่อหรือไม่?`)) {
    //     return;
    //   }
    // }

    setIsSubmittingPayment(true);
    try {
      const response = await axios.post(`/api/sales/${sale.saleId}/record-payment`, {
        amountReceived: amountToPay,
      });
      toast.success(response.data.message || "บันทึกการชำระเงินสำเร็จ!");
      onPaymentRecorded(); 
      onClose();
    } catch (err) {
      console.error("Failed to record payment:", err);
      toast.error(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน');
    } finally {
      setIsSubmittingPayment(false);
      setAmountReceivedNow(''); 
    }
  };

  const handleSubmitPartialPayment = (e) => {
    e.preventDefault();
    const received = parseFloat(amountReceivedNow);
    processPayment(received);
  };

  const handlePayFullAmount = () => {
    // Set amount to balance due and process payment
    setAmountReceivedNow(balanceDue.toFixed(2)); // Update input for visual feedback if needed
    processPayment(balanceDue);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">บันทึกการชำระเงิน</h2>
        <p className="text-sm text-gray-600 mb-1">ใบขายเลขที่: <span className="font-semibold">#{sale.saleId}</span></p>
        <p className="text-sm text-gray-600 mb-1">ลูกค้า: <span className="font-semibold">{sale.customerName || '-'}</span></p>
        <p className="text-sm text-gray-600 mb-4">ยอดค้างชำระปัจจุบัน: <span className="font-semibold text-red-600">{balanceDue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span></p>
        
        <form onSubmit={handleSubmitPartialPayment}>
          <div className="mb-4">
            <label htmlFor="amountReceivedNow" className="block text-sm font-medium text-gray-700 mb-1">
              จำนวนเงินที่ชำระเพิ่ม (บาท)
            </label>
            <input
              type="number"
              id="amountReceivedNow"
              name="amountReceivedNow"
              value={amountReceivedNow}
              onChange={(e) => setAmountReceivedNow(e.target.value)}
              min="0.01"
              step="0.01"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col space-y-3 mt-6">
            {/* Pay Full Amount Button */}
            {balanceDue > 0 && (
                 <button 
                    type="button" 
                    onClick={handlePayFullAmount} 
                    disabled={isSubmittingPayment} 
                    className={`w-full flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white rounded-lg shadow-md transition ${isSubmittingPayment ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                >
                   <CreditCardIcon className="h-5 w-5 mr-2" />
                   ชำระทั้งหมด ({balanceDue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท)
                </button>
            )}
           
            {/* Submit Partial Payment Button */}
            <button 
                type="submit" 
                disabled={isSubmittingPayment || !amountReceivedNow || parseFloat(amountReceivedNow) <= 0} 
                className={`w-full flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white rounded-lg shadow-md transition ${isSubmittingPayment || !amountReceivedNow || parseFloat(amountReceivedNow) <= 0 ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
            >
              {isSubmittingPayment ? 'กำลังบันทึก...' : 'บันทึกการชำระเงิน (ตามยอดที่กรอก)'}
            </button>
            
            <button 
                type="button" 
                onClick={onClose} 
                disabled={isSubmittingPayment} 
                className="w-full px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition"
            >
                ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const OutstandingSalesPage = () => {
  const [outstandingSales, setOutstandingSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);

  const fetchOutstandingSales = useCallback(async (pageToFetch = 1) => {
    setIsLoading(true);
    try {
      const params = { page: pageToFetch, limit: itemsPerPage };
      const response = await axios.get('/api/outstanding-sales', { params });
      setOutstandingSales(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลยอดค้างชำระได้');
      setOutstandingSales([]); setTotalPages(0); setTotalItems(0);
    } finally { setIsLoading(false); }
  }, [itemsPerPage]); // Removed currentPage from dependencies, it's passed as argument

  useEffect(() => {
    fetchOutstandingSales(currentPage);
  }, [currentPage, fetchOutstandingSales]); // fetchOutstandingSales is stable due to useCallback

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      // setCurrentPage(newPage); // This will trigger useEffect above
      fetchOutstandingSales(newPage); // Or call directly if preferred
    }
  };

  const getPaymentStatusText = (status) => {
    if (status === 'unpaid') return <span className="px-2 py-1 text-xs font-semibold leading-tight text-red-700 bg-red-100 rounded-full">ยังไม่ชำระ</span>;
    if (status === 'partial') return <span className="px-2 py-1 text-xs font-semibold leading-tight text-orange-700 bg-orange-100 rounded-full">ชำระบางส่วน</span>;
    if (status === 'paid') return <span className="px-2 py-1 text-xs font-semibold leading-tight text-green-700 bg-green-100 rounded-full">ชำระแล้ว</span>;
    return status;
  };
  
  const openPaymentModal = (sale) => {
    setSelectedSaleForPayment(sale);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setSelectedSaleForPayment(null);
    setIsPaymentModalOpen(false);
  };

  const handlePaymentRecorded = () => {
    fetchOutstandingSales(currentPage); // Re-fetch current page data
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">รายการยอดค้างชำระ</h1>
      </div>

      {isLoading && outstandingSales.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลยอดค้างชำระ...</p>
          </div>
      )}

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">เลขที่ใบขาย</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">วันที่ขาย</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">ชื่อลูกค้า</th>
              <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ยอดรวม (บาท)</th>
              <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ชำระแล้ว (บาท)</th>
              <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ยอดค้างชำระ (บาท)</th>
              <th className="px-5 py-3 border-b-2 text-center text-xs font-semibold uppercase">สถานะ</th>
              <th className="px-5 py-3 border-b-2 text-center text-xs font-semibold uppercase">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!isLoading && outstandingSales.length > 0 ? (
              outstandingSales.map((sale, index) => (
                <tr key={sale.saleId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                  <td className="px-5 py-4 text-sm">{sale.saleId}</td>
                  <td className="px-5 py-4 text-sm">{new Date(sale.saleDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  <td className="px-5 py-4 text-sm">{sale.customerName || '-'}</td>
                  <td className="px-5 py-4 text-sm text-right">{sale.totalAmount != null ? sale.totalAmount.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                  <td className="px-5 py-4 text-sm text-right">{sale.amountPaid != null ? sale.amountPaid.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-right text-red-600">{sale.balanceDue != null ? sale.balanceDue.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                  <td className="px-5 py-4 text-sm text-center">{getPaymentStatusText(sale.paymentStatus)}</td>
                  <td className="px-5 py-4 text-sm text-center space-x-2">
                    <Link to={`/sales-history/${sale.saleId}`} className="text-sky-600 hover:text-sky-800 inline-flex items-center p-1 rounded hover:bg-sky-100" title="ดูรายละเอียดใบขาย">
                      <EyeIcon className="h-5 w-5"/>
                    </Link>
                    {/* Show payment button only if not fully paid */}
                    {sale.paymentStatus !== 'paid' && (
                      <button 
                        onClick={() => openPaymentModal(sale)}
                        className="text-green-600 hover:text-green-800 inline-flex items-center p-1 rounded hover:bg-green-100"
                        title="บันทึกการชำระเงิน"
                      >
                        <RecordPaymentIcon className="h-5 w-5"/>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : ( !isLoading && (<tr><td colSpan="8" className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูลยอดค้างชำระ</td></tr>) )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && !isLoading && (
        <div className="flex justify-between items-center mt-6 py-3">
          <span className="text-sm text-gray-700">
            หน้า {currentPage} จาก {totalPages} (ทั้งหมด {totalItems} รายการ)
          </span>
          <div className="space-x-1">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50">ก่อนหน้า</button>
            {[...Array(totalPages).keys()].map(num => {
                const pageNum = num + 1;
                const showPage = (totalPages <= 7) || 
                                 (pageNum <= 2) || 
                                 (pageNum >= totalPages - 1) || 
                                 (Math.abs(pageNum - currentPage) <= 1);

                const showEllipsisBefore = (totalPages > 7) && (pageNum === (currentPage - 2)) && (pageNum > 2);
                const showEllipsisAfter = (totalPages > 7) && (pageNum === (currentPage + 2)) && (pageNum < (totalPages - 1));
                
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

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        sale={selectedSaleForPayment}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </div>
  );
};

export default OutstandingSalesPage;
