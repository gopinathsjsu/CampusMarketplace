import { useState } from 'react';
import Modal from '../../modal';
import Button from '../../button';
import Input from '../../input';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateListingModal({ isOpen, onClose }: CreateListingModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [category, setCategory] = useState('Apparel');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const categories = [
    'Vehicles',
    'Property Rentals',
    'Apparel',
    'Classifieds',
    'Electronics',
    'Entertainment'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    // TODO: Implement actual submission logic
    console.log({
      image,
      category,
      price,
      description
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} backgroundColor="#FFFFFF" width="600px">
      <div className="flex flex-col text-left">
        <h2 className="text-3xl font-bold mb-6">Create Listing</h2>
        
        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-left">Image</label>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-3xl h-40 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            {image ? (
              <span className="text-gray-700">{image.name}</span>
            ) : (
              <span className="text-6xl text-gray-400">+</span>
            )}
          </div>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
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
            <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-700 text-base">$</span>
            <Input
              type="number"
              placeholder=""
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              width="100%"
              size="base"
            />
          </div>
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
            {/* Placeholder for map - could integrate Google Maps or similar */}
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Map placeholder
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            text="Submit"
            size="lg"
            rounded={true}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </Modal>
  );
}

