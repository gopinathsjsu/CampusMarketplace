import { createContext, useContext, useMemo, useState, type ReactNode, useEffect, useCallback } from 'react';

export type User = {
  userName: string;
  displayName: string;
  profilePicture: string;
  schoolName: string;
  sellerRating: number;
  buyerRating: number;
};

export type UserContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const STORAGE_KEY = 'user';

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        setUserState(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
    try {
      if (next) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo(() => ({ user, setUser }), [user, setUser]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}
