import express from "express";
import { runGeminiDemo } from "../controllers/geminiController.js";

const router = express.Router();

router.post("/llm/demo", runGeminiDemo);

export default router;
