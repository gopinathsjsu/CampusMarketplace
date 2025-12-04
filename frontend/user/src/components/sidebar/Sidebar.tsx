import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronRight, 
  faMagnifyingGlass,
  faCar,
  faBuilding,
  faShirt,
  faTag,
  faLaptop,
  faFilm
} from '@fortawesome/free-solid-svg-icons';
import Input from '../input/Input.tsx';
import Button from '../button/Button.tsx';

interface SidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sellingMode: boolean;
  onSellingToggle: () => void;
}

export default function Sidebar({ search, onSearchChange, sellingMode, onSellingToggle }: SidebarProps) {
  return (
    <div className="w-90 bg-white p-10 space-y-6">
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
          rightIcon={<FontAwesomeIcon icon={faChevronRight} className={`transition-transform ${sellingMode ? 'rotate-90' : ''}`} />}
          onClick={onSellingToggle}
          variant={sellingMode ? 'primary' : 'primary'}
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

      {/* Categories */}
      <div className="text-left">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Categories</h3>
        <ul className="space-y-3">
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <FontAwesomeIcon icon={faCar} className="w-5 h-5" />
            <span>Vehicles</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <FontAwesomeIcon icon={faBuilding} className="w-5 h-5" />
            <span>Property Rentals</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <FontAwesomeIcon icon={faShirt} className="w-5 h-5" />
            <span>Apparel</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <FontAwesomeIcon icon={faTag} className="w-5 h-5" />
            <span>Classifieds</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <FontAwesomeIcon icon={faLaptop} className="w-5 h-5" />
            <span>Electronics</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <FontAwesomeIcon icon={faFilm} className="w-5 h-5" />
            <span>Entertainment</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

