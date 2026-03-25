import { findUserByUsername, createUser, updateUser, findUserById } from "../models/userModel.js";
import { hashPassword, comparePassword } from "./passwordService.js";

export const loginUser = async (username: string, password: string) => {
  console.log("AUTH SERVICE: loginUser called with username:", username);
  
  const user = await findUserByUsername(username);
  console.log("AUTH SERVICE: findUserByUsername returned:", user);

  if (!user) {
    console.log("AUTH SERVICE: User not found");
    return { success: false };
  }

  let isPasswordValid = false;
  
  // Try bcryptjs compare first (for hashed passwords)
  try {
    isPasswordValid = await comparePassword(password, user.password);
    console.log("AUTH SERVICE: bcryptjs password check result:", isPasswordValid);
  } catch (err) {
    // If bcryptjs fails (e.g., plain text password), try plain comparison
    console.log("AUTH SERVICE: bcryptjs failed, trying plain text comparison");
    isPasswordValid = password === user.password;
    console.log("AUTH SERVICE: plain text password check result:", isPasswordValid);
  }
  
  if (!isPasswordValid) {
    console.log("AUTH SERVICE: Password is invalid");
    return { success: false };
  }

  const response = { success: true, user: { id: user.id, username: user.username, role: user.role } };
  console.log("AUTH SERVICE: Login successful, returning:", response);
  return response;
};

export const registerUser = async (
  username: string,
  password: string,
  isAdmin: boolean = false
) => {
  const existing = await findUserByUsername(username);

  if (existing) {
    return { success: false };
  }

  const hashedPassword = await hashPassword(password);
  const role = isAdmin ? "admin" : "organizer";
  await createUser(username, hashedPassword, role);

  return { success: true };
};

export const updateUserProfile = async (userId: number, username: string, password: string) => {
  const user = await findUserById(userId);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  const existingUser = await findUserByUsername(username);
  if (existingUser && existingUser.userID !== userId) {
    return { success: false, message: "Username already taken" };
  }

  const hashedPassword = await hashPassword(password);
  const updated = await updateUser(userId, username, hashedPassword);
  return { success: true, user: updated };
};
