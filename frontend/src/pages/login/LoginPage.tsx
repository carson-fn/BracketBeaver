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
      console.log("LOGIN: Attempting with username:", username);
      const res = await callLoginAPI(username, password);
      
      console.log("LOGIN: Response from server:", res);
      console.log("LOGIN: res.success =", res.success);

      if (res.success) {
        console.log("LOGIN: Success! User object:", res.user);
        // Store user FIRST before redirecting
        localStorage.setItem("bb-user", JSON.stringify(res.user));
        console.log("LOGIN: Stored in localStorage:", localStorage.getItem("bb-user"));
        setMessage("Welcome back! 🦫");
        
        // Then redirect based on role
        if (res.user.role === "admin") {
          console.log("LOGIN: Redirecting to /admin");
          window.location.href = "/admin";
        } else if (res.user.role === "organizer") {
          console.log("LOGIN: Redirecting to /organizer");
          window.location.href = "/organizer";
        } else {
          console.log("LOGIN: Navigating to /tournaments");
          navigate("/tournaments");
        }
      } else {
        console.log("LOGIN: Failed - res.success is false");
        setMessage("Invalid credentials");
      }
    } catch (error) {
      console.error("LOGIN: Caught error:", error);
      setMessage("Server error");
    }
  };

  return (
    <div className="login-page">
      <button className="back-button" onClick={handleBack}>
        Back
      </button>
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

        <p>
          Don't have a account? <a href="/signup">Sign up!</a>
        </p>

        <p className="login-message">{message}</p>
      </div>
    </div>
  );
}

export default LoginPage;
