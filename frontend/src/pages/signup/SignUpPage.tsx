import React, { useState } from "react";
import "./styles/signupStyles.css";
import { useNavigate } from "react-router-dom";
import { callSignupAPI } from "../../api/signupApi";

function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

    const handleBack = async () => {
        navigate("/login");
    };

    const handleSignUp = async () => {
        try{
            const res = await callSignupAPI(username, password);

            if (res.success) {
            setMessage("Account created! 🦫");
            setTimeout(() => navigate("/login"), 1000);
            } else {
            setMessage("Username already exists");
            }
        }
        catch {
            setMessage("Server Error");
        }
    };

  return (
    <div className="signup-page">
      <button className="back-button" onClick={handleBack}>Back</button>
      <div className="signup-card">
        <h1>Sign Up</h1>

        <input
          className="signup-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="signup-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="signup-button" onClick={handleSignUp} >Create Account</button>
        <p className="signup-message">{message}</p>
      </div>
    </div>
  );
}

export default SignUpPage;