import { findUserByUsername } from "../models/userModel.js";

export const loginUser = async (username: string, password: string) => {
  const user = await findUserByUsername(username);

  if (!user) return { success: false };

  if (user.password !== password) return { success: false };

  return { success: true, user };
};