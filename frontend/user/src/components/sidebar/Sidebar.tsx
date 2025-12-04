import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faMagnifyingGlass,
  faShirt,
  faLaptop,
  faBook, // Icon for Textbooks
  faCouch, // Icon for Furniture
  faBaseballBall, // Icon for Sports
  faPencilAlt, // Icon for Supplies
  faEllipsisH // Icon for Other
} from '@fortawesome/free-solid-svg-icons';
import Input from '../input/Input.tsx';
import Button from '../button/Button.tsx';

interface SidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCategorySelect: (category: string) => void;
  onConditionSelect: (condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | '') => void;
}

const categoryMap: { [key: string]: string } = {
  // Frontend Display Name -> Backend Enum Value (from backend/server/src/models/Product.ts)
  'Apparel': 'clothing',
  'Electronics': 'electronics',
  'Textbooks': 'textbooks',
  'Furniture': 'furniture',
  'Sports': 'sports',
  'Supplies': 'supplies',
  'Other': 'other', // Explicitly mapping 'Other' to 'other' backend enum
};

export default function Sidebar({ search, onSearchChange, onCategorySelect, onConditionSelect }: SidebarProps) {
  const handleCategoryClick = (displayName: string) => {
    const backendCategory = categoryMap[displayName];
    if (backendCategory) {
      onCategorySelect(backendCategory);
    } else {
      // If a display name doesn't have a direct backend mapping,
      // it means it should default to 'other' or a cleared state.
      // For now, clearing is appropriate.
      onCategorySelect('');
    }
  };

  return (
    <div className="w-100 bg-white shadow-lg p-10 space-y-6 overflow-y-auto max-h-screen">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search"
          rounded
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          size={'lg'}
          className="w-full"
        />
      </div>

      {/* Selling/Buying Toggle */}
      <div className="px-4">
        <Button
          text="Selling"
          rounded
          fullWidth
          size="lg"
          rightIcon={<FontAwesomeIcon icon={faChevronRight} />}
        />
      </div>


      {/* Divider */}
      <hr className="border-gray-200" />

       {/* Location Filter */}
       <div className="text-left">
         <h3 className="text-lg font-bold text-gray-800 mb-2">Location</h3>
         <div className="text-blue-600 font-medium cursor-pointer">
           San Jose, California · Within 40 mi
         </div>
       </div>
 
       {/* Divider */}
       <hr className="border-gray-200" />

      {/* Condition Filter */}
      <div className="text-left">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Condition</h3>
        <ul className="space-y-3">
          {['new', 'like-new', 'good', 'fair', 'poor'].map((conditionOption) => (
            <li
              key={conditionOption}
              className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600"
              onClick={() => onConditionSelect(conditionOption as 'new' | 'like-new' | 'good' | 'fair' | 'poor')}
            >
              <span>{conditionOption.charAt(0).toUpperCase() + conditionOption.slice(1)}</span>
            </li>
          ))}
        </ul>
        <div className="px-4 mt-6">
          <Button
            text="Clear Condition Filter"
            rounded
            fullWidth
            size="md"
            onClick={() => onConditionSelect('')}
          />
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-200" />
 
       {/* Categories */}
       <div className="text-left">
         <h3 className="text-lg font-bold text-gray-800 mb-3">Categories</h3>
         <ul className="space-y-3">
           <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleCategoryClick('Apparel')}>
             <FontAwesomeIcon icon={faShirt} className="w-5 h-5" />
             <span>Apparel</span>
           </li>
           <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleCategoryClick('Electronics')}>
             <FontAwesomeIcon icon={faLaptop} className="w-5 h-5" />
             <span>Electronics</span>
           </li>
           {/* New categories matching backend enums with appropriate icons */}
           <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleCategoryClick('Textbooks')}>
             <FontAwesomeIcon icon={faBook} className="w-5 h-5" />
             <span>Textbooks</span>
           </li>
           <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleCategoryClick('Furniture')}>
             <FontAwesomeIcon icon={faCouch} className="w-5 h-5" />
             <span>Furniture</span>
           </li>
           <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleCategoryClick('Sports')}>
             <FontAwesomeIcon icon={faBaseballBall} className="w-5 h-5" />
             <span>Sports</span>
           </li>
           <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleCategoryClick('Supplies')}>
             <FontAwesomeIcon icon={faPencilAlt} className="w-5 h-5" />
             <span>Supplies</span>
           </li>
           <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleCategoryClick('Other')}>
             <FontAwesomeIcon icon={faEllipsisH} className="w-5 h-5" />
             <span>Other</span>
           </li>
         </ul>
         <div className="px-4 mt-6">
           <Button
             text="Clear Category Filter"
             rounded
             fullWidth
             size="md"
             onClick={() => onCategorySelect('')}
           />
         </div>
       </div>
     </div>
   );
 }

