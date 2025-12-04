import React, { useState, useEffect } from 'react';
import type { UserData, ListingData } from '../../types';
import { API } from '../../routes/api.ts';
import ListingDetailsModal from './ListingDetailsModal';

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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsDetailsOpen(true);
    }
  };

  return (
    <div
      className="cursor-pointer w-[30vw] h-[35vh] mb-10"
      onClick={() => setIsDetailsOpen(true)}
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

      <div className="bg-gray-100 px-8 pt-8 pb-4 rounded-b-3xl -translate-y-4">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-gray-900">${data.price.toFixed(2)}</div>

          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : (
              <img
                src={userData?.profilePicture}
                alt={userData?.displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover shadow-sm"
              />
            )}
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
          </div>
        </div>
      </div>
      <ListingDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        listingId={data.listingId}
      />
    </div>
  );
}
