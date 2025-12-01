import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import Header from "./components/header/Header.tsx"
import SignIn from "./pages/signIn/SignIn.tsx";
import SignUp from "./pages/signUp/SignUp.tsx";
import Profile from "./pages/profile";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useUser } from "./context/userDTO.tsx";

function App() {
  const { user } = useUser();

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/profile" replace /> : <Navigate to="/sign-in" replace />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
