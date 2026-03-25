// Debug script to verify user login and IDs
// This can help verify the issue with tournament creation

import { callLoginAPI } from "./api/loginApi";

export async function debugLogin() {
  try {
    console.log("Attempting login as alice...");
    const response = await callLoginAPI("alice", "alice123");
    console.log("Login response:", response);
    
    if (response.success && response.user) {
      console.log("User data:", response.user);
      console.log("User ID:", response.user.id);
      console.log("Username:", response.user.username);
      console.log("Role:", response.user.role);
      
      // Store and retrieve like the app does
      localStorage.setItem("bb-user", JSON.stringify(response.user));
      const stored = localStorage.getItem("bb-user");
      const parsed = JSON.parse(stored || "{}");
      console.log("Stored user:", parsed);
      console.log("Retrieved ID:", parsed.id);
    } else {
      console.log("Login failed:", response.message);
    }
  } catch (error) {
    console.error("Login error:", error);
  }
}
