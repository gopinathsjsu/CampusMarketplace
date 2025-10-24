import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from "../../components/button";
import Input from "../../components/input";
import Modal from "../../components/modal";
import { useUser } from "../../context/userDTO.tsx";
import { authService, ApiError } from "../../services/auth.ts";

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { setUser } = useUser();

  const handleSignIn = async () => {
    if (!email || !password) {
      alert('Please enter both username and password');
      return;
    }

    try {
      // Treat the username field as the email for login
      const res = await authService.signIn({ email, password });
      const { user, token } = res.data;

      // Persist token for subsequent authenticated requests
      try { localStorage.setItem('authToken', token); } catch {}

      setUser(user);
      navigate('/');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to sign in';
      alert(message);
    }
  };

  const handleSignUp = () => {
    navigate('/sign-up');
  };

  return (
    <div>
      <Modal
        isOpen={true}
        width={"500px"}
        mask={false}
        onClose={() => {
        }}
      >
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center" style={{ color: "#1F55A2" }}>Sign In</h1>

          <div className="space-y-4">
            <Input
              placeholder="Email"
              width="350px"
              border={false}
              size={"lg"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Password"
              type="password"
              width="350px"
              border={false}
              size={"lg"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="w-full">
              <Button
                text="Sign In"
                size={"lg"}
                onClick={handleSignIn}
              />
            </div>
            <div className="w-full">
              <Button
                text="Sign Up"
                size={"lg"}
                color="#E5A924"
                onClick={handleSignUp}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
