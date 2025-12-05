import { useEffect, useMemo, useState } from 'react';
import Modal from '../modal';
import MapPicker from '../map/MapPicker';
import Button from '../button';
import Notification from '../notification/Notification';
import { productService, type ProductData, type ProductSellerInfo } from '../../services/products';
import { chatService } from '../../services/chat';
import { useUser } from '../../context/userDTO';
import { API } from '../../routes/api';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

interface ListingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

// Helper to extract seller ID from sellerId field (can be string or object)
function getSellerId(sellerId: ProductSellerInfo | string): string {
  if (typeof sellerId === 'string') return sellerId;
  return sellerId._id;
}

export default function ListingDetailsModal({
  isOpen,
  onClose,
  listingId,
}: ListingDetailsModalProps) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!isOpen || !listingId) return;
    let mounted = true;
    // Reset states when modal opens
    setPurchaseSuccess(false);
    setError(null);
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await productService.getById(listingId);
        if (!mounted) return;
        setProduct(res.data.product);
        // Set pre-written message
        setChatMessage(
          `Hi! I'm interested in your ${res.data.product.title}. Is it still available?`,
        );
      } catch (e: any) {
        if (!mounted) return;
        console.error('Failed to load product:', e, 'ListingId:', listingId);
        setError(e?.message || 'Failed to load product');
        setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, listingId]);

  // Determine if current user can purchase this listing
  const canPurchase = useMemo(() => {
    if (!user || !product) return false;
    if (product.status !== 'available') return false;
    const sellerId = getSellerId(product.sellerId);
    return user._id !== sellerId;
  }, [user, product]);

  const handlePurchase = async () => {
    if (!product || purchasing) return;
    try {
      setPurchasing(true);
      setError(null);
      await productService.purchase(product._id);
      setPurchaseSuccess(true);
      // Update local product state to reflect the purchase
      setProduct((prev) => (prev ? { ...prev, status: 'sold' } : null));
    } catch (e: any) {
      setError(e?.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handleOpenReportModal = () => {
    if (!user) {
      setNotification({ message: 'Please sign in to report listings', type: 'error' });
      return;
    }
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportReason('');
  };

  const handleSubmitReport = async () => {
    if (!product || isReporting || !reportReason.trim()) return;

    setIsReporting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setNotification({ message: 'Please sign in to report listings', type: 'error' });
        return;
      }

      const response = await fetch(API.products.report(product._id), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to report product');
      }

      setNotification({ message: 'Product reported to admin successfully', type: 'success' });
      handleCloseReportModal();
    } catch (error) {
      console.error('Error reporting product:', error);
      setNotification({ message: 'Failed to report product. Please try again.', type: 'error' });
    } finally {
      setIsReporting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!product || !chatMessage.trim() || sendingMessage) return;
    if (!user) {
      setNotification({ message: 'Please sign in to send messages', type: 'error' });
      return;
    }

    const sellerId = getSellerId(product.sellerId);

    if (user._id === sellerId) {
      setNotification({ message: 'You cannot message yourself', type: 'error' });
      return;
    }

    setSendingMessage(true);
    try {
      // Create or get existing chat
      const chatResponse = await chatService.createChat({
        productId: product._id,
        sellerId: sellerId,
      });

      // Send the message
      await chatService.sendMessage(chatResponse.data.chat._id, {
        content: chatMessage.trim(),
      });

      setNotification({ message: 'Message sent successfully!', type: 'success' });

      // Close modal and navigate to chat
      setTimeout(() => {
        onClose();
        navigate(`/chat?chatId=${chatResponse.data.chat._id}`);
      }, 1000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setNotification({ message: error.message || 'Failed to send message', type: 'error' });
    } finally {
      setSendingMessage(false);
    }
  };

  const coords = useMemo(() => {
    if (!product || product.latitude == null || product.longitude == null) return null;
    return { lat: product.latitude, lng: product.longitude };
  }, [product?.latitude, product?.longitude]);

  const title = product?.title ?? 'Listing';
  const description = product?.description ?? '';
  const price = product?.price ?? 0;
  const image = product?.images?.[0] ?? '';
  const tags =
    product?.tags && product.tags.length > 0
      ? product.tags
      : product?.category
        ? [product.category]
        : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} mask={true} backgroundColor="#EFF1F5" width="75vw">
      <div className="w-full">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-6">{title}</h2>

        {error && <div className="text-red-600 text-center mb-4">{error}</div>}

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Left column: image + description */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl overflow-hidden bg-gray-100">
              {image ? (
                <img src={image} alt={title} className="w-full h-[34vh] object-cover" />
              ) : (
                <div className="w-full h-[34vh] bg-gray-200 flex items-center justify-center text-gray-500">
                  No image
                </div>
              )}
            </div>
            <div className="text-gray-400 leading-relaxed text-left text-sm break-words whitespace-pre-wrap">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              ) : (
                description
              )}
            </div>
          </div>

          {/* Right column: smaller, non-interactive map + price and tags */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl overflow-hidden bg-gray-100 h-[220px] w-0=[300px]">
              {coords ? (
                <MapPicker className="w-full h-full pointer-events-none" value={coords} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Location: {product?.location || 'Unavailable'}
                </div>
              )}
            </div>
            <div>
              <div className="text-4xl font-extrabold text-gray-900 mb-3 text-left">
                $
                {price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-800 text-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          {/* Order Button - only shown for non-owner users */}
          {canPurchase && !purchaseSuccess && (
            <div className="mt-4">
              <Button
                text={purchasing ? 'Processing...' : 'Order Now'}
                color="#E5A924"
                size="lg"
                fullWidth
                onClick={handlePurchase}
                disabled={purchasing}
              />
            </div>
          )}

          {/* Purchase Success Message */}
          {purchaseSuccess && (
            <div className="w-full mt-4 py-3 px-6 text-green-800 font-semibold text-center rounded-2xl">
              ✓ Purchase Successful!
            </div>
          )}

          {/* Sold indicator for unavailable products */}
          {product?.status === 'sold' && !purchaseSuccess && (
            <div className="w-full mt-4 py-3 px-6  text-gray-500 font-semibold text-center rounded-2xl">
              This item has been sold
            </div>
          )}
        </div>

        {/* Chat with Seller Section */}
        {user && product && user._id !== getSellerId(product.sellerId) && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Seller</h3>
            <div className="relative">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full border-2 bg-white  border-gray-300 rounded-3xl px-4 py-4 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                disabled={sendingMessage}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || sendingMessage}
                className="absolute right-3 bottom-3 w-10 h-10 bg-[#1F55A2] hover:bg-[#174080] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faPaperPlane} className={sendingMessage ? 'animate-pulse' : ''} />
              </button>
            </div>
          </div>
        )}

        {/* Report button - subtle and at the bottom, hidden for admins */}
        {user?.role !== 'admin' && (
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center">
            <button
              onClick={handleOpenReportModal}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              Report to Admin
            </button>
          </div>
        )}

        {/* Report Modal */}
        <Modal isOpen={showReportModal} onClose={handleCloseReportModal} mask={true} width="30vw">
          <div className="w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Report Listing</h3>
            <p className="text-gray-600 text-sm mb-4">
              Please provide a reason for reporting this listing. Our admin team will review your report.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter your reason for reporting this listing..."
              className="w-full border-2 border-gray-300 rounded-3xl bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
              disabled={isReporting}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                text="Cancel"
                onClick={handleCloseReportModal}
                disabled={isReporting}
                color="#6B7280"
                size="base"
              />
              <Button
                text={isReporting ? 'Submitting...' : 'Submit Report'}
                onClick={handleSubmitReport}
                disabled={isReporting || !reportReason.trim()}
                color="#DC2626"
                size="base"
              />
            </div>
          </div>
        </Modal>

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            isVisible={!!notification}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </Modal>
  );
}
