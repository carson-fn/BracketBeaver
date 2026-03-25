import express from "express";
import {
  createTournamentHandler,
  generateScheduleHandler,
  getBracketHandler,
  getScheduleHandler,
  updateMatchResultHandler,
  getTournamentsHandler,
  deleteTournamentHandler,
  predictMatchHandler,
} from "../controllers/tournamentController.js";
import { generateTournamentSummaryHandler } from "../controllers/tournamentSummaryController.js";

const router = express.Router();

router.post("/tournaments", createTournamentHandler);
router.get("/tournaments", getTournamentsHandler);
router.delete("/tournaments/:id", deleteTournamentHandler);
router.post("/tournaments/:id/schedule/generate", generateScheduleHandler);
router.get("/tournaments/:id/schedule", getScheduleHandler);
router.get("/tournaments/:id/bracket", getBracketHandler);
router.patch("/tournaments/:id/matches/:matchId/result", updateMatchResultHandler);
router.post("/tournaments/:id/matches/:matchId/predict", predictMatchHandler);
router.post("/tournaments/:id/summary", generateTournamentSummaryHandler);

export default router;
