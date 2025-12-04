import { useEffect, useMemo, useState } from 'react';
import Modal from '../modal';
import MapPicker from '../map/MapPicker';
import Button from '../button';
import { productService, type ProductData, type ProductSellerInfo } from '../../services/products';
import { useUser } from '../../context/userDTO';

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
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

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
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load listing');
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
      setProduct((prev) => prev ? { ...prev, status: 'sold' } : null);
    } catch (e: any) {
      setError(e?.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
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
  const tags = (product?.tags && product.tags.length > 0)
    ? product.tags
    : (product?.category ? [product.category] : []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} mask={true} backgroundColor="#EFF1F5" width="75vw">
      <div className="w-full">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-6">
          {title}
        </h2>

        {error && (
          <div className="text-red-600 text-center mb-4">{error}</div>
        )}

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
                ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      </div>
    </Modal>
  );
}


