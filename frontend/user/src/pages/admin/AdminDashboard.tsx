import { useState, useEffect } from 'react';
import { BASE_URL } from '../../routes/api';
import Button from '../../components/button';
import Modal from '../../components/modal';
import Notification from '../../components/notification';

interface ReportedProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  status: string;
  location: string;
  reportedBy: Array<{
    _id: string;
    userName: string;
    email: string;
  }>;
  sellerId: {
    _id: string;
    userName: string;
    email: string;
    schoolName: string;
  };
  createdAt: string;
}

export default function AdminDashboard() {
  const [reportedProducts, setReportedProducts] = useState<ReportedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ReportedProduct | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    reportedProducts: 0,
    totalChats: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    fetchReportedProducts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchReportedProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/admin/reported-products?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setReportedProducts(data.data.products);
      }
    } catch (error) {
      console.error('Failed to fetch reported products:', error);
      setNotification({ show: true, message: 'Failed to load reported products', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (product: ReportedProduct) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (product: ReportedProduct) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/admin/products/${selectedProduct._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setNotification({ show: true, message: 'Product deleted successfully', type: 'success' });
        setReportedProducts((prev) => prev.filter((p) => p._id !== selectedProduct._id));
        setShowDeleteConfirm(false);
        setShowDetailsModal(false);
        setSelectedProduct(null);
        fetchDashboardData();
      } else {
        setNotification({
          show: true,
          message: data.message || 'Failed to delete product',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setNotification({ show: true, message: 'Failed to delete product', type: 'error' });
    }
  };

  const handleResolve = async (productId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/admin/products/${productId}/resolve-report`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setNotification({ show: true, message: 'Report resolved successfully', type: 'success' });
        setReportedProducts((prev) => prev.filter((p) => p._id !== productId));
        fetchDashboardData();
      } else {
        setNotification({
          show: true,
          message: data.message || 'Failed to resolve report',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Resolve failed:', error);
      setNotification({ show: true, message: 'Failed to resolve report', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Users</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Products</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Reported Products</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.reportedProducts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Chats</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalChats}</div>
          </div>
        </div>

        {/* Reported Products Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Reported Products</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : reportedProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No reported products</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportedProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={product.images[0] || '/placeholder.png'}
                            alt={product.title}
                            className="h-12 w-12 rounded object-cover"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.title}</div>
                            <div className="text-sm text-gray-500 text-left">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 text-left">{product.sellerId.userName}</div>
                        <div className="text-sm text-gray-500 text-left">{product.sellerId.schoolName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-left">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {product.reportedBy.length} report
                          {product.reportedBy.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2 text-left">
                        <button
                          onClick={() => handleViewDetails(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleResolve(product._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} width="70vw">
        {selectedProduct && (
          <div className="p-2">
            {/* Header with title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
                  {selectedProduct.reportedBy.length} Report{selectedProduct.reportedBy.length !== 1 ? 's' : ''}
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  {selectedProduct.category}
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                  {selectedProduct.condition}
                </span>
              </div>
            </div>

            {/* Main content - two column layout */}
            <div className="flex gap-6">
              {/* Left column - Images */}
              <div className="w-64 flex-shrink-0">
                {selectedProduct.images.length > 0 && (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.title}
                    className="w-full h-64 object-cover rounded-lg shadow-sm border border-gray-200"
                  />
                )}
                {selectedProduct.images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedProduct.images.slice(1, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt=""
                        className="w-full h-16 object-cover rounded-md border border-gray-200"
                      />
                    ))}
                  </div>
                )}
                
                {/* Price */}
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <div className="text-xs uppercase tracking-wide text-green-600 font-semibold">Price</div>
                  <div className="text-2xl font-bold text-green-700">${selectedProduct.price.toFixed(2)}</div>
                </div>
              </div>

              {/* Right column - Details */}
              <div className="flex-1 min-w-0">
                {/* Description */}
                <div className="mb-5">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Description</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedProduct.description || 'No description provided'}</p>
                </div>

                {/* Location */}
                <div className="mb-5">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Location</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedProduct.location}
                  </div>
                </div>

                {/* Seller Info */}
                <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Seller Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {selectedProduct.sellerId.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedProduct.sellerId.userName}</div>
                      <div className="text-sm text-gray-500">{selectedProduct.sellerId.email}</div>
                    </div>
                  </div>
                </div>

                {/* Reported By */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <h4 className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Reported By
                  </h4>
                  <div className="space-y-2">
                    {selectedProduct.reportedBy.map((reporter) => (
                      <div key={reporter._id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 font-medium text-xs">
                            {reporter.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-gray-700">{reporter.userName}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{reporter.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                text="Resolve Report"
                color="#16A34A"
                onClick={() => {
                  handleResolve(selectedProduct._id);
                  setShowDetailsModal(false);
                }}
              />
              <Button
                text="Delete Product"
                color="#DC2626"
                onClick={() => handleDeleteClick(selectedProduct)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} width="420px">
        {selectedProduct && (
          <div className="text-center p-2">
            {/* Warning Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-600 mb-6">
              You're about to delete <span className="font-semibold text-gray-900">"{selectedProduct.title}"</span>. 
              This action cannot be undone and will permanently remove this listing.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Product
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
