import { useState } from 'react';
import Modal from '../modal';
import Button from '../button';
import Input from '../input';
import { uploadFile, FileUploadError } from '../../services/file.ts';
import MapPicker from '../map/MapPicker.tsx';
import { productService, ProductApiError } from '../../services/products.ts';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateListingModal({ isOpen, onClose }: CreateListingModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const categories = [
    'Vehicles',
    'Property Rentals',
    'Apparel',
    'Classifieds',
    'Electronics',
    'Entertainment',
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setError(null);
      setUploading(true);

      try {
        const response = await uploadFile(file, 'listings');
        setImageUrl(response.data.file.url);
      } catch (err) {
        const message = err instanceof FileUploadError ? err.message : 'Failed to upload image';
        setError(message);
        setImage(null);
        setImageUrl(null);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
      setTitleError('Title is required and must be less than 100 characters');
      return;
    }
    setTitleError(null);

    // TODO: Implement actual submission logic
    (async () => {
      try {
        if (!image) {
          setError('Please upload at least one image');
          return;
        }
        if (!location) {
          setError('Location is required');
          return;
        }
        setError(null);

        // Map UI category to backend categories
        const categoryMap: Record<string, string> = {
          Apparel: 'clothing',
          Electronics: 'electronics',
          Vehicles: 'other',
          'Property Rentals': 'other',
          Classifieds: 'other',
          Entertainment: 'other',
        };
        const mappedCategory = categoryMap[category] || 'other';

        const locString = `${location.lat},${location.lng}`;
        const numericPrice = parseFloat(price || '0');

        await productService.create({
          title: trimmedTitle,
          description,
          price: numericPrice,
          category: mappedCategory,
          condition: 'good',
          location: locString,
          tags,
          images: [image],
        });

        onClose();
      } catch (err) {
        const message =
          err instanceof ProductApiError
            ? err.message
            : 'Failed to create listing. Please try again.';
        setError(message);
      }
    })();
  };

  const addTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    if (tags.includes(next)) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, next]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} backgroundColor="#FFFFFF">
      <div className="flex flex-col text-left">
        <h2 className="text-3xl font-bold mb-6">Create Listing</h2>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-left">Image</label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-3xl h-40 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 overflow-hidden relative"
            onClick={() => !uploading && document.getElementById('image-upload')?.click()}
          >
            {uploading ? (
              <span className="text-gray-500">Uploading...</span>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl text-gray-400">+</span>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-left">Title</label>
          <Input
            type="text"
            placeholder=""
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            width="100%"
            size="base"
          />
          {titleError && <p className="text-red-500 text-sm mt-1">{titleError}</p>}
        </div>

        {/* Categories */}
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-left">Categories</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-6 py-3 text-base rounded-full border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-left">Price</label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-700 text-base">
              $
            </span>
            <Input
              type="number"
              placeholder=""
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              width="100%"
              size="base"
              className="pl-10"
            />
          </div>
        </div>

        {/* Tags (press Enter to add) */}
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-left">Tags</label>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Type a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              width="100%"
              size="base"
            />
            <Button text="Add" size="base" rounded={true} onClick={addTag} type="button" />
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center space-x-2 bg-gray-100 text-gray-800 text-sm rounded-full px-3 py-1"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-left">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder=""
            className="w-full px-6 py-3 text-base rounded-3xl border-2 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        {/* Location */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2 text-left">Location</label>
          <div className="border-2 border-gray-200 rounded-3xl h-48 bg-gray-100 overflow-hidden">
            <MapPicker onChange={(coords) => setLocation(coords)} className="w-full h-full" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button text="Submit" size="lg" rounded={true} onClick={handleSubmit} />
        </div>
      </div>
    </Modal>
  );
}
