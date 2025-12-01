import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from "../../components/button";
import Input from "../../components/input";
import Modal from "../../components/modal";
import { useUser } from "../../context/userDTO.tsx";
import { authService, ApiError } from "../../services/auth.ts";
import Notification from "../../components/notification";

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { setUser } = useUser();
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setNotification({ show: true, message: state.message, type: 'success' });
    }
  }, [location.state]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setNotification({ show: true, message: 'Please enter both email and password', type: 'error' });
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
      let message = 'Failed to sign in';

      if (err instanceof ApiError) {
        if (err.status === 401) {
          message = 'Invalid email or password';
        } else if (err.message) {
          message = err.message;
        }
      }

      setNotification({ show: true, message, type: 'error' });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSignIn();
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                type="submit"
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
        </form>
      </Modal>
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.show}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
