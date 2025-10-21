import { useNavigate, useLocation } from 'react-router-dom';
import Button from "../button";
import { useUser } from "../../context/user.tsx";

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
    <header className="flex justify-between items-center px-6 py-0 bg-white">
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
            <img
              src={user.profilePicture}
              alt={user.displayName}
              className="h-15 w-15 rounded-full cursor-pointer object-cover"
              onClick={handleProfileClick}
            />
          ) : (
            <Button text="Sign In" rounded={true} onClick={handleSignInClick} />
          )
        )}
      </div>
    </header>
  );
}