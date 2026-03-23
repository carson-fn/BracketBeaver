import express from "express";
import { login, signup, updateProfile, listUsers, removeUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/users/:userId", updateProfile);
router.get("/users", listUsers);
router.delete("/users/:userId", removeUser);

export default router;