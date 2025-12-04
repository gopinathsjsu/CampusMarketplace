import { Navigate } from 'react-router-dom';
import { useUser } from '../context/userDTO';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
