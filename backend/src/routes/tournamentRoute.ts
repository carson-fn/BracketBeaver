import express from "express";
import {
  createTournamentHandler,
  generateScheduleHandler,
  getScheduleHandler,
} from "../controllers/tournamentController.js";

const router = express.Router();

router.post("/tournaments", createTournamentHandler);
router.post("/tournaments/:id/schedule/generate", generateScheduleHandler);
router.get("/tournaments/:id/schedule", getScheduleHandler);

export default router;
