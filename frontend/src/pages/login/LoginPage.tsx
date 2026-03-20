import { useState } from "react";
import { callLoginAPI } from "../../api/loginApi";
import "./styles/loginStyles.css";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleBack = async () => {
    navigate("/");
  };


  const handleLogin = async () => {
    try {
      const res = await callLoginAPI(username, password);

      if (res.success) {
        localStorage.setItem("bb-user", JSON.stringify(res.user));
        setMessage("Welcome back! 🦫");
        navigate("/tournaments");
      } else {
        setMessage("Invalid credentials");
      }
    } catch {
      setMessage("Server error");
    }
  };

  return (
    <div className="login-page">
      <button className="back-button" onClick={handleBack}>Back</button>
      <div className="login-card">
        <h1 className="login-title">Login</h1>

        <input
          className="login-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-button" onClick={handleLogin}>
          Login
        </button>

        <p className="signup-link">Don't have a account? <a href="/signup">Sign up!</a></p>

        <p className="login-message">{message}</p>
      </div>
    </div>
  );
}

export default LoginPage;