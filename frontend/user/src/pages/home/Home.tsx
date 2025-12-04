import { useEffect, useState, useCallback } from 'react';
import { productService, type ProductData, type GetAllProductsParams, type ProductSellerInfo } from '../../services/products.ts';
import Listing from '../../components/listing/Listing.tsx';
import type { ListingData } from '../../types';
import Button from '../../components/button/Button.tsx';
import Sidebar from '../../components/sidebar/Sidebar.tsx';

// Helper to extract seller ID from ProductData
function getSellerId(sellerId: ProductSellerInfo | string): string {
  if (typeof sellerId === 'string') return sellerId;
  return sellerId._id;
}

export default function Home() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(''); 
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'new' | 'like-new' | 'good' | 'fair' | 'poor' | ''>('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // Number of items per page
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async (params: GetAllProductsParams, append: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getAll(params);
      setProducts((prevProducts) => (append ? [...prevProducts, ...response.data.products] : response.data.products));
      setHasMore(response.data.products.length === limit);
    } catch (err) {
      setError('Failed to fetch products. Please try again later.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    setPage(1); // Reset to first page on filter/search change
    fetchProducts({ search, category, condition: condition || undefined, minPrice: Number(minPrice) || undefined, maxPrice: Number(maxPrice) || undefined, page: 1, limit }, false);
  }, [search, category, condition, minPrice, maxPrice, limit, fetchProducts]);

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchProducts({ search, category, condition: condition || undefined, minPrice: Number(minPrice) || undefined, maxPrice: Number(maxPrice) || undefined, page, limit }, true);
    }
  }, [page, search, category, condition, minPrice, maxPrice, limit, fetchProducts]);


  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar search={search} onSearchChange={setSearch} />

      {/* Main Content Area */}
      <div className="flex-1 p-25 overflow-y-auto">
        {loading && products.length === 0 ? (
          <div className="text-center py-8">Loading products...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-6 auto-rows-max">
            {products.map((product) => (
              <Listing key={product._id} data={{
                listingId: product._id,
                userId: getSellerId(product.sellerId),
                description: product.description,
                timeCreated: new Date(product.createdAt),
                condition: product.condition,
                photos: product.images,
                location: product.location,
                price: product.price,
                sold: product.status === 'sold',
                quantity: 1,
                category: [product.category],
              } as ListingData} />
            ))}
          </div>
        )}

        {hasMore && !loading && products.length > 0 && (
          <div className="text-center py-8">
            <Button onClick={handleLoadMore} text="Load More" />
          </div>
        )}
      </div>
    </div>
  );
}