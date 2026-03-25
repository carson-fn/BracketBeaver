import type { Request, Response } from "express";
import { loginUser, registerUser, updateUserProfile } from "../services/authService.js";
import { getAllUsers, deleteUser } from "../models/userModel.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    console.log("AUTH CONTROLLER: Login attempt for username:", username);

    const result = await loginUser(username, password);
    
    console.log("AUTH CONTROLLER: loginUser returned:", result);

    if (result.success) {
      console.log("AUTH CONTROLLER: Login success, sending user:", result.user);
      res.json(result);
    } else {
      console.log("AUTH CONTROLLER: Login failed");
      res.status(401).json(result);
    }
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const result = await registerUser(username, password);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ success: false });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const result = await updateUserProfile(parseInt(userId), username, password);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    console.log("LIST USERS: Starting to fetch users");
    const users = await getAllUsers();
    console.log("LIST USERS: Successfully fetched", users.length, "users");
    res.json({ success: true, users });
  } catch (err: any) {
    console.error("LIST USERS ERROR:", err);
    console.error("LIST USERS ERROR MESSAGE:", err.message);
    console.error("LIST USERS ERROR CODE:", err.code);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
};

export const removeUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await deleteUser(parseInt(userId));

    if (result) {
      res.json({ success: true, message: "User deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};