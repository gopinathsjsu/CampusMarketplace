import Listing from '../../components/listing';
import type { ListingData } from '../../types';
import editIcon from '../../../assets/icons/edit.svg';
import { useUser } from '../../context/userDTO.tsx';
import { useEffect, useState } from 'react';
import Modal from '../../components/modal';
import Input from '../../components/input';
import Button from '../../components/button';
import { authService } from '../../services/auth.ts';

const purchasesListings: ListingData[] = [];

function Profile() {
  const { user } = useUser();
  const { setUser } = useUser();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userName, setUserName] = useState(user?.userName || '');

  useEffect(() => {
    setUserName(user?.displayName || user?.userName || '');
  }, [user]);

  const handleConfirm = async () => {
    if (!user) {
      setIsEditOpen(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      const res = await authService.updateProfile(token, { userName });
      const { user: updatedUser } = res.data;
      setUser(updatedUser);
    }
    setIsEditOpen(false);
  };

  const avatarSrc = user?.profilePicture || '/favicon.ico';
  const displayName = user?.displayName || user?.userName || 'User';
  return (
    <div className="px-8 py-6 bg-white">
      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col items-center justify-start mt-8 lg:sticky lg:top-1/2 lg:-translate-y-1/2 self-start">
          <div className="w-[320px] h-[320px] rounded-full overflow-hidden">
            <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="mt-6 flex items-center space-x-3">
            <h1 className="text-4xl font-extrabold text-gray-900">{displayName}</h1>
            <button type="button" aria-label="Edit profile" onClick={() => setIsEditOpen(true)}>
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

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        backgroundColor="#F6F7FA"
        width="640px"
      >
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 self-start">Edit Profile</h2>
          <div className="w-40 h-40 rounded-full overflow-hidden mb-6">
            <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="w-full mb-8">
            <div className={'flex justify-start px-2'}>
              <label className="block text-gray-900 font-semibold">Username</label>
            </div>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              width="100%"
              size="base"
            />
          </div>
          <div className="w-full flex justify-center">
            <Button text="Confirm" size="lg" rounded onClick={handleConfirm} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Profile;
