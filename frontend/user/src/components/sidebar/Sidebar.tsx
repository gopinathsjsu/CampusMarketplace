import Input from '../input/Input.tsx';

interface SidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function Sidebar({ search, onSearchChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white shadow-lg p-6 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <Input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Selling/Buying Toggle */}
      <div className="bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-between cursor-pointer">
        <span>Selling</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Location Filter */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Location</h3>
        <div className="space-y-2">
          <div className="text-blue-600 font-medium cursor-pointer">San Jose, California</div>
          <div className="text-gray-600 text-sm">Within 40 mi</div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Categories</h3>
        <ul className="space-y-3">
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10v11h18V10M3 10l9-6 9 6M3 10l9 6 9-6" />
            </svg>
            <span>Vehicles</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
            </svg>
            <span>Property Rentals</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Apparel</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10" />
            </svg>
            <span>Classifieds</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Electronics</span>
          </li>
          <li className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10H4a2 2 0 00-2 2v2a2 2 0 002 2h10v-2a2 2 0 00-2-2zM20 7v3h-4V7a2 2 0 012-2h0a2 2 0 012 2z" />
            </svg>
            <span>Entertainment</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

