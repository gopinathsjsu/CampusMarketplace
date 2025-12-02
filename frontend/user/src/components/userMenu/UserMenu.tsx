type UserMenuProps = {
  onProfileClick: () => void;
  onSignOut: () => void;
};

export default function UserMenu({ onProfileClick, onSignOut }: UserMenuProps) {
  return (
    <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
        onClick={onProfileClick}
      >
        Profile
      </button>
      <button
        type="button"
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
        onClick={onSignOut}
      >
        Sign Out
      </button>
    </div>
  );
}
