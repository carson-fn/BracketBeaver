import React, { useState } from "react";
import "./styles/Dashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return (
          <div>
            <h2>User Accounts</h2>
            <input className="search-input" placeholder="Search users..." />
            <div>
              {[1, 2, 3].map((u) => (
                <div key={u} className="card">
                  Placeholder User {u}
                  <button className="card-action-button mt-2">Manage</button>
                </div>
              ))}
            </div>
          </div>
        );

      case "brackets":
        return (
          <div>
            <h2>View Brackets</h2>
            <input className="search-input" placeholder="Search brackets..." />
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

      case "complaints":
        return (
          <div>
            <h2>Complaints & Bugs</h2>
            <input
              className="search-input"
              placeholder="Search complaints..."
            />
            <div>
              {[1, 2, 3].map((c) => (
                <div key={c} className="card">
                  Placeholder Complaint {c}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h1 className="sidebar-title">Admin Panel</h1>
        <button
          className={`sidebar-button ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          User Accounts
        </button>
        <button
          className={`sidebar-button ${activeTab === "brackets" ? "active" : ""}`}
          onClick={() => setActiveTab("brackets")}
        >
          View Brackets
        </button>
        <button
          className={`sidebar-button ${activeTab === "complaints" ? "active" : ""}`}
          onClick={() => setActiveTab("complaints")}
        >
          Complaints & Bugs
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
