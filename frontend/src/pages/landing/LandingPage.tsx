import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { callHelloAPI } from "../../api/helloApi";
import "./styles/landingStyles.css";
import testImage from "./imgs/test.jpg";

function LandingPage() {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleGuest = () => {
    localStorage.setItem(
      "bb-user",
      JSON.stringify({
        username: "Guest",
        role: "guest",
      })
    );
    navigate("/tournaments");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="landing-page">
      <div className="landing-card">
        <h1 className="landing-title">Bracket Beaver</h1>
        <h3 className="landing-subtitle">
          Your go-to tournament generator!
        </h3>

        <button className="landing-button" onClick={handleLogin}>
          Login
        </button>

        <button className="landing-button" onClick={handleGuest}>
          Continue as Guest
        </button>



        <p className="landing-message">{message}</p>
      </div>
    </div>
  );
}

export default LandingPage;
