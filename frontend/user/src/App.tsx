import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/header/Header.tsx';
import SignIn from './pages/signIn/SignIn.tsx';
import SignUp from './pages/signUp/SignUp.tsx';
import Home from './pages/home/Home.tsx'; // Import Home component
import Profile from './pages/profile';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
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
