import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Dashboard.css";
import {
  getTournamentsApi,
  deleteTournamentApi,
} from "../../api/tournamentApi";
import { updateUserApi } from "../../api/userApi";

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("brackets");
  const [brackets, setBrackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const user = JSON.parse(localStorage.getItem("bb-user") || "{}");
  const userId = user?.id;

  useEffect(() => {
    if (activeTab === "brackets") {
      loadBrackets();
    }
  }, [activeTab]);

  const loadBrackets = async () => {
    try {
      setLoading(true);
      setError("");
      // Pass userId as filter so backend only returns this user's tournaments
      const data = await getTournamentsApi(userId);
      if (data.success && data.tournaments) {
        setBrackets(data.tournaments);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load brackets");
      console.error("Error loading brackets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBracket = async (tournamentId: number) => {
    if (!window.confirm("Are you sure you want to delete this bracket?")) {
      return;
    }

    try {
      await deleteTournamentApi(tournamentId);
      setBrackets(brackets.filter((b) => b.id !== tournamentId));
    } catch (err: any) {
      setError(err.message || "Failed to delete bracket");
    }
  };

  const handleUpdateProfile = async () => {
    setUpdateError("");
    setUpdateSuccess("");

    if (!username || !password) {
      setUpdateError("Username and password are required");
      return;
    }

    if (username !== confirmUsername) {
      setUpdateError("Usernames do not match");
      return;
    }

    if (password !== confirmPassword) {
      setUpdateError("Passwords do not match");
      return;
    }

    try {
      const result = await updateUserApi(userId, username, password);
      if (result.success) {
        const updatedUser = { ...user, username: result.user.username };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUpdateSuccess("Profile updated successfully!");
        setUsername("");
        setConfirmUsername("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update profile");
    }
  };

  const handleCreateBracket = () => {
    navigate("/tournaments");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "brackets":
        return (
          <div>
            <h2>My Brackets</h2>
            <input
              className="search-input"
              placeholder="Search Your Brackets"
            />
            {loading && <p>Loading brackets...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <div>
              {brackets.length === 0 && !loading ? (
                <p>No brackets created yet.</p>
              ) : (
                brackets.map((b) => (
                  <div key={b.id} className="card">
                    <strong>{b.name}</strong>
                    <p>Sport: {b.sport}</p>
                    <p>Type: {b.bracketType}</p>
                    <p>Start: {b.startDate}</p>
                    <button
                      className="card-action-button mt-2"
                      onClick={() => navigate(`/tournaments/${b.id}`)}
                    >
                      View
                    </button>
                    <button
                      className="card-action-button mt-2"
                      style={{ backgroundColor: "#dc3545" }}
                      onClick={() => handleDeleteBracket(b.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "user":
        return (
          <div>
            <h2>Edit Profile</h2>
            {updateError && <p style={{ color: "red" }}>{updateError}</p>}
            {updateSuccess && <p style={{ color: "green" }}>{updateSuccess}</p>}
            <input
              className="search-input"
              placeholder="New Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="search-input"
              placeholder="Confirm Username"
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.target.value)}
            />
            <input
              className="search-input"
              placeholder="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="search-input"
              placeholder="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              className="card-action-button"
              onClick={handleUpdateProfile}
            >
              Update Profile
            </button>
          </div>
        );
      default:
        null;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h1 className="sidebar-title">Organizer Panel</h1>
        <button
          className={`sidebar-button ${activeTab === "brackets" ? "active" : ""}`}
          onClick={() => setActiveTab("brackets")}
        >
          My Brackets
        </button>

        <button
          className={`sidebar-button ${activeTab === "user" ? "active" : ""}`}
          onClick={() => setActiveTab("user")}
        >
          My Profile
        </button>

        <div className="sidebar-bottom">
          <button className="button-create" onClick={handleCreateBracket}>
            + Create Bracket
          </button>
          <button
            className="button-logout"
            onClick={() => (window.location.href = "/")}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">{renderContent()}</div>
    </div>
  );
}
