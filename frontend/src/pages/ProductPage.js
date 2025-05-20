// frontend/src/pages/ProductPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'; // เพิ่ม PlusIcon สำหรับปุ่มเพิ่มสินค้า

// ProductModal Component with corrected Rules of Hooks and new layout
const ProductModal = ({ isOpen, onClose, onSubmit, productData, setProductData, isEditing, isLoading }) => {
  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null; 

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (['quantity', 'price', 'cost'].includes(name)) {
      // Allow empty string for clearing the input, otherwise parse to float
      processedValue = value === '' ? '' : parseFloat(value);
    }
    setProductData(prev => ({ ...prev, [name]: processedValue }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!productData.name || productData.name.trim() === '') {
      errors.name = 'กรุณากรอกชื่อสินค้า';
    }
    // Validate quantity: allow 0, but not negative or non-numeric if not empty
    if (productData.quantity === '' || productData.quantity === undefined || isNaN(parseFloat(productData.quantity)) || parseFloat(productData.quantity) < 0) {
      errors.quantity = 'จำนวนต้องเป็นตัวเลขที่ไม่ติดลบ';
    }
    // Validate price: allow 0, but not negative or non-numeric if not empty
    if (productData.price === '' || productData.price === undefined || isNaN(parseFloat(productData.price)) || parseFloat(productData.price) < 0) {
      errors.price = 'ราคาขายต้องเป็นตัวเลขที่ไม่ติดลบ';
    }
    // Validate cost: allow 0, but not negative or non-numeric if not empty
    if (productData.cost === '' || productData.cost === undefined || isNaN(parseFloat(productData.cost)) || parseFloat(productData.cost) < 0) {
      errors.cost = 'ต้นทุนต้องเป็นตัวเลขที่ไม่ติดลบ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit();
    } else {
      toast.warn("กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">{isEditing ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
        <form onSubmit={handleFormSubmit} className="space-y-6"> {/* เพิ่ม space-y-6 เพื่อระยะห่างระหว่างกลุ่ม */}
          <div> {/* Group for Product Name */}
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              id="name"
              value={productData.name || ''}
              onChange={handleChange}
              className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm sm:text-sm ${formErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`}
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>

          {/* Group for Quantity, Price, Cost in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">จำนวน <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                value={productData.quantity === '' ? '' : (productData.quantity ?? 0)} // Use nullish coalescing for default 0
                onChange={handleChange}
                min="0"
                className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm sm:text-sm ${formErrors.quantity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`}
              />
              {formErrors.quantity && <p className="mt-1 text-xs text-red-600">{formErrors.quantity}</p>}
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="price"
                id="price"
                value={productData.price === '' ? '' : (productData.price ?? 0.0)}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm sm:text-sm ${formErrors.price ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`}
              />
              {formErrors.price && <p className="mt-1 text-xs text-red-600">{formErrors.price}</p>}
            </div>
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">ต้นทุน (บาท) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="cost"
                id="cost"
                value={productData.cost === '' ? '' : (productData.cost ?? 0.0)}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm sm:text-sm ${formErrors.cost ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`}
              />
              {formErrors.cost && <p className="mt-1 text-xs text-red-600">{formErrors.cost}</p>}
            </div>
          </div>
          
          {/* Buttons moved up, directly below the quantity/price/cost row */}
          <div className="flex justify-end space-x-3 pt-2"> {/* ลด pt จาก mt-8 เป็น pt-2 หรือตามความเหมาะสม */}
            <button type="button" onClick={onClose} disabled={isLoading} className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition">ยกเลิก</button>
            <button type="submit" disabled={isLoading} className={`px-6 py-2 text-sm font-medium text-white rounded-lg shadow-md transition ${ isLoading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'}`}>
              {isLoading ? (isEditing ? 'กำลังบันทึก...' : 'กำลังเพิ่ม...') : (isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มสินค้า')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ id: null, name: '', quantity: '', price: '', cost: '' }); // Initialize numeric fields as empty string for placeholder
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchProducts = useCallback(async (pageToFetch = 1, currentSearchTerm = searchTerm) => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/products', {
        params: { page: pageToFetch, limit: itemsPerPage, search: currentSearchTerm }
      });
      setProducts(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลสินค้าได้');
      setProducts([]); setTotalPages(0); setTotalItems(0);
    } finally { setIsLoading(false); }
  }, [searchTerm, itemsPerPage]); // Removed currentPage from deps as it's passed as argument

  useEffect(() => {
    fetchProducts(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchProducts]);

  const handleSubmitProduct = async () => { 
    setIsLoading(true);
    // Ensure numeric fields are numbers before submitting, default to 0 if empty string
    const productDataToSubmit = {
      name: currentProduct.name.trim(),
      quantity: currentProduct.quantity === '' ? 0 : Number(currentProduct.quantity),
      price: currentProduct.price === '' ? 0.0 : Number(currentProduct.price),
      cost: currentProduct.cost === '' ? 0.0 : Number(currentProduct.cost),
    };
    try {
      let responseMessage = '';
      if (isEditing && currentProduct.id) {
        await axios.put(`/api/products/${currentProduct.id}`, productDataToSubmit);
        responseMessage = `แก้ไขข้อมูลสินค้า "${productDataToSubmit.name}" สำเร็จ!`;
      } else {
        await axios.post('/api/products', productDataToSubmit);
        responseMessage = `เพิ่มสินค้า "${productDataToSubmit.name}" สำเร็จ!`;
      }
      toast.success(responseMessage);
      if (!isEditing) {
        setSearchTerm(''); 
        fetchProducts(1, ''); 
      } else {
        fetchProducts(currentPage, searchTerm);
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteProduct = async (productId, productName) => { 
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${productName}"? การกระทำนี้ไม่สามารถยกเลิกได้ และจะส่งผลกระทบต่อประวัติการขายที่เกี่ยวข้องด้วย`)) { // เพิ่มข้อความยืนยัน
      setIsLoading(true);
      try {
        await axios.delete(`/api/products/${productId}`);
        toast.success(`ลบสินค้า "${productName}" สำเร็จ!`);
        if (products.length === 1 && currentPage > 1) {
            fetchProducts(currentPage - 1, searchTerm);
        } else {
            fetchProducts(currentPage, searchTerm);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
      } finally {
        setIsLoading(false);
      }
    }
  };
  const openAddModal = () => { 
    setIsEditing(false); 
    setCurrentProduct({ id: null, name: '', quantity: '', price: '', cost: '' }); // Initialize with empty strings
    setIsModalOpen(true); 
  };
  const openEditModal = (product) => { 
    setIsEditing(true); 
    // Ensure that when editing, numeric fields are set correctly, handling potential nulls from API
    setCurrentProduct({
        ...product,
        quantity: product.quantity ?? '', // Use ?? to default to empty string if null/undefined
        price: product.price ?? '',
        cost: product.cost ?? '',
    }); 
    setIsModalOpen(true);
  };
  const closeModal = () => { 
    setIsModalOpen(false); 
    // Consider resetting formErrors here if you want them cleared when modal is closed by "Cancel"
    // setFormErrors({}); // in ProductModal if needed
  };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) { fetchProducts(newPage, searchTerm); } };
  const handleSearchInputChange = (e) => { setSearchTerm(e.target.value); };
  const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); fetchProducts(1, searchTerm); };

  return (
    <div className="container mx-auto p-6"> {/* เพิ่ม padding รอบคอนเทนต์ */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center space-x-2"> {/* ปรับเป็น font-extrabold, เพิ่ม flex items-center space-x-2 */}
            <PlusIcon className="h-8 w-8 text-sky-600" /> {/* เพิ่มไอคอน */}
            <span>จัดการสินค้า</span>
        </h1>
        <button onClick={openAddModal} className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all duration-200">
          <PlusIcon className="h-5 w-5" /> {/* ใช้ PlusIcon ขนาดเล็กในปุ่ม */}
          <span>เพิ่มสินค้าใหม่</span>
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex max-w-md"> {/* จำกัดความกว้างของฟอร์มค้นหา */}
        <input
          type="text"
          placeholder="ค้นหาสินค้าด้วยชื่อ..."
          value={searchTerm}
          onChange={handleSearchInputChange}
          className="flex-grow p-3 border border-gray-300 rounded-l-lg shadow-sm focus:ring-sky-500 focus:border-sky-500"
        />
        <button type="submit" className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-r-lg shadow-md transition-colors duration-200">ค้นหา</button>
      </form>

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-100 border-b border-gray-200"> {/* เพิ่ม border-b */}
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อสินค้า</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">จำนวน</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ราคาขาย (บาท)</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ต้นทุน (บาท)</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200"> {/* เพิ่ม divide-y */}
            {isLoading && products.length === 0 && (<tr><td colSpan="5" className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div><p className="mt-2 text-gray-500">กำลังโหลด...</p></td></tr>)}
            {!isLoading && products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base font-semibold text-gray-900"> {/* <-- ชื่อสินค้าไฮไลท์ */}
                          {product.name}
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm ${product.quantity < 10 && product.quantity > 0 ? 'text-red-600 font-semibold' : (product.quantity === 0 ? 'text-gray-400' : 'text-gray-900')}`}>
                          {product.quantity.toLocaleString()}
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                          {product.price != null ? product.price.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                          {product.cost != null ? product.cost.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center flex justify-center items-center space-x-2"> {/* <-- ปุ่มจัดการ */}
                    <button 
                        onClick={() => openEditModal(product)} 
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-white bg-amber-500 hover:bg-amber-600 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        title="แก้ไขข้อมูลสินค้า"
                    >
                      <PencilIcon className="h-4 w-4 mr-1"/>แก้ไข
                    </button>
                    <button 
                        onClick={() => handleDeleteProduct(product.id, product.name)} 
                        disabled={isLoading} 
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-white bg-red-500 hover:bg-red-600 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="ลบข้อมูลสินค้า"
                    >
                      <TrashIcon className="h-4 w-4 mr-1"/>ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              !isLoading && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    {searchTerm.trim() !== '' ? `ไม่พบสินค้าที่ตรงกับคำค้นหา "${searchTerm}"` : 'ยังไม่มีสินค้าในระบบ'}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 0 && !isLoading && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 py-3">
          <span className="text-sm text-gray-700">หน้า {currentPage} จาก {totalPages} (ทั้งหมด {totalItems} รายการ)</span>
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50">ก่อนหน้า</button>
            {[...Array(totalPages).keys()].map(num => {
                const pageNum = num + 1;
                const showPage = (totalPages <= 7) || (pageNum <= 2) || (pageNum >= totalPages - 1) || (Math.abs(pageNum - currentPage) <= 1);
                const showEllipsisBefore = (totalPages > 7) && (pageNum === (currentPage - 2)) && (pageNum > 2);
                const showEllipsisAfter = (totalPages > 7) && (pageNum === (currentPage + 2)) && (pageNum < (totalPages - 1));
                
                if (showPage) {
                    return (<button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-3 py-1 text-sm border rounded-md hover:bg-gray-100 ${currentPage === pageNum ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-300'}`}>{pageNum}</button>);
                } else if (showEllipsisBefore || showEllipsisAfter) {
                    return <span key={`ellipsis-${pageNum}`} className="px-3 py-1 text-sm text-gray-500">...</span>;
                }
                return null;
            })}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50">ถัดไป</button>
          </div>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitProduct}
        productData={currentProduct}
        setProductData={setCurrentProduct}
        isEditing={isEditing}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ProductPage;