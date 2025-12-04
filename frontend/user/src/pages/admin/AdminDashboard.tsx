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
      <div className="bg-white shadow">
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
                      Seller
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
                            <div className="text-sm text-gray-500">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{product.sellerId.userName}</div>
                        <div className="text-sm text-gray-500">{product.sellerId.schoolName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {product.reportedBy.length} report
                          {product.reportedBy.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2">
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
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
        {selectedProduct && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">{selectedProduct.title}</h2>

            {/* Images */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {selectedProduct.images.map((img, idx) => (
                <img key={idx} src={img} alt="" className="w-full h-32 object-cover rounded" />
              ))}
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-semibold">Price:</span> ${selectedProduct.price.toFixed(2)}
              </div>
              <div>
                <span className="font-semibold">Category:</span> {selectedProduct.category}
              </div>
              <div>
                <span className="font-semibold">Condition:</span> {selectedProduct.condition}
              </div>
              <div>
                <span className="font-semibold">Location:</span> {selectedProduct.location}
              </div>
              <div>
                <span className="font-semibold">Description:</span>
                <p className="mt-1 text-gray-700">{selectedProduct.description}</p>
              </div>
              <div>
                <span className="font-semibold">Seller:</span> {selectedProduct.sellerId.userName} (
                {selectedProduct.sellerId.email})
              </div>
              <div>
                <span className="font-semibold">Reported by:</span>
                <ul className="mt-1 list-disc list-inside">
                  {selectedProduct.reportedBy.map((reporter) => (
                    <li key={reporter._id}>
                      {reporter.userName} ({reporter.email})
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                text="Delete Product"
                color="#DC2626"
                onClick={() => handleDeleteClick(selectedProduct)}
              />
              <Button
                text="Resolve Report"
                color="#16A34A"
                onClick={() => {
                  handleResolve(selectedProduct._id);
                  setShowDetailsModal(false);
                }}
              />
              <Button text="Close" color="#9CA3AF" onClick={() => setShowDetailsModal(false)} />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        {selectedProduct && (
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete "{selectedProduct.title}"? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-center">
              <Button text="Delete" color="#DC2626" onClick={handleDeleteConfirm} />
              <Button text="Cancel" color="#9CA3AF" onClick={() => setShowDeleteConfirm(false)} />
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
