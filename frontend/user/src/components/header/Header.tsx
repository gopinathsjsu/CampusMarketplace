import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from "../button";
import { useUser } from "../../context/userDTO.tsx";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleHomepageClick = () => {
    navigate('/');
  };

  const handleSignInClick = () => {
    navigate('/sign-in');
  };

  const handleProfileClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('authToken');
    } catch {
      // ignore storage errors
    }
    setUser(null);
    setIsMenuOpen(false);
    navigate('/sign-in');
  };

  // Hide sign in button on sign in and sign up pages
  const isAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';

  return (
    <header className="flex justify-between items-center px-6 py-0 bg-white">
      <div className="flex items-center">
        <img
          src="/assets/full-logo.svg"
          alt="Campus Marketplace"
          className="h-10 w-auto cursor-pointer"
          onClick={handleHomepageClick}
        />
      </div>
      <div className="flex items-center space-x-4 relative">
        {!isAuthPage && (
          user ? (
            <div className="relative">
              <img
                src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName || 'User')}&background=random`}
                alt={user.displayName || user.userName}
                className="h-10 w-10 rounded-full cursor-pointer object-cover border border-gray-200"
                onClick={handleProfileClick}
              />
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button text="Sign In" rounded={true} onClick={handleSignInClick} />
          )
        )}
      </div>
    </header>
  );
}