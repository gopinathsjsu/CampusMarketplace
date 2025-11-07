import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import Header from "./components/header/Header.tsx"
import SignIn from "./pages/signIn/SignIn.tsx";
import SignUp from "./pages/signUp/SignUp.tsx";
import Profile from "./pages/profile";
import Chats from "./pages/chats";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={""} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/chats/:chatId" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
