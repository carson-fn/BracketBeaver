import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/login/LoginPage";
import TournamentPage from "./pages/tournaments/TournamentPage";
import "./global-styles/App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tournaments" element={<TournamentPage />} />
      </Routes>
    </Router>
  );
}

export default App;