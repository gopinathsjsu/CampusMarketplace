import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from "../../components/button";
import Input from "../../components/input";
import Modal from "../../components/modal";
import { authService, ApiError } from "../../services/auth.ts";

export default function SignUp() {
  const [userName, setUserName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (!email || !userName || !schoolName || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await authService.signUp({
        email,
        userName,
        password,
        schoolName,
      });

      navigate('/sign-in');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to register';
      alert(message);
    }
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
          <h1 className="text-3xl font-bold text-center" style={{ color: "#1F55A2" }}>Sign Up</h1>

          <div className="space-y-4">
            <Input
              placeholder="Username"
              width="350px"
              border={false}
              size={"lg"}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <Input
              placeholder="School"
              width="350px"
              border={false}
              size={"lg"}
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
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
            <Input
              placeholder="Confirm Password"
              type="password"
              width="350px"
              border={false}
              size={"lg"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="space-y-3">

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
