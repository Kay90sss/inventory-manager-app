// frontend/src/pages/ReportsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    CalendarDaysIcon, 
    DocumentMagnifyingGlassIcon, 
    ArrowPathIcon, 
    UserCircleIcon, 
    ArrowDownTrayIcon,
    BanknotesIcon // เพิ่มไอคอนสำหรับยอดค้างชำระ
} from '@heroicons/react/24/outline';

const ReportsPage = () => {
  console.log("ReportsPage component rendering...");

  // States for Sales Summary Report (by invoice)
  const [salesSummary, setSalesSummary] = useState([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  // States for Sales by Product Report
  const [salesByProduct, setSalesByProduct] = useState([]);
  const [isLoadingByProduct, setIsLoadingByProduct] = useState(false);

  // States for Sales by Customer Report
  const [salesByCustomer, setSalesByCustomer] = useState([]);
  const [isLoadingByCustomer, setIsLoadingByCustomer] = useState(false);

  // Common states for filters
  const today = new Date();
  const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayISO = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayCurrentMonth);
  const [endDate, setEndDate] = useState(todayISO);
  
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(''); // For Sales Summary filter

  // Fetch customers for the dropdown filter
  useEffect(() => {
    const fetchCustomersForFilter = async () => {
      try {
        const response = await axios.get('/api/customers?limit=all');
        if (Array.isArray(response.data)) {
          setCustomers(response.data.sort((a,b) => a.name.localeCompare(b.name)));
        } else if (response.data && Array.isArray(response.data.data)) {
            setCustomers(response.data.data.sort((a,b) => a.name.localeCompare(b.name)));
        } else {
            setCustomers([]);
        }
      } catch (error) {
        console.error("Failed to fetch customers for filter:", error);
        toast.error("ไม่สามารถดึงรายชื่อลูกค้าสำหรับตัวกรองได้");
        setCustomers([]);
      }
    };
    fetchCustomersForFilter();
  }, []);

  const formatItemsSoldStringForDisplay = (itemsSoldString) => {
    if (!itemsSoldString) return '-';
    const items = itemsSoldString.split(/\s*,\s*|\s*\n\s*/); 
    return items.map(itemDetail => {
        const match = itemDetail.match(/(.+?)\s*\(จำนวน:\s*([\d,.]+)\s*ชิ้น,\s*ราคาขาย:\s*([\d,.]+)\s*บาท,\s*ราคาทุน:\s*([\d,.]+)\s*บาท\)/);
        if (match) {
            const name = match[1];
            const quantity = parseFloat(match[2].replace(/,/g, ''));
            const priceAtSale = parseFloat(match[3].replace(/,/g, ''));
            const costAtSale = parseFloat(match[4].replace(/,/g, ''));
            return `${name} (จำนวน: ${quantity.toLocaleString('th-TH')} ชิ้น, ราคาขาย: ${priceAtSale.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท, ราคาทุน: ${costAtSale.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท)`;
        }
        const oldMatch = itemDetail.match(/(.+?)\s*\(Qty:\s*([\d.]+)\s*@\s*([\d.]+)\s*,\s*Cost:\s*([\d.]+)\s*\)/);
        if (oldMatch) {
            const name = oldMatch[1];
            const quantity = parseFloat(oldMatch[2]);
            const price = parseFloat(oldMatch[3]);
            const cost = parseFloat(oldMatch[4]);
            return `${name} (จำนวน: ${quantity.toLocaleString('th-TH')} ชิ้น, ราคาขาย: ${price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท, ราคาทุน: ${cost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท)`;
        }
        return itemDetail.trim();
    }).join('\n');
  };
  
  const fetchSalesSummary = useCallback(async (fetchStartDate, fetchEndDate, fetchCustomerId) => {
    setIsLoadingSummary(true);
    try {
      const params = {};
      if (fetchStartDate) params.startDate = fetchStartDate;
      if (fetchEndDate) params.endDate = fetchEndDate;
      if (fetchCustomerId && fetchCustomerId !== 'all' && fetchCustomerId !== '') params.customerId = fetchCustomerId;
      const response = await axios.get('/api/reports/sales-summary', { params });
      // Backend now includes amountPaid and paymentStatus in sales-summary
      setSalesSummary(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลรายงานสรุปยอดขายได้');
      setSalesSummary([]);
    } finally { setIsLoadingSummary(false); }
  }, []);

  const fetchSalesByProductReport = useCallback(async (fetchStartDate, fetchEndDate) => {
    setIsLoadingByProduct(true);
    try {
      const params = {};
      if (fetchStartDate) params.startDate = fetchStartDate;
      if (fetchEndDate) params.endDate = fetchEndDate;
      const response = await axios.get('/api/reports/sales-by-product', { params });
      setSalesByProduct(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลรายงานยอดขายตามสินค้าได้');
      setSalesByProduct([]);
    } finally { setIsLoadingByProduct(false); }
  }, []);

  const fetchSalesByCustomerReport = useCallback(async (fetchStartDate, fetchEndDate) => {
    setIsLoadingByCustomer(true);
    try {
      const params = {};
      if (fetchStartDate) params.startDate = fetchStartDate;
      if (fetchEndDate) params.endDate = fetchEndDate;
      const response = await axios.get('/api/reports/sales-by-customer', { params });
      setSalesByCustomer(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch sales by customer report:", err);
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลรายงานยอดขายตามลูกค้าได้');
      setSalesByCustomer([]);
    } finally {
      setIsLoadingByCustomer(false);
    }
  }, []);

  useEffect(() => {
    console.log("useEffect for data fetching (ReportsPage) running due to filter change");
    fetchSalesSummary(startDate, endDate, selectedCustomerId);
    fetchSalesByProductReport(startDate, endDate);
    fetchSalesByCustomerReport(startDate, endDate);
  }, [fetchSalesSummary, fetchSalesByProductReport, fetchSalesByCustomerReport, startDate, endDate, selectedCustomerId]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) { toast.warn("กรุณาเลือกทั้งวันที่เริ่มต้นและวันที่สิ้นสุด"); return; }
    if (new Date(startDate) > new Date(endDate)) { toast.warn("วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด"); return; }
    fetchSalesSummary(startDate, endDate, selectedCustomerId);
    fetchSalesByProductReport(startDate, endDate);
    fetchSalesByCustomerReport(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate(firstDayCurrentMonth);
    setEndDate(todayISO);
    setSelectedCustomerId('');
  };

  const totalsSummary = salesSummary.reduce(
    (acc, sale) => {
      acc.totalAmount += sale.totalAmount || 0;
      acc.totalCost += sale.totalCost || 0;
      acc.totalProfit += sale.profit || 0;
      acc.totalAmountPaid += sale.amountPaid || 0; // เพิ่มการคำนวณยอดชำระแล้ว
      return acc;
    }, { totalAmount: 0, totalCost: 0, totalProfit: 0, totalAmountPaid: 0 } // เพิ่ม totalAmountPaid ในค่าเริ่มต้น
  );

  // คำนวณยอดค้างชำระรวมสำหรับ Summary Cards
  const totalOutstandingForCards = totalsSummary.totalAmount - totalsSummary.totalAmountPaid;

  // Updated SummaryCard to accept isSmall prop
  const SummaryCard = ({ title, value, icon, colorClass, isSmall = false }) => (
    <div className={`p-3 rounded-xl shadow-lg text-white ${colorClass} ${isSmall ? 'md:p-4' : 'md:p-5'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`uppercase font-semibold tracking-wider ${isSmall ? 'text-xs' : 'text-sm'}`}>{title}</p>
          <p className={`font-bold ${isSmall ? 'text-2xl' : 'text-3xl'}`}>
            {value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className={`ml-1 ${isSmall ? 'text-base' : 'text-lg'}`}>บาท</span>
          </p>
        </div>
        <div className={`opacity-80 ${isSmall ? 'text-3xl' : 'text-4xl'}`}>{icon}</div>
      </div>
    </div>
  );
  
  const exportToCSV = (dataToExport, reportType) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast.warn(`ไม่มีข้อมูลสำหรับ Export (${reportType})`);
      return;
    }
    let headers = [];
    let csvRows = [];

    if (reportType === 'sales_summary') {
      headers = ["เลขที่ใบขาย", "วันที่ขาย", "ชื่อลูกค้า", "รายการสินค้า", "ยอดขายรวม (บาท)", "ชำระแล้ว (บาท)", "สถานะการชำระ", "ต้นทุนรวม (บาท)", "กำไร (บาท)"];
      csvRows = dataToExport.map(sale => {
        const itemsSoldForCSV = sale.itemsSoldFormatted ? `"${sale.itemsSoldFormatted.replace(/"/g, '""').replace(/\n/g, '; ')}"` : '-';
        const customerNameForCSV = sale.customerName ? `"${sale.customerName.replace(/"/g, '""')}"` : '-';
        return [
          sale.saleId,
          new Date(sale.saleDate).toLocaleString('th-TH'),
          customerNameForCSV,
          itemsSoldForCSV,
          sale.totalAmount != null ? sale.totalAmount.toFixed(2) : '0.00',
          sale.amountPaid != null ? sale.amountPaid.toFixed(2) : '0.00', // เพิ่ม amountPaid
          sale.paymentStatus || '-', // เพิ่ม paymentStatus
          sale.totalCost != null ? sale.totalCost.toFixed(2) : '0.00',
          sale.profit != null ? sale.profit.toFixed(2) : '0.00'
        ];
      });
    } else if (reportType === 'sales_by_product') {
      headers = ["รหัสสินค้า", "ชื่อสินค้า", "จำนวนที่ขาย (ชิ้น)", "ยอดขายรวม (บาท)", "ต้นทุนรวม (บาท)", "กำไรรวม (บาท)"];
      csvRows = dataToExport.map(itemData => [
        itemData.productId,
        itemData.productName ? `"${itemData.productName.replace(/"/g, '""')}"` : '-',
        itemData.totalQuantitySold,
        itemData.totalRevenue != null ? itemData.totalRevenue.toFixed(2) : '0.00',
        itemData.totalCostOfGoodsSold != null ? itemData.totalCostOfGoodsSold.toFixed(2) : '0.00',
        itemData.totalProfit != null ? itemData.totalProfit.toFixed(2) : '0.00'
      ]);
    } else if (reportType === 'sales_by_customer') {
        headers = ["รหัสลูกค้า", "ชื่อลูกค้า", "เบอร์โทร", "จำนวนครั้งที่ซื้อ", "ยอดซื้อรวม (บาท)", "ต้นทุนรวม (บาท)", "กำไรรวม (บาท)"];
        csvRows = dataToExport.map(customerSale => [
            customerSale.customerId,
            customerSale.customerName ? `"${customerSale.customerName.replace(/"/g, '""')}"` : '-',
            customerSale.customerPhone || '-',
            customerSale.totalOrders,
            customerSale.totalSalesAmount != null ? customerSale.totalSalesAmount.toFixed(2) : '0.00',
            customerSale.totalSalesCost != null ? customerSale.totalSalesCost.toFixed(2) : '0.00',
            customerSale.totalProfit != null ? customerSale.totalProfit.toFixed(2) : '0.00'
        ]);
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel UTF-8 compatibility
    csvContent += headers.join(",") + "\r\n";
    csvRows.forEach(rowArray => {
      csvContent += rowArray.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
    link.setAttribute("download", `${reportType}_report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Export ข้อมูลรายงานเป็น CSV สำเร็จ!`);
  };

  const isCustomerSelected = selectedCustomerId && selectedCustomerId !== '' && selectedCustomerId !== 'all';

  return (
    <div className="container mx-auto space-y-10">
      {/* Filters Section */}
      <form onSubmit={handleFilterSubmit} className="bg-white p-6 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">ตั้งแต่วันที่</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarDaysIcon className="h-5 w-5 text-gray-400" /></div>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md"/>
          </div>
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">ถึงวันที่</label>
            <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarDaysIcon className="h-5 w-5 text-gray-400" /></div>
            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md"/>
          </div>
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="customerFilter" className="block text-sm font-medium text-gray-700 mb-1">เลือกลูกค้า (สำหรับสรุปยอดขายตามใบขาย)</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserCircleIcon className="h-5 w-5 text-gray-400" /></div>
            <select id="customerFilter" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white rounded-md">
              <option value="">ลูกค้าทั้งหมด</option>
              {customers.map(customer => (<option key={customer.id} value={customer.id.toString()}>{customer.name}</option>))}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 md:col-span-full lg:col-span-4 lg:justify-end">
            <button type="submit" disabled={isLoadingSummary || isLoadingByProduct || isLoadingByCustomer} className={`w-full sm:w-auto flex items-center justify-center py-2.5 px-6 rounded-lg shadow-md text-sm font-medium text-white ${(isLoadingSummary || isLoadingByProduct || isLoadingByCustomer) ? 'bg-sky-300 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}>
              <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-2"/>{ (isLoadingSummary || isLoadingByProduct || isLoadingByCustomer) ? 'กำลังโหลด...' : 'แสดงรายงาน'}
            </button>
            <button type="button" onClick={handleClearFilter} disabled={isLoadingSummary || isLoadingByProduct || isLoadingByCustomer} className="w-full sm:w-auto flex items-center justify-center py-2.5 px-6 border rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
             <ArrowPathIcon className="h-5 w-5 mr-2"/>ล้างตัวกรอง
            </button>
        </div>
      </form>

      {/* Sales Summary Report Section (ตามใบขาย) */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">สรุปยอดขาย (ตามใบขาย)</h2>
          <button onClick={() => exportToCSV(salesSummary, 'sales_summary')} disabled={isLoadingSummary || salesSummary.length === 0}
            className={`mt-2 sm:mt-0 flex items-center py-2 px-4 rounded-lg text-sm font-medium text-white ${ (isLoadingSummary || salesSummary.length === 0) ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2"/>Export CSV
          </button>
        </div>
        {!isLoadingSummary && salesSummary.length > 0 && (
          // Dynamically adjust grid columns for SummaryCards
          <div className={`grid grid-cols-1 gap-4 mb-6 ${isCustomerSelected ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
            <SummaryCard title="ยอดขายรวม" value={totalsSummary.totalAmount} icon="💰" colorClass="bg-green-500" isSmall={isCustomerSelected} />
            <SummaryCard title="ต้นทุนรวม" value={totalsSummary.totalCost} icon="💸" colorClass="bg-orange-500" isSmall={isCustomerSelected} />
            <SummaryCard title="กำไรรวม" value={totalsSummary.totalProfit} icon="🏆" colorClass="bg-teal-500" isSmall={isCustomerSelected} />
            {isCustomerSelected && (
              <SummaryCard title="ยอดค้างชำระรวม" value={totalOutstandingForCards} icon={<BanknotesIcon className={`inline-block ${isCustomerSelected ? 'h-7 w-7' : 'h-8 w-8' } opacity-80`} />} colorClass="bg-red-500" isSmall={isCustomerSelected} />
            )}
          </div>
        )}
        {isLoadingSummary && salesSummary.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl shadow"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mx-auto"></div><p className="mt-3 text-sm text-gray-500">กำลังโหลดสรุปยอดขาย...</p></div>
        )}
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">เลขที่ใบขาย</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">วันที่ขาย</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">ชื่อลูกค้า</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase min-w-[300px]">รายการสินค้า</th>
                <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ยอดขายรวม (บาท)</th>
                <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ชำระแล้ว (บาท)</th>
                <th className="px-5 py-3 border-b-2 text-center text-xs font-semibold uppercase">สถานะ</th>
                <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ต้นทุนรวม (บาท)</th>
                <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">กำไร (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!isLoadingSummary && salesSummary.length > 0 ? (
                salesSummary.map((sale, index) => (
                  <tr key={sale.saleId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-5 py-4 text-sm">{sale.saleId}</td>
                    <td className="px-5 py-4 text-sm">{new Date(sale.saleDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                    <td className="px-5 py-4 text-sm">{sale.customerName || '-'}</td>
                    <td className="px-5 py-4 text-xs max-w-xs whitespace-pre-wrap">{formatItemsSoldStringForDisplay(sale.itemsSoldFormatted)}</td>
                    <td className="px-5 py-4 text-sm text-right">{sale.totalAmount != null ? sale.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td className="px-5 py-4 text-sm text-right">{sale.amountPaid != null ? sale.amountPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td className="px-5 py-4 text-sm text-center">
                        {sale.paymentStatus === 'paid' && <span className="px-2 py-1 text-xs font-semibold leading-tight text-green-700 bg-green-100 rounded-full">ชำระแล้ว</span>}
                        {sale.paymentStatus === 'partial' && <span className="px-2 py-1 text-xs font-semibold leading-tight text-orange-700 bg-orange-100 rounded-full">ชำระบางส่วน</span>}
                        {sale.paymentStatus === 'unpaid' && <span className="px-2 py-1 text-xs font-semibold leading-tight text-red-700 bg-red-100 rounded-full">ยังไม่ชำระ</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-right">{sale.totalCost != null ? sale.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-right text-green-600">{sale.profit != null ? sale.profit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                  </tr>
                ))
              ) : ( !isLoadingSummary && ( <tr><td colSpan="9" className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูลสรุปยอดขาย</td></tr>))}
            </tbody>
            {!isLoadingSummary && salesSummary.length > 0 && ( 
                <tfoot className="bg-gray-200 font-semibold">
                    <tr>
                        <td colSpan="4" className="px-5 py-3 text-right text-sm uppercase">รวมทั้งสิ้น:</td>
                        <td className="px-5 py-3 text-right text-sm">{totalsSummary.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                        <td className="px-5 py-3 text-right text-sm">{totalsSummary.totalAmountPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                        <td className="px-5 py-3 text-center text-sm">-</td> 
                        <td className="px-5 py-3 text-right text-sm">{totalsSummary.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                        <td className="px-5 py-3 text-right text-sm font-bold text-green-700">{totalsSummary.totalProfit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>
      </div>

      <hr className="my-10 border-gray-300"/>

      {/* Sales by Product Report Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">รายงานยอดขาย (ตามสินค้า)</h2>
          <button onClick={() => exportToCSV(salesByProduct, 'sales_by_product')} disabled={isLoadingByProduct || salesByProduct.length === 0}
            className={`mt-2 sm:mt-0 flex items-center py-2 px-4 rounded-lg text-sm font-medium text-white ${ (isLoadingByProduct || salesByProduct.length === 0) ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2"/>Export CSV
          </button>
        </div>
        {isLoadingByProduct && salesByProduct.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl shadow"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mx-auto"></div><p className="mt-3 text-sm text-gray-500">กำลังโหลดรายงานยอดขายตามสินค้า...</p></div>
        )}
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full leading-normal">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">รหัสสินค้า</th>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">ชื่อสินค้า</th>
                        <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">จำนวนที่ขาย (ชิ้น)</th>
                        <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ยอดขายรวม (บาท)</th>
                        <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ต้นทุนรวม (บาท)</th>
                        <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">กำไรรวม (บาท)</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {!isLoadingByProduct && salesByProduct.length > 0 ? (
                        salesByProduct.map((itemData, index) => (
                            <tr key={itemData.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                                <td className="px-5 py-4 text-sm">{itemData.productId}</td>
                                <td className="px-5 py-4 text-sm font-medium">{itemData.productName}</td>
                                <td className="px-5 py-4 text-sm text-right">{itemData.totalQuantitySold.toLocaleString('th-TH')}</td>
                                <td className="px-5 py-4 text-sm text-right">{itemData.totalRevenue != null ? itemData.totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="px-5 py-4 text-sm text-right">{itemData.totalCostOfGoodsSold != null ? itemData.totalCostOfGoodsSold.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="px-5 py-4 text-sm font-semibold text-right text-green-600">{itemData.totalProfit != null ? itemData.totalProfit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                            </tr>
                        ))
                    ) : ( !isLoadingByProduct && ( <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูลยอดขายตามสินค้าในช่วงวันที่ที่เลือก</td></tr>))}
                </tbody>
            </table>
        </div>
      </div>

      <hr className="my-10 border-gray-300"/>

      {/* --- SALES BY CUSTOMER REPORT --- */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">รายงานยอดขาย (ตามลูกค้า)</h2>
          <button 
            onClick={() => exportToCSV(salesByCustomer, 'sales_by_customer')}
            disabled={isLoadingByCustomer || salesByCustomer.length === 0}
            className={`mt-2 sm:mt-0 flex items-center py-2 px-4 rounded-lg text-sm font-medium text-white ${ (isLoadingByCustomer || salesByCustomer.length === 0) ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2"/>Export CSV
          </button>
        </div>

        {isLoadingByCustomer && salesByCustomer.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl shadow"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mx-auto"></div><p className="mt-3 text-sm text-gray-500">กำลังโหลดรายงานยอดขายตามลูกค้า...</p></div>
        )}
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full leading-normal">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">รหัสลูกค้า</th>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">ชื่อลูกค้า</th>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">เบอร์โทร</th>
                        <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">จำนวนครั้งที่ซื้อ</th>
                        <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ยอดซื้อรวม (บาท)</th>
                        <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">ต้นทุนรวม (บาท)</th>
                        <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">กำไรรวม (บาท)</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {!isLoadingByCustomer && salesByCustomer.length > 0 ? (
                        salesByCustomer.map((customerSale, index) => (
                            <tr key={customerSale.customerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                                <td className="px-5 py-4 text-sm">{customerSale.customerId}</td>
                                <td className="px-5 py-4 text-sm font-medium">{customerSale.customerName}</td>
                                <td className="px-5 py-4 text-sm">{customerSale.customerPhone || '-'}</td>
                                <td className="px-5 py-4 text-sm text-right">{customerSale.totalOrders.toLocaleString('th-TH')}</td>
                                <td className="px-5 py-4 text-sm text-right">{customerSale.totalSalesAmount != null ? customerSale.totalSalesAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="px-5 py-4 text-sm text-right">{customerSale.totalSalesCost != null ? customerSale.totalSalesCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="px-5 py-4 text-sm font-semibold text-right text-green-600">{customerSale.totalProfit != null ? customerSale.totalProfit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                            </tr>
                        ))
                    ) : ( !isLoadingByCustomer && ( <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูลยอดขายตามลูกค้าในช่วงวันที่ที่เลือก</td></tr>))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
