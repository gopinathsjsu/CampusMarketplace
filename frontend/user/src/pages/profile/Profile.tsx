import Listing from '../../components/listing';
import type { ListingData } from '../../types';
import editIcon from '../../../assets/icons/edit.svg';

const purchasesListings: ListingData[] = [
];

export default function Profile() {
  return (
    <div className="px-8 py-6">
      <div className="grid lg:grid-cols-2">

        <div className="flex flex-col items-center justify-start mt-8 lg:sticky lg:top-1/2 lg:-translate-y-1/2 self-start">
          <div className="w-[320px] h-[320px] rounded-full overflow-hidden">
            <img
              src=""
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-6 flex items-center space-x-3">
            <h1 className="text-4xl font-extrabold text-gray-900">Don Percival</h1>
            <button
              type="button"
              aria-label="Edit profile"
            >
              <img src={editIcon} alt="Edit" className="w-8 h-8 mb-1" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-start mt-8 lg:sticky lg:top-6 self-start">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Purchases History</h2>
          <div className="flex flex-col space-y-6 h-[calc(100vh-160px)] overflow-y-auto w-full">
            {purchasesListings.map((l) => (
              <div key={l.listingId} className="w-full flex justify-center">
                <Listing data={l} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


