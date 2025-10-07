import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/user';

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useUser();
  const hasStoredUser = typeof window !== 'undefined' && !!localStorage.getItem('user');

  if (!user && !hasStoredUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}


