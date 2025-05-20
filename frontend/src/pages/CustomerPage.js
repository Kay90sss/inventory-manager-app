// frontend/src/pages/CustomerPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline'; // Added UserPlusIcon and other relevant icons

// CustomerModal Component with improved layout
const CustomerModal = ({ isOpen, onClose, onSubmit, customerData, setCustomerData, isEditing, isLoading }) => {
  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!customerData.name || customerData.name.trim() === '') {
      errors.name = 'กรุณากรอกชื่อ-นามสกุลลูกค้า';
    }
    // Optional: Validate phone format
    if (customerData.phone && !/^\d{9,10}$/.test(customerData.phone.replace(/-/g, ''))) {
      errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวเลข 9-10 หลัก)';
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">{isEditing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
        {/* Added space-y-6 to form for consistent spacing between field groups */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div> {/* Name field group */}
            <label htmlFor="customerNameModal" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              id="customerNameModal"
              value={customerData.name || ''}
              onChange={handleChange}
              className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm sm:text-sm ${formErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`}
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>

          <div> {/* Phone field group */}
            <label htmlFor="customerPhoneModal" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              name="phone"
              id="customerPhoneModal"
              value={customerData.phone || ''}
              onChange={handleChange}
              className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm sm:text-sm ${formErrors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`}
              placeholder="เช่น 0812345678"
            />
            {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
          </div>

          <div> {/* Address field group */}
            <label htmlFor="customerAddressModal" className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
            <textarea
              name="address"
              id="customerAddressModal"
              rows="3"
              value={customerData.address || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
            ></textarea>
          </div>

          {/* Buttons moved up, using pt-2 for spacing from the form's space-y-6 */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 text-sm font-medium text-white rounded-lg shadow-md transition ${isLoading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'}`}
            >
              {isLoading ? (isEditing ? 'กำลังบันทึก...' : 'กำลังเพิ่ม...') : (isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มลูกค้า')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({ id: null, name: '', phone: '', address: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [, setTotalItems] = useState(0); // This state isn't directly used for rendering but useful for context

  const itemsPerPage = 10;

  const fetchCustomers = useCallback(async (pageToFetch = 1, currentSearchTerm = searchTerm) => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/customers', {
        params: { page: pageToFetch, limit: itemsPerPage, search: currentSearchTerm }
      });
      setCustomers(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถดึงข้อมูลลูกค้าได้');
      setCustomers([]); setTotalPages(0); setTotalItems(0);
    } finally { setIsLoading(false); }
  }, [searchTerm, itemsPerPage]); // Removed currentPage from dependency array to prevent infinite loop

  useEffect(() => {
    fetchCustomers(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchCustomers]); // Dependencies are correct here

  const handleSubmitCustomer = async () => {
    setIsLoading(true);
    const customerDataToSubmit = {
      name: currentCustomer.name.trim(), // Ensure name is trimmed
      phone: currentCustomer.phone?.trim() || null, // Trim and default to null if empty
      address: currentCustomer.address?.trim() || null, // Trim and default to null if empty
    };
    try {
      let responseMessage = '';
      if (isEditing && currentCustomer.id) {
        await axios.put(`/api/customers/${currentCustomer.id}`, customerDataToSubmit);
        responseMessage = `แก้ไขข้อมูลลูกค้า "${customerDataToSubmit.name}" สำเร็จ!`;
      } else {
        await axios.post('/api/customers', customerDataToSubmit);
        responseMessage = `เพิ่มลูกค้า "${customerDataToSubmit.name}" สำเร็จ!`;
      }
      toast.success(responseMessage);
      if (!isEditing) {
        // If adding a new customer, reset search term and fetch from page 1
        setSearchTerm('');
        fetchCustomers(1, '');
      } else {
        // If editing existing customer, re-fetch current page with current search term
        fetchCustomers(currentPage, searchTerm);
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลูกค้า');
    } finally {
      setIsLoading(false);
    }
  };

  const openModalForEdit = (customer) => {
    setCurrentCustomer(customer);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openModalForAdd = () => {
    setCurrentCustomer({ id: null, name: '', phone: '', address: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบลูกค้า "${customer.name}" หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้ และจะส่งผลกระทบต่อประวัติการขายที่เกี่ยวข้องด้วย`)) return; // Improved confirmation message
    setIsLoading(true);
    try {
      await axios.delete(`/api/customers/${customer.id}`);
      toast.success(`ลบลูกค้า "${customer.name}" เรียบร้อยแล้ว`);
      // If the last item on the current page is deleted, go back to the previous page
      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchCustomers(currentPage, searchTerm); // Re-fetch current page
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'ไม่สามารถลบลูกค้าได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchCustomers(1, searchTerm); // Re-fetch with new search term from page 1
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Pagination rendering function
  const renderPagination = () => {
    const pageNumbers = [];
    if (totalPages <= 1) return null; // Don't show pagination if only one page

    const maxPageButtons = 7; // Number of buttons to show around current page
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, currentPage + Math.floor(maxPageButtons / 2));

    // Adjust start/end to ensure maxPageButtons are always shown if totalPages allows
    if (endPage - startPage + 1 < maxPageButtons) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxPageButtons + 1);
      }
    }

    // Populate page numbers array
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav aria-label="pagination navigation" className="flex justify-center space-x-1">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous Page"
        >
          &laquo;
        </button>

        {/* First page and ellipsis */}
        {startPage > 1 && (
          <>
            <button onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-200">
              1
            </button>
            {startPage > 2 && (
              <span key="ellipsis-before" className="px-3 py-1 text-gray-500">...</span>
            )}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map(pageNum => (
          <button
            key={`page-${pageNum}`}
            onClick={() => setCurrentPage(pageNum)}
            className={`px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-200 ${
              currentPage === pageNum ? 'bg-sky-600 text-white' : ''
            }`}
            aria-current={currentPage === pageNum ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        {/* Last page and ellipsis */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span key="ellipsis-after" className="px-3 py-1 text-gray-500">...</span>
            )}
            <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-200">
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next Page"
        >
          &raquo;
        </button>
      </nav>
    );
  };

  // Close modal on ESC key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  // Reset scroll to top when page changes (only relevant for content scroll)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <main className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center space-x-2">
          <UserPlusIcon className="w-8 h-8 text-sky-600" />
          <span>จัดการข้อมูลลูกค้า</span>
        </h1>
        <button
          onClick={openModalForAdd}
          className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-5 py-2 bg-sky-600 text-white rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          aria-label="เพิ่มลูกค้าใหม่"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span>เพิ่มลูกค้า</span>
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex max-w-md">
        <input
          type="search"
          placeholder="ค้นหาชื่อหรือเบอร์โทรลูกค้า"
          value={searchTerm}
          onChange={handleSearchInputChange}
          className="flex-grow rounded-l-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          aria-label="ค้นหาลูกค้า"
        />
        <button
          type="submit"
          className="rounded-r-lg bg-sky-600 px-6 py-2 text-white font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          aria-label="ค้นหา"
        >
          ค้นหา
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg shadow-sm">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[5%]">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[30%]">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[20%]">เบอร์โทรศัพท์</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[35%]">ที่อยู่</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-[10%]">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูลลูกค้า {searchTerm ? `สำหรับคำค้น "${searchTerm}"` : ''}
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-4 py-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-4 py-3">{customer.name}</td>
                  <td className="px-4 py-3">{customer.phone || '-'}</td>
                  <td className="px-4 py-3">{customer.address || '-'}</td>
                  <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                    <Link
                      to={`/customers/${customer.id}/sales-history`}
                      className="inline-block p-1 text-sky-600 hover:text-sky-900"
                      title="ดูประวัติการซื้อ"
                      aria-label={`ดูประวัติการซื้อของลูกค้า ${customer.name}`}
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => openModalForEdit(customer)}
                      className="inline-block p-1 text-yellow-500 hover:text-yellow-700"
                      title="แก้ไขข้อมูลลูกค้า"
                      aria-label={`แก้ไขข้อมูลลูกค้า ${customer.name}`}
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="inline-block p-1 text-red-600 hover:text-red-800"
                      title="ลบข้อมูลลูกค้า"
                      aria-label={`ลบข้อมูลลูกค้า ${customer.name}`}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        {renderPagination()}
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitCustomer}
        customerData={currentCustomer}
        setCustomerData={setCurrentCustomer}
        isEditing={isEditing}
        isLoading={isLoading}
      />
    </main>
  );
};

export default CustomerPage;