import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Dashboard.css";
import { getUserListApi, deleteUserApi, updateUserApi } from "../../api/userApi";
import {
  getTournamentsApi,
  deleteTournamentApi,
} from "../../api/tournamentApi";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [users, setUsers] = useState<any[]>([]);
  const [brackets, setBrackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Profile states
  const [adminUsername, setAdminUsername] = useState("");
  const [confirmAdminUsername, setConfirmAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // User editing states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [confirmEditUsername, setConfirmEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmEditPassword, setConfirmEditPassword] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const user = JSON.parse(localStorage.getItem("bb-user") || "{}");
  const adminId = user?.id;

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "brackets") {
      loadBrackets();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUserListApi();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users");
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBrackets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getTournamentsApi();
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

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await deleteUserApi(userId);
      setUsers(users.filter((u) => u.id !== userId));
      setSelectedUserId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
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

  const handleUpdateAdminProfile = async () => {
    setProfileError("");
    setProfileSuccess("");

    if (!adminUsername || !adminPassword) {
      setProfileError("Username and password are required");
      return;
    }

    if (adminUsername !== confirmAdminUsername) {
      setProfileError("Usernames do not match");
      return;
    }

    if (adminPassword !== confirmAdminPassword) {
      setProfileError("Passwords do not match");
      return;
    }

    try {
      const result = await updateUserApi(adminId, adminUsername, adminPassword);
      if (result.success) {
        const updatedUser = { ...user, username: result.user.username };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setProfileSuccess("Profile updated successfully!");
        setAdminUsername("");
        setConfirmAdminUsername("");
        setAdminPassword("");
        setConfirmAdminPassword("");
      }
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    }
  };

  const handleSelectUserForEdit = (userId: number, username: string) => {
    setSelectedUserId(userId);
    setEditUsername("");
    setConfirmEditUsername("");
    setEditPassword("");
    setConfirmEditPassword("");
    setEditError("");
    setEditSuccess("");
  };

  const handleUpdateUserProfile = async () => {
    if (!selectedUserId) return;

    setEditError("");
    setEditSuccess("");

    if (!editUsername || !editPassword) {
      setEditError("Username and password are required");
      return;
    }

    if (editUsername !== confirmEditUsername) {
      setEditError("Usernames do not match");
      return;
    }

    if (editPassword !== confirmEditPassword) {
      setEditError("Passwords do not match");
      return;
    }

    try {
      const result = await updateUserApi(selectedUserId, editUsername, editPassword);
      if (result.success) {
        setUsers(
          users.map((u) =>
            u.id === selectedUserId ? { ...u, username: result.user.username } : u
          )
        );
        setEditSuccess("User profile updated successfully!");
        setTimeout(() => setSelectedUserId(null), 1500);
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update user profile");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div>
            <h2>My Profile</h2>
            {profileError && <p style={{ color: "red" }}>{profileError}</p>}
            {profileSuccess && <p style={{ color: "green" }}>{profileSuccess}</p>}
            <div style={{ marginBottom: "20px" }}>
              <h3>Admin: {user?.username}</h3>
              <input
                className="search-input"
                placeholder="New Username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
              <input
                className="search-input"
                placeholder="Confirm Username"
                value={confirmAdminUsername}
                onChange={(e) => setConfirmAdminUsername(e.target.value)}
              />
              <input
                className="search-input"
                placeholder="New Password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <input
                className="search-input"
                placeholder="Confirm New Password"
                type="password"
                value={confirmAdminPassword}
                onChange={(e) => setConfirmAdminPassword(e.target.value)}
              />
              <button
                className="card-action-button"
                onClick={handleUpdateAdminProfile}
              >
                Update My Profile
              </button>
            </div>
          </div>
        );

      case "users":
        return (
          <div>
            <h2>User Accounts</h2>
            <input className="search-input" placeholder="Search users..." />
            {loading && <p>Loading users...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {selectedUserId ? (
              <div
                style={{
                  border: "2px solid #007bff",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <h3>
                  Edit User: {users.find((u) => u.id === selectedUserId)?.username}
                </h3>
                {editError && <p style={{ color: "red" }}>{editError}</p>}
                {editSuccess && (
                  <p style={{ color: "green" }}>{editSuccess}</p>
                )}
                <input
                  className="search-input"
                  placeholder="New Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
                <input
                  className="search-input"
                  placeholder="Confirm Username"
                  value={confirmEditUsername}
                  onChange={(e) => setConfirmEditUsername(e.target.value)}
                />
                <input
                  className="search-input"
                  placeholder="New Password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
                <input
                  className="search-input"
                  placeholder="Confirm New Password"
                  type="password"
                  value={confirmEditPassword}
                  onChange={(e) => setConfirmEditPassword(e.target.value)}
                />
                <button
                  className="card-action-button"
                  onClick={handleUpdateUserProfile}
                >
                  Update User
                </button>
                <button
                  className="card-action-button"
                  style={{ backgroundColor: "#6c757d", marginLeft: "10px" }}
                  onClick={() => setSelectedUserId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : null}

            <div>
              {users.length === 0 && !loading ? (
                <p>No users found.</p>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="card">
                    <strong>{u.username}</strong>
                    <p>Role: {u.role}</p>
                    <button
                      className="card-action-button mt-2"
                      onClick={() =>
                        handleSelectUserForEdit(u.id, u.username)
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="card-action-button mt-2"
                      style={{ backgroundColor: "#dc3545" }}
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "brackets":
        return (
          <div>
            <h2>View Brackets</h2>
            <input className="search-input" placeholder="Search brackets..." />
            {loading && <p>Loading brackets...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <div>
              {brackets.length === 0 && !loading ? (
                <p>No brackets found.</p>
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
          className={`sidebar-button ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </button>
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
          <button className="button-create" onClick={() => navigate("/tournament")}>
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
