import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/userDTO.tsx';

type ProtectedRouteProps = {
  children: ReactNode;
  allowAdmin?: boolean;
};

export default function ProtectedRoute({ children, allowAdmin = false }: ProtectedRouteProps) {
  const { user } = useUser();
  const hasStoredUser = typeof window !== 'undefined' && !!localStorage.getItem('user');

  if (!user && !hasStoredUser) {
    return <Navigate to="/sign-in" replace />;
  }

  // Redirect admin users to admin dashboard - they cannot access regular user routes
  if (user?.role === 'admin' && !allowAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
