import express from "express";
import {
  createTournamentHandler,
  generateScheduleHandler,
  getBracketHandler,
  getScheduleHandler,
  updateMatchResultHandler,
} from "../controllers/tournamentController.js";

const router = express.Router();

router.post("/tournaments", createTournamentHandler);
router.post("/tournaments/:id/schedule/generate", generateScheduleHandler);
router.get("/tournaments/:id/schedule", getScheduleHandler);
router.get("/tournaments/:id/bracket", getBracketHandler);
router.patch("/tournaments/:id/matches/:matchId/result", updateMatchResultHandler);

export default router;
