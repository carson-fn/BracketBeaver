import { findUserByUsername, createUser } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "./jwtService.js";

export const loginUser = async (username: string, password: string) => {
  const user = await findUserByUsername(username);

  if (!user) return { success: false, message: "User not found" };

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) return { success: false, message: "Invalid password" };

  const token = generateToken(user.userID, user.username);

  return { 
    success: true, 
    token,
    user: {
      id: user.userID,
      username: user.username,
      role: user.role
    }
  };
};

export const registerUser = async (username: string, password: string) => {
  const existing = await findUserByUsername(username);

  if (existing) {
    return { success: false, message: "Username already exists" };
  }

  await createUser(username, password);

  const newUser = await findUserByUsername(username);
  const token = generateToken(newUser.userID, newUser.username);

  return { 
    success: true,
    token,
    user: {
      id: newUser.userID,
      username: newUser.username,
      role: newUser.role
    }
  };
};