import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../button';
import UserMenu from '../userMenu/UserMenu.tsx';
import { useUser } from '../../context/userDTO.tsx';
import CreateListingModal from '../listing/CreateListingModal.tsx';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleHomepageClick = () => {
    navigate('/');
  };

  const handleSignInClick = () => {
    navigate('/sign-in');
  };

  const handleMenuOpen = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('authToken');
    } catch {
      // ignore storage errors
    }
    setUser(null);
    navigate('/sign-in');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  // Hide sign in button on sign in and sign up pages
  const isAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';

  return (
    <>
      <header className="flex justify-between items-center px-12 py-4 bg-white">
        <div className="flex items-center">
          <img
            src="/assets/full-logo.svg"
            alt="Campus Marketplace"
            className="h-10 w-auto cursor-pointer"
            onClick={handleHomepageClick}
          />
        </div>
        <div className="flex items-center space-x-4">
          {!isAuthPage &&
            (user ? (
              <div className="flex items-center space-x-6">
                {user.role === 'admin' && (
                  <Button
                    text="Admin Dashboard"
                    onClick={handleAdminClick}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  />
                )}
                <img
                  src="/assets/icons/notification.svg"
                  alt="Notifications"
                  className="h-7 w-7 cursor-pointer"
                />
                <img src="/assets/icons/inbox.svg" alt="Inbox" className="h-7 w-7 cursor-pointer" />
                <img
                  src="/assets/icons/create-listing.svg"
                  alt="Create listing"
                  className="h-7 w-7 cursor-pointer"
                  onClick={() => setIsCreateModalOpen(true)}
                />
                <div className="relative flex-shrink-0">
                  <img
                    src={user.profilePicture}
                    alt={user.displayName}
                    className="h-15 w-15 rounded-full cursor-pointer object-cover"
                    onClick={handleMenuOpen}
                  />
                  {isMenuOpen && (
                    <UserMenu onProfileClick={handleProfileClick} onSignOut={handleSignOut} />
                  )}
                </div>
              </div>
            ) : (
              <Button text="Sign In" rounded={true} onClick={handleSignInClick} />
            ))}
        </div>
      </header>
      <CreateListingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}
