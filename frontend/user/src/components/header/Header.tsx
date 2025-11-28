import { useNavigate, useLocation } from 'react-router-dom';
import Button from "../button";
import { useUser } from "../../context/userDTO.tsx";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const handleHomepageClick = () => {
    navigate('/');
  };

  const handleSignInClick = () => {
    navigate('/sign-in');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Hide sign in button on sign in and sign up pages
  const isAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';

  return (
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
        {!isAuthPage && (
          user ? (
            <div className="flex items-center space-x-6">
              <img
                src="/assets/icons/notification.svg"
                alt="Notifications"
                className="h-7 w-7 cursor-pointer"
              />
              <img
                src="/assets/icons/inbox.svg"
                alt="Inbox"
                className="h-7 w-7 cursor-pointer"
              />
              <img
                src="/assets/icons/create-listing.svg"
                alt="Create listing"
                className="h-7 w-7 cursor-pointer"
              />
              <img
                src={user.profilePicture}
                alt={user.displayName}
                className="h-15 w-15 rounded-full cursor-pointer object-cover"
                onClick={handleProfileClick}
              />
            </div>
          ) : (
            <Button text="Sign In" rounded={true} onClick={handleSignInClick} />
          )
        )}
      </div>
    </header>
  );
}