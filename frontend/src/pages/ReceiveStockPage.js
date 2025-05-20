// frontend/src/pages/ReceiveStockPage.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// ReceiveStockPage Component
const ReceiveStockPage = () => {
  console.log("ReceiveStockPage component rendering...");

  // 1. State Management
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityReceived, setQuantityReceived] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  // Removed commented out states (error, successMessage) as they are handled by toast

  // 2. Data Fetching Logic (Callback for reusability)
  const fetchProductsForSelection = useCallback(async () => {
    console.log("Fetching products for selection (ReceiveStockPage)...");
    setIsLoading(true); // Set loading state before API call
    try {
      // Request a large limit to get all (or most) products for the dropdown
      // In a real-world app with many products, a searchable/paginated select might be better.
      const response = await axios.get('/api/products?limit=1000');
      console.log("API response data (products for selection):", response.data);

      // Correctly access the data array from the API response object
      setProducts(Array.isArray(response.data.data) ? response.data.data : []);

      // Optional: pre-select the first product if the list is not empty
      // if (response.data.data && response.data.data.length > 0) {
      //   setSelectedProductId(response.data.data[0].id.toString());
      // }
    } catch (err) {
      console.error("Failed to fetch products for selection:", err);
      // Display error using toast
      toast.error('ไม่สามารถดึงรายการสินค้าได้: ' + (err.response?.data?.error || err.message));
      setProducts([]); // Ensure products array is empty on error
    } finally {
      setIsLoading(false); // Always reset loading state
      console.log("Finished fetching products.");
    }
  }, []); // No dependencies, so this function is created once

  // 3. useEffect Hook for Initial Data Fetching
  useEffect(() => {
    fetchProductsForSelection();
  }, [fetchProductsForSelection]); // Dependency on fetchProductsForSelection useCallback

  // 4. Event Handler for Form Submission
  const handleSubmitReceiveStock = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    console.log("handleSubmitReceiveStock called. Product ID:", selectedProductId, "Quantity:", quantityReceived);

    // Input Validation
    if (!selectedProductId) {
      toast.error('กรุณาเลือกสินค้า');
      return;
    }
    const quantityNum = Number(quantityReceived);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('จำนวนที่รับเข้าต้องเป็นตัวเลขที่มากกว่า 0');
      return;
    }

    setIsLoading(true); // Set loading state for submission
    try {
      // API call to receive stock
      const response = await axios.post(`/api/products/${selectedProductId}/receive`, {
        quantityReceived: quantityNum,
      });
      console.log("Stock received response:", response.data);

      // Find product name for success message
      const productName = products.find(p => p.id.toString() === selectedProductId)?.name || 'ที่เลือก';
      toast.success(`รับสินค้า "${productName}" จำนวน ${quantityNum} ชิ้นเข้าสต็อกเรียบร้อยแล้ว (คงเหลือใหม่: ${response.data.product?.quantity})`);

      // Reset form fields
      setSelectedProductId('');
      setQuantityReceived(1);

      // Re-fetch product list to update stock numbers in the dropdown for immediate feedback
      fetchProductsForSelection();
    } catch (err) {
      console.error("Failed to receive stock:", err);
      toast.error(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการรับสินค้าเข้าสต็อก');
    } finally {
      setIsLoading(false); // Always reset loading state
    }
  };

  console.log("ReceiveStockPage return statement reached. isLoading:", isLoading);

  // 5. Render JSX
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">รับสินค้าเข้าสต็อก</h1>

      <form onSubmit={handleSubmitReceiveStock} className="bg-white p-8 rounded-xl shadow-lg space-y-6 max-w-lg mx-auto">
        {/* Product Selection */}
        <div>
          <label htmlFor="productSelect" className="block text-sm font-medium text-gray-700 mb-1">
            เลือกสินค้า <span className="text-red-500">*</span>
          </label>
          <select
            id="productSelect"
            name="productSelect"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            disabled={isLoading || products.length === 0} // Disable if loading or no products
          >
            <option value="" disabled>-- กรุณาเลือกสินค้า --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id.toString()}>
                {product.name} (ปัจจุบัน: {product.quantity} ชิ้น)
              </option>
            ))}
          </select>
          {/* Loading/No products feedback for dropdown */}
          {isLoading && products.length === 0 && <p className="text-xs text-gray-500 mt-1">กำลังโหลดรายการสินค้า...</p>}
          {!isLoading && products.length === 0 && <p className="text-xs text-gray-500 mt-1">ไม่พบรายการสินค้าในระบบ</p>}
        </div>

        {/* Quantity Input */}
        <div>
          <label htmlFor="quantityReceived" className="block text-sm font-medium text-gray-700 mb-1">
            จำนวนที่รับเข้า <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantityReceived"
            id="quantityReceived"
            value={quantityReceived}
            onChange={(e) => setQuantityReceived(e.target.value)}
            required
            min="1"
            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            // Disable button if loading, no product selected, or quantity is invalid
            disabled={isLoading || !selectedProductId || Number(quantityReceived) <= 0}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white transition duration-150 ease-in-out ${
              isLoading || !selectedProductId || Number(quantityReceived) <= 0
                ? 'bg-sky-400 cursor-not-allowed' // Grey out and disable cursor
                : 'bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
            }`}
          >
            {isLoading ? (
              <>
                {/* Spinner Icon */}
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึก...
              </>
            ) : (
              'บันทึกการรับสินค้า'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiveStockPage;