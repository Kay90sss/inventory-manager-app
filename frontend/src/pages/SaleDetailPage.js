// frontend/src/pages/SaleDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';

const SaleDetailPage = () => {
  const { saleId } = useParams();
  const [saleDetail, setSaleDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSaleDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/sales-history/${saleId}`);
      setSaleDetail(response.data);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลรายละเอียดใบขายได้');
      setSaleDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    if (saleId) {
      fetchSaleDetail();
    }
  }, [saleId, fetchSaleDetail]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="text-center py-10 bg-white p-6 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
        <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลรายละเอียดใบขาย...</p>
      </div>
    );
  }

  if (!saleDetail) {
    return (
      <div className="container mx-auto text-center py-10 bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">ไม่พบข้อมูลใบขาย</h1>
        <p className="text-gray-600 mb-6">อาจจะไม่มีใบขายเลขที่ {saleId} หรือเกิดข้อผิดพลาดในการดึงข้อมูล</p>
        <Link 
          to="/sales-history" 
          className="text-sky-600 hover:text-sky-700 font-medium inline-flex items-center py-2 px-4 rounded-lg border border-sky-600 hover:bg-sky-50 transition"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          กลับไปหน้ารายการประวัติการขาย
        </Link>
      </div>
    );
  }

  return (
    // ตรวจสอบว่า div หลักมี class "print-area"
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-white shadow-xl rounded-xl print-area">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 print-title">รายละเอียดใบขาย #{saleDetail.saleId}</h1> {/* เพิ่ม class ให้ title ถ้าต้องการสไตล์เฉพาะตอนพิมพ์ */}
            <p className="text-sm text-gray-500 mt-1">
                วันที่ขาย: {new Date(saleDetail.saleDate).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
        </div>
        {/* เพิ่ม class "no-print" ให้กับ div ที่ครอบปุ่ม */}
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 no-print">
            <Link 
                to="/sales-history" 
                className="w-full sm:w-auto text-center text-sky-600 hover:text-sky-700 font-medium inline-flex items-center justify-center py-2.5 px-5 rounded-lg border border-sky-600 hover:bg-sky-50 transition"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                กลับ
            </Link>
            <button 
                onClick={handlePrint}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md inline-flex items-center justify-center transition"
            >
                <PrinterIcon className="h-5 w-5 mr-2" />
                พิมพ์ใบเสร็จ
            </button>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-8 p-6 bg-slate-50 rounded-lg shadow print-section"> {/* เพิ่ม class ถ้าต้องการสไตล์เฉพาะ */}
        <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm customer-info-grid"> {/* เพิ่ม class สำหรับ styling */}
          <p><strong>ชื่อ-นามสกุล:</strong> {saleDetail.customerName || 'N/A'}</p>
          <p><strong>เบอร์โทรศัพท์:</strong> {saleDetail.customerPhone || 'N/A'}</p>
          <p className="md:col-span-2"><strong>ที่อยู่:</strong> {saleDetail.customerAddress || 'N/A'}</p>
        </div>
      </div>

      {/* Sale Items Table */}
      <div className="mt-6 print-section"> {/* เพิ่ม class ถ้าต้องการสไตล์เฉพาะ */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4">รายการสินค้าที่ขาย</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow border">
          <table className="min-w-full leading-normal">
            {/* ... thead, tbody, tfoot เหมือนเดิม ... */}
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อสินค้า</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">จำนวน</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ราคา/หน่วย (บาท)</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ยอดรวมย่อย (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {saleDetail.items && saleDetail.items.map((item, index) => (
                <tr key={item.saleItemId || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{index + 1}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{item.quantity.toLocaleString('th-TH')}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{item.priceAtSale.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">{item.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-200 font-semibold">
                <tr>
                    <td colSpan="4" className="px-5 py-3 border-b-2 border-t-2 border-gray-300 text-right text-sm text-gray-700 uppercase">ยอดขายรวม:</td>
                    <td className="px-5 py-3 border-b-2 border-t-2 border-gray-300 text-right text-sm text-gray-800">{saleDetail.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                </tr>
                <tr>
                    <td colSpan="4" className="px-5 py-3 border-b-2 border-gray-300 text-right text-sm text-gray-700 uppercase">ต้นทุนรวม:</td>
                    <td className="px-5 py-3 border-b-2 border-gray-300 text-right text-sm text-gray-800">{saleDetail.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                </tr>
                <tr className="text-green-700">
                    <td colSpan="4" className="px-5 py-3 border-b-2 border-gray-300 text-right text-sm uppercase">กำไรสุทธิ:</td>
                    <td className="px-5 py-3 border-b-2 border-gray-300 text-right text-sm font-bold">{saleDetail.profit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailPage;
