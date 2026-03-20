import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { callHelloAPI } from "../../api/helloApi";
import "./styles/landingStyles.css";
import testImage from "./imgs/test.jpg";

function LandingPage() {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleGuest = async () => {
    setMessage(await callHelloAPI());
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleGemini = () => {
    navigate("/llm-demo");
  };

  return (
    <div className="landing-page">
      <div className="photo-1"><img src={testImage} alt="test" /></div>
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

        <button className="landing-button" onClick={handleGemini}>
          Try Gemini
        </button>



        <p className="landing-message">{message}</p>
      </div>
      <div className="photo-2"><img src={testImage} alt="test" /></div>
      <div className="photo-3"><img src={testImage} alt="test" /></div>
      <div className="photo-4"><img src={testImage} alt="test" /></div>
      <div className="photo-5"><img src={testImage} alt="test" /></div>
    </div>
  );
}

export default LandingPage;
