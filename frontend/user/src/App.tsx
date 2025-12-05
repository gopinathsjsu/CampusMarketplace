import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/header/Header.tsx';
import SignIn from './pages/signIn/SignIn.tsx';
import SignUp from './pages/signUp/SignUp.tsx';
import Home from './pages/home/Home.tsx'; // Import Home component
import Profile from './pages/profile';
import Chat from './pages/chat';
import ProtectedRoute from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import AdminDashboard from './pages/admin';
import { useUser } from './context/userDTO';

function HomeRoute() {
  const { user } = useUser();
  const hasStoredUser = typeof window !== 'undefined' && !!localStorage.getItem('user');

  if (!user && !hasStoredUser) {
    return <Navigate to="/sign-in" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Home />;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowAdmin={true}>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
