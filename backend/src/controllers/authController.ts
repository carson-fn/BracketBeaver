import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/authService.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const result = await loginUser(username, password);

    if (result.success) {
      res.json(result);
    } else {
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