// frontend/src/pages/CreateSalePage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// CustomerModalForSalePage Component (เหมือนเดิม)
const CustomerModalForSalePage = ({ isOpen, onClose, onCustomerAdded }) => {
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', address: '' });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitNewCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerData.name.trim()) {
      toast.error("กรุณากรอกชื่อลูกค้า");
      return;
    }
    setIsSavingCustomer(true);
    try {
      const response = await axios.post('/api/customers', newCustomerData);
      toast.success(`เพิ่มลูกค้าใหม่ "${response.data.name}" สำเร็จ!`);
      onCustomerAdded(response.data); // Callback to update customer list and select
      onClose();
      setNewCustomerData({ name: '', phone: '', address: '' }); // Reset form
    } catch (err) {
      console.error("Failed to add new customer:", err);
      toast.error(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการเพิ่มลูกค้าใหม่');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">เพิ่มลูกค้าใหม่</h2>
        <form onSubmit={handleSubmitNewCustomer}>
          <div className="mb-4">
            <label htmlFor="newCustomerNameModalSale" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุลลูกค้า <span className="text-red-500">*</span></label>
            <input type="text" name="name" id="newCustomerNameModalSale" value={newCustomerData.name} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"/>
          </div>
          <div className="mb-4">
            <label htmlFor="newCustomerPhoneModalSale" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <input type="tel" name="phone" id="newCustomerPhoneModalSale" value={newCustomerData.phone} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"/>
          </div>
          <div className="mb-4">
            <label htmlFor="newCustomerAddressModalSale" className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
            <textarea name="address" id="newCustomerAddressModalSale" rows="3" value={newCustomerData.address} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-8">
            <button type="button" onClick={onClose} disabled={isSavingCustomer} className="px-6 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border">ยกเลิก</button>
            <button type="submit" disabled={isSavingCustomer} className={`px-6 py-2 text-sm text-white rounded-lg ${isSavingCustomer ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}>
              {isSavingCustomer ? 'กำลังบันทึก...' : 'บันทึกลูกค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const CreateSalePage = () => {
  console.log("CreateSalePage component rendering...");

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [productToAddId, setProductToAddId] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  
  const [paymentOption, setPaymentOption] = useState('credit'); // 'credit', 'partial', 'full'
  const [amountPaidInput, setAmountPaidInput] = useState(''); // For partial payment input

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    console.log("fetchData for CreateSalePage called");
    setIsLoadingData(true);
    try {
      const [customersRes, productsRes] = await Promise.all([
        axios.get('/api/customers?limit=all'),
        axios.get('/api/products?limit=1000') 
      ]);
      
      let customerList = [];
      if (Array.isArray(customersRes.data)) {
        customerList = customersRes.data;
      } else if (customersRes.data && Array.isArray(customersRes.data.data)) {
        customerList = customersRes.data.data;
      }
      setCustomers(customerList.sort((a, b) => a.name.localeCompare(b.name)));
      
      let productList = [];
      if (Array.isArray(productsRes.data.data)) {
        productList = productsRes.data.data.filter(p => p.quantity > 0);
      } else if (Array.isArray(productsRes.data)) { 
        productList = productsRes.data.filter(p => p.quantity > 0);
      }
      setProducts(productList);

    } catch (err) {
      console.error("Failed to fetch customers or products:", err);
      toast.error('ไม่สามารถดึงข้อมูลลูกค้าหรือสินค้าได้: ' + (err.response?.data?.error || err.message));
      setCustomers([]);
      setProducts([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCustomerAdded = (newCustomer) => {
    setCustomers(prevCustomers => [...prevCustomers, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedCustomerId(newCustomer.id.toString());
  };

  const handleAddSaleItem = () => {
    if (!productToAddId || Number(quantityToAdd) <= 0) {
      toast.error('กรุณาเลือกสินค้าและระบุจำนวนที่ถูกต้อง');
      return;
    }
    const product = products.find(p => p.id.toString() === productToAddId);
    if (!product) {
      toast.error('ไม่พบข้อมูลสินค้าที่เลือก');
      return;
    }
    if (Number(quantityToAdd) > product.quantity) {
      toast.error(`สินค้า "${product.name}" มีไม่เพียงพอในสต็อก (คงเหลือ: ${product.quantity})`);
      return;
    }
    const existingItemIndex = saleItems.findIndex(item => item.productId === product.id);
    if (existingItemIndex > -1) {
      const updatedSaleItems = [...saleItems];
      const currentItemInCart = updatedSaleItems[existingItemIndex];
      const newQuantityInCart = currentItemInCart.quantity + Number(quantityToAdd);
      if (newQuantityInCart > product.quantity) {
        toast.error(`สินค้า "${product.name}" มีไม่เพียงพอในสต็อกสำหรับจำนวนที่ต้องการทั้งหมด (คงเหลือ: ${product.quantity}, ในตะกร้าแล้ว: ${currentItemInCart.quantity})`);
        return;
      }
      updatedSaleItems[existingItemIndex].quantity = newQuantityInCart;
      updatedSaleItems[existingItemIndex].subtotal = newQuantityInCart * updatedSaleItems[existingItemIndex].priceAtSale;
      setSaleItems(updatedSaleItems);
    } else {
      setSaleItems(prevItems => [
        ...prevItems,
        {
          productId: product.id, name: product.name, quantity: Number(quantityToAdd),
          priceAtSale: product.price, costAtSale: product.cost,
          subtotal: Number(quantityToAdd) * product.price,
        },
      ]);
    }
    setProductToAddId('');
    setQuantityToAdd(1);
  };

  const handleRemoveSaleItem = (productIdToRemove) => {
    setSaleItems(prevItems => prevItems.filter(item => item.productId !== productIdToRemove));
  };
  
  const handleQuantityChangeInCart = (productId, newQuantityStr) => {
    const newQuantity = Number(newQuantityStr);
    const productInStock = products.find(p => p.id === productId);
    if (!productInStock) return;
    if (newQuantity <= 0) {
        handleRemoveSaleItem(productId);
        return;
    }
    if (newQuantity > productInStock.quantity) {
        toast.error(`สินค้า "${productInStock.name}" มีไม่เพียงพอในสต็อก (คงเหลือ: ${productInStock.quantity})`);
        setSaleItems(prevItems =>
            prevItems.map(item =>
                item.productId === productId
                    ? { ...item, quantity: productInStock.quantity, subtotal: productInStock.quantity * item.priceAtSale }
                    : item));
        return;
    }
    setSaleItems(prevItems =>
        prevItems.map(item =>
            item.productId === productId
                ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.priceAtSale }
                : item));
  };

  const calculateTotalAmount = () => {
    return saleItems.reduce((total, item) => total + (item.subtotal || 0), 0);
  };

  const totalAmount = calculateTotalAmount(); // คำนวณยอดรวมเก็บไว้ในตัวแปร

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('กรุณาเลือกลูกค้า'); return;
    }
    if (saleItems.length === 0) {
      toast.error('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'); return;
    }

    let actualAmountPaid = 0;
    if (paymentOption === 'full') {
      actualAmountPaid = totalAmount;
    } else if (paymentOption === 'partial') {
      const parsedAmountPaidInput = parseFloat(amountPaidInput);
      if (isNaN(parsedAmountPaidInput) || parsedAmountPaidInput <= 0) {
        toast.error('กรุณาระบุจำนวนเงินที่ชำระให้ถูกต้อง (ต้องมากกว่า 0)');
        return;
      }
      if (parsedAmountPaidInput > totalAmount) {
        toast.warn('จำนวนเงินที่ชำระมากกว่ายอดรวม จะบันทึกยอดชำระเท่ากับยอดรวม');
        actualAmountPaid = totalAmount;
      } else {
        actualAmountPaid = parsedAmountPaidInput;
      }
    } else { // 'credit'
      actualAmountPaid = 0;
    }

    setIsSubmittingSale(true);
    const saleData = {
      customerId: Number(selectedCustomerId),
      items: saleItems.map(item => ({
        productId: item.productId, quantity: item.quantity,
        priceAtSale: item.priceAtSale, costAtSale: item.costAtSale,
      })),
      totalAmount: totalAmount,
      amountPaid: actualAmountPaid, // ส่ง amountPaid ที่คำนวณแล้ว
      // paymentStatus จะถูกคำนวณที่ Backend โดยอิงจาก totalAmount และ amountPaid
    };

    try {
      const response = await axios.post('/api/sales', saleData);
      toast.success(`สร้างใบขายเลขที่ ${response.data.saleId} สำเร็จ! ยอดรวม: ${response.data.totalAmount.toFixed(2)} บาท (ชำระแล้ว: ${response.data.amountPaid.toFixed(2)} บาท, สถานะ: ${response.data.paymentStatus})`);
      setSelectedCustomerId(''); 
      setSaleItems([]); 
      setProductToAddId(''); 
      setQuantityToAdd(1);
      setPaymentOption('credit'); // Reset payment option
      setAmountPaidInput('');   // Reset amount paid input
      fetchData(); // Re-fetch products for updated stock
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการสร้างใบขาย');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Handle payment option change
  useEffect(() => {
    if (paymentOption === 'full') {
      setAmountPaidInput(totalAmount.toFixed(2));
    } else if (paymentOption === 'credit') {
      setAmountPaidInput(''); // หรือ 0 ก็ได้ แต่ '' ทำให้ input ว่าง
    }
    // For 'partial', user will input manually
  }, [paymentOption, totalAmount]);


  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">สร้างใบขายสินค้า</h1>
      <form onSubmit={handleSubmitSale} className="space-y-8">
        {/* Section 1: Customer Info */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">1. ข้อมูลลูกค้า</h2>
          <div className="flex flex-col sm:flex-row items-end sm:space-x-3 space-y-3 sm:space-y-0">
            <div className="flex-grow w-full sm:w-auto">
              <label htmlFor="customerSelectSale" className="block text-sm font-medium text-gray-700 mb-1">เลือกลูกค้า <span className="text-red-500">*</span></label>
              <select
                id="customerSelectSale"
                name="customerSelect"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                disabled={isLoadingData || customers.length === 0}
              >
                <option value="" disabled>-- กรุณาเลือกลูกค้า --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id.toString()}>
                    {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                  </option>
                ))}
              </select>
              {customers.length === 0 && !isLoadingData && <p className="text-xs text-gray-500 mt-1">ไม่พบข้อมูลลูกค้า, ลองเพิ่มลูกค้าใหม่</p>}
            </div>
            <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-5 rounded-lg shadow-md w-full sm:w-auto">
              ＋ เพิ่มลูกค้าใหม่
            </button>
          </div>
        </div>

        {/* Section 2: Add Sale Items */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">2. เพิ่มรายการสินค้า</h2>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="productToAddSelectSale" className="block text-sm font-medium text-gray-700 mb-1">เลือกสินค้า <span className="text-red-500">*</span></label>
              <select id="productToAddSelectSale" value={productToAddId} onChange={(e) => setProductToAddId(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm" disabled={isLoadingData || products.length === 0}>
                <option value="" disabled>-- เลือกสินค้า --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id.toString()} disabled={product.quantity <= 0}>
                    {product.name} (คงเหลือ: {product.quantity}, ราคา: {product.price ? product.price.toFixed(2) : 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quantityToAddSale" className="block text-sm font-medium text-gray-700 mb-1">จำนวน <span className="text-red-500">*</span></label>
              <input type="number" id="quantityToAddSale" value={quantityToAdd} onChange={(e) => setQuantityToAdd(Number(e.target.value))} min="1" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm" disabled={isLoadingData}/>
            </div>
            <button type="button" onClick={handleAddSaleItem} disabled={isLoadingData || !productToAddId || quantityToAdd <= 0} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md w-full md:w-auto disabled:opacity-50">
              เพิ่มในใบขาย
            </button>
          </div>
            {products.length === 0 && !isLoadingData && <p className="text-xs text-gray-500 mt-2">ไม่พบรายการสินค้าในสต็อก หรือสินค้าทั้งหมดหมดสต็อก</p>}
        </div>

        {/* Section 3: Current Sale Items */}
        {saleItems.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">3. รายการสินค้าในใบขายปัจจุบัน</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">สินค้า</th>
                    <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">จำนวน</th>
                    <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">ราคา/หน่วย</th>
                    <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">รวมย่อย</th>
                    <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {saleItems.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-5 py-4 text-sm">{item.name}</td>
                      <td className="px-5 py-4 text-sm">
                        <input type="number" value={item.quantity} onChange={(e) => handleQuantityChangeInCart(item.productId, e.target.value)} min="1" className="w-20 p-1 border rounded-md text-center"/>
                      </td>
                      <td className="px-5 py-4 text-sm">{item.priceAtSale ? item.priceAtSale.toFixed(2) : '0.00'}</td>
                      <td className="px-5 py-4 text-sm font-semibold">{item.subtotal ? item.subtotal.toFixed(2) : '0.00'}</td>
                      <td className="px-5 py-4 text-sm">
                        <button type="button" onClick={() => handleRemoveSaleItem(item.productId)} className="text-red-500 hover:text-red-700 font-semibold">ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-6">
              <p className="text-2xl font-bold text-gray-800">ยอดรวมทั้งสิ้น: <span className="text-sky-600">{totalAmount.toFixed(2)} บาท</span></p>
            </div>
          </div>
        )}
        
        {/* Section 4: Payment Options */}
        {saleItems.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">4. การชำระเงิน</h2>
            <div className="space-y-3 mb-4">
              <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="paymentOption" value="credit" checked={paymentOption === 'credit'} onChange={(e) => setPaymentOption(e.target.value)} className="form-radio h-5 w-5 text-sky-600"/>
                <span className="text-sm font-medium text-gray-700">เครดิต (ค้างชำระทั้งหมด)</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="paymentOption" value="full" checked={paymentOption === 'full'} onChange={(e) => setPaymentOption(e.target.value)} className="form-radio h-5 w-5 text-sky-600"/>
                <span className="text-sm font-medium text-gray-700">ชำระเต็มจำนวน ({totalAmount.toFixed(2)} บาท)</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="paymentOption" value="partial" checked={paymentOption === 'partial'} onChange={(e) => setPaymentOption(e.target.value)} className="form-radio h-5 w-5 text-sky-600"/>
                <span className="text-sm font-medium text-gray-700">ชำระบางส่วน</span>
              </label>
            </div>

            {paymentOption === 'partial' && (
              <div className="mt-4">
                <label htmlFor="amountPaidInput" className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนเงินที่ชำระ (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amountPaidInput"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  min="0.01"
                  step="0.01"
                  max={totalAmount.toFixed(2)} // Optional: prevent overpayment here
                  required={paymentOption === 'partial'}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  placeholder="0.00"
                />
                 {parseFloat(amountPaidInput) > totalAmount && (
                    <p className="text-xs text-orange-600 mt-1">จำนวนเงินที่ชำระมากกว่ายอดรวม ระบบจะบันทึกยอดชำระเท่ากับยอดรวม</p>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="pt-4">
          <button type="submit" disabled={isSubmittingSale || saleItems.length === 0 || !selectedCustomerId || isLoadingData}
            className={`w-full flex justify-center py-3.5 px-4 rounded-lg shadow-lg text-lg font-medium text-white ${isSubmittingSale || saleItems.length === 0 || !selectedCustomerId || isLoadingData ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            {isSubmittingSale ? 'กำลังสร้างใบขาย...' : 'ยืนยันการขายและตัดสต็อก'}
          </button>
        </div>
      </form>

      <CustomerModalForSalePage
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerAdded={handleCustomerAdded}
      />
    </div>
  );
};

export default CreateSalePage;
