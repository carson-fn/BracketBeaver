import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { callLoginAPI } from "../../api/loginApi.ts";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await callLoginAPI(username, password);

      if (res.success) {
        localStorage.setItem("bb-user", JSON.stringify(res.user));
        setMessage("Login successful");
        navigate("/tournaments");
      } else {
        setMessage("Invalid credentials");
      }
    } catch {
      setMessage("Server error");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Login</h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>Login</button>

      <p>{message}</p>
    </div>
  );
}

export default LoginPage;