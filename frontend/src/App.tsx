import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/login/LoginPage";
import TournamentPage from "./pages/tournaments/TournamentPage";
import GeminiDemoPage from "./pages/geminiDemo/GeminiDemoPage";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import OrganizerDashboard from "./pages/dashboards/OrganizerDashboard";
import SignUpPage from "./pages/signup/SignUpPage";
import "./global-styles/App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tournaments" element={<TournamentPage />} />
        <Route path="/llm-demo" element={<GeminiDemoPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </Router>
  );
}

export default App;
