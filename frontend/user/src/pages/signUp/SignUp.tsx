import { useState } from 'react';
import Button from "../../components/button";
import Input from "../../components/input";
import Modal from "../../components/modal";

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    if (username && name && school && email && password && confirmPassword) {
      if (password === confirmPassword) {
        console.log('Sign up with:', { username, name, school, email, password });
        // TODO: Add API call to backend for user registration
      } else {
        alert('Passwords do not match');
      }
    } else {
      alert('Please fill in all fields');
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              placeholder="Name"
              width="350px"
              border={false}
              size={"lg"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="School"
              width="350px"
              border={false}
              size={"lg"}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
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
