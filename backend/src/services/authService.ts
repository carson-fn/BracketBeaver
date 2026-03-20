import { findUserByUsername, createUser } from "../models/userModel.js";

export const loginUser = async (username: string, password: string) => {
  const user = await findUserByUsername(username);

  if (!user) return { success: false };

  if (user.password !== password) return { success: false };

  return { success: true, user };
};


export const registerUser = async (username: string, password: string) => {
  const existing = await findUserByUsername(username);

  if (existing) {
    return { success: false };
  }

  await createUser(username, password);

  return { success: true };
};