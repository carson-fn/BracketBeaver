import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/login/LoginPage";
import GeminiDemoPage from "./pages/geminiDemo/GeminiDemoPage";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import OrganizerDashboard from "./pages/dashboards/OrganizerDashboard";
import "./global-styles/App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/llm-demo" element={<GeminiDemoPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
