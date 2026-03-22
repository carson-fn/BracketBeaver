import React, { useState } from "react";
import "./styles/OrganizerDashboard.css";

export default function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState("brackets");

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
            <div>
              {[1, 2, 3].map((b) => (
                <div key={b} className="card">
                  Placeholder Bracket {b}
                  <button className="card-action-button mt-2">Edit</button>
                </div>
              ))}
            </div>
          </div>
        );

      case "user":
        return (
          <div>
            <h2>Edit Profile</h2>
            <input className="search-input" placeholder="New Username" />
            <input className="search-input" placeholder="Confirm Username" />
            <input className="search-input" placeholder="New Password" />
            <input
              className="search-input"
              placeholder="Confrim New Password"
            />
            <button className="card-action-button">Update Profile</button>
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
          <button className="button-create">+ Create Bracket</button>
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
