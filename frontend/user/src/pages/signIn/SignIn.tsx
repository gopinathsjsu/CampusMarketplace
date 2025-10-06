import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from "../../components/button";
import Input from "../../components/input";
import Modal from "../../components/modal";
import { useUser } from "../../context/user.tsx";
import type { User } from "../../context/user.tsx";

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { setUser } = useUser();

  const handleSignIn = () => {
    if (username && password) {
      console.log('Sign in with:', { username, password });
      // TODO: Add API call to backend for authentication
      const user: User = {
        userName: username,
        displayName: 'Seth McCarthy',
        profilePicture: 'https://i.imgur.com/tddLRGt.jpeg',
        schoolName: 'San Jose State University',
        sellerRating: 5,
        buyerRating: 4,
      };
      setUser(user);
      navigate('/');
    } else {
      alert('Please enter both username and password');
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
              placeholder="Username"
              width="350px"
              border={false}
              size={"lg"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
