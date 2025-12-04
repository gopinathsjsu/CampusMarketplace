import React, { useState, useEffect } from 'react';
import type { UserData, ListingData } from '../../types';
import { API } from '../../routes/api.ts';
import ListingDetailsModal from './ListingDetailsModal';
import EditListingModal from './EditListingModal';
import { useUser } from '../../context/userDTO';

export interface ListingProps {
  data: ListingData;
}

async function getUser(userId: string): Promise<UserData | null> {
  try {
    if (!userId) return null;
    const res = await fetch(API.users.byId(userId));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    const u = data?.data?.user || {};
    const displayName: string = u.userName || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'User';
    const result: UserData = {
      userName: u.userName || displayName,
      displayName,
      profilePicture: u.profilePicture || '',
      schoolName: u.schoolName || '',
      sellerRating: u.sellerRating || 0,
      buyerRating: u.buyerRating || 0,
    };
    return result;
  } catch {
    return null;
  }
}

export default function Listing({ data }: ListingProps) {
  const { user } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Check if the current user owns this listing
  const isOwnListing = user && user._id === data.userId;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUser(data.userId);
        setUserData(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [data.userId]);

  const handleOpenModal = () => {
    if (isOwnListing) {
      setIsEditOpen(true);
    } else {
      setIsDetailsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenModal();
    }
  };

  return (
    <div
      className="cursor-pointer w-[30vw] h-[35vh] mb-10"
      onClick={handleOpenModal}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="relative z-10 h-[28vh]">
        <img
          src={data.photos[0]}
          alt={data.description}
          className="w-full h-full object-cover rounded-3xl"
        />
      </div>

      <div className="bg-gray-100 pl-4 pr-4 pt-8 pb-4 rounded-b-3xl -translate-y-4">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-gray-900">${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="font-bold text-gray-900 text-sm">
                {loading ? (
                  <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  userData?.displayName || 'Unknown User'
                )}
              </div>
              <div className="text-sm text-gray-600">{data.location}</div>
            </div>
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : (
              <img
                src={userData?.profilePicture}
                alt={userData?.displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover shadow-sm"
              />
            )}
          </div>
        </div>
      </div>
      {isOwnListing ? (
        <EditListingModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          listingId={data.listingId}
          onUpdated={() => window.location.reload()}
        />
      ) : (
        <ListingDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          listingId={data.listingId}
        />
      )}
    </div>
  );
}
