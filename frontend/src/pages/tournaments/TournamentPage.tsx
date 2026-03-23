import { useMemo, useState } from "react";
import {
  createTournamentApi,
  generateTournamentApi,
  getBracketApi,
  updateMatchResultApi,
  type BracketResponse,
} from "../../api/tournamentApi";
import "./styles/tournamentStyles.css";

type StoredUser = {
  userid?: number;
  username?: string;
  role?: string;
};

type ScoreDrafts = Record<number, { homeScore: string; awayScore: string }>;

const defaultForm = {
  name: "Spring Championship",
  sport: "Basketball",
  bracketType: "single_elimination" as "single_elimination" | "round_robin",
  startDate: "2026-03-21",
  endDate: "2026-03-28",
  teamsText: "Team A\nTeam B\nTeam C\nTeam D\nTeam E\nTeam F",
  venuesText: "Court 1\nCourt 2",
};

function TournamentPage() {
  const [form, setForm] = useState(defaultForm);
  const [loadTournamentId, setLoadTournamentId] = useState("");
  const [currentTournamentId, setCurrentTournamentId] = useState<number | null>(null);
  const [bracket, setBracket] = useState<BracketResponse["bracket"]>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [scoreDrafts, setScoreDrafts] = useState<ScoreDrafts>({});

  const storedUser = useMemo<StoredUser | null>(() => {
    const raw = localStorage.getItem("bb-user");
    if (!raw) return null;

    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }, []);

  const isGuest = storedUser?.role === "guest";
  const creatorId = isGuest ? null : storedUser?.userid ?? 1;
  const teamList = form.teamsText.split("\n").map((value) => value.trim()).filter(Boolean);
  const venueList = form.venuesText.split("\n").map((value) => value.trim()).filter(Boolean);

  const refreshBracket = async (tournamentId: number) => {
    const response = await getBracketApi(tournamentId);
    setBracket(response.bracket);
    setCurrentTournamentId(tournamentId);
    setScoreDrafts({});
  };

  const handleCreateTournament = async () => {
    setIsBusy(true);
    setError("");
    setMessage("");

    if (isGuest){
      setError("Guests cannot create tournaments. Please log in to create and manage your tournaments.");
      setMessage("You can still load and view existing tournaments as a guest.");
      return;
    }

    if (creatorId === null) {
      setError("No valid user found. Please log in again.");
      setMessage("");
      return;
    }

    try {
      const createResponse = await createTournamentApi({
        name: form.name,
        sport: form.sport,
        bracketType: form.bracketType,
        startDate: form.startDate,
        endDate: form.endDate,
        createdBy: creatorId,
        teams: teamList,
        venues: venueList,
      });

      await generateTournamentApi(createResponse.tournamentId);
      await refreshBracket(createResponse.tournamentId);
      setMessage(`Tournament ${createResponse.tournamentId} created and generated.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create tournament.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLoadBracket = async () => {
    const tournamentId = Number(loadTournamentId);
    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      setError("Enter a valid tournament id to load.");
      return;
    }

    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      await refreshBracket(tournamentId);
      setMessage(`Loaded tournament ${tournamentId}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load bracket.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleScoreChange = (matchId: number, side: "homeScore" | "awayScore", value: string) => {
    setScoreDrafts((current) => ({
      ...current,
      [matchId]: {
        homeScore: current[matchId]?.homeScore ?? "",
        awayScore: current[matchId]?.awayScore ?? "",
        [side]: value,
      },
    }));
  };

  const handleSubmitResult = async (matchId: number) => {
    if (isGuest) {
      setError("Guests cannot submit match results. Please log in to manage tournament progress.");
      return;
    }
    
    if (!currentTournamentId) {
      setError("No tournament is loaded.");
      return;
    }

    const draft = scoreDrafts[matchId];
    const homeScore = Number(draft?.homeScore);
    const awayScore = Number(draft?.awayScore);

    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      setError("Enter whole-number scores before submitting.");
      return;
    }

    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      await updateMatchResultApi(currentTournamentId, matchId, homeScore, awayScore);
      await refreshBracket(currentTournamentId);
      setMessage(`Updated result for match ${matchId}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update result.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleQuickAdvance = async (
    matchId: number,
    winner: "home" | "away"
  ) => {
    if (isGuest) {
      setError("Guests cannot submit match results. Please log in to manage tournaments");
      return;
    }

    if (!currentTournamentId) {
      setError("No tournament is loaded.");
      return;
    }

    const homeScore = winner === "home" ? 1 : 0;
    const awayScore = winner === "away" ? 1 : 0;

    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      await updateMatchResultApi(currentTournamentId, matchId, homeScore, awayScore);
      await refreshBracket(currentTournamentId);
      setMessage(`Advanced winner for match ${matchId}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to advance winner.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="tournament-page">
      <section className="tournament-panel">
        <div>
          <p className="eyebrow">Bracket Builder</p>
          <h1>Single-Elimination and Round-Robin Tournaments</h1>
          <p className="panel-copy">
            Create a tournament, generate its bracket, and submit results to advance winners.
          </p>
          <p className="panel-copy muted">
            Active user: {storedUser?.username ?? "Demo organizer"}
            {!isGuest && creatorId !== null ? `creator id ${creatorId})` : "(read-only)"}
          </p>
        </div>

        <div className="form-grid">
          <label>
            Tournament Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            Sport
            <input
              value={form.sport}
              onChange={(event) => setForm((current) => ({ ...current, sport: event.target.value }))}
            />
          </label>
          <label>
            Bracket Type
            <select
              value={form.bracketType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bracketType: event.target.value as "single_elimination" | "round_robin",
                }))
              }
            >
              <option value="single_elimination">Single elimination</option>
              <option value="round_robin">Round robin</option>
            </select>
          </label>
          <label>
            Start Date
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
            />
          </label>
        </div>

        <div className="textarea-grid">
          <label>
            Teams (one per line)
            <textarea
              value={form.teamsText}
              onChange={(event) => setForm((current) => ({ ...current, teamsText: event.target.value }))}
              rows={8}
            />
          </label>
          <label>
            Venues (one per line)
            <textarea
              value={form.venuesText}
              onChange={(event) => setForm((current) => ({ ...current, venuesText: event.target.value }))}
              rows={8}
            />
          </label>
        </div>

        <div className="button-row">
          <button onClick={handleCreateTournament} disabled={isBusy || isGuest}>
            {isGuest ? "Guests can't create tournaments" : isBusy ? "Working..." : "Create and Generate"}
          </button>

          <input
            className="load-input"
            type="number"
            min="1"
            placeholder="Tournament id"
            value={loadTournamentId}
            onChange={(event) => setLoadTournamentId(event.target.value)}
          />
          <button onClick={handleLoadBracket} disabled={isBusy}>
            Load Existing
          </button>
        </div>

        <div className="summary-grid">
          <div>
            <span>Teams</span>
            <strong>{teamList.length}</strong>
          </div>
          <div>
            <span>Venues</span>
            <strong>{venueList.length}</strong>
          </div>
          <div>
            <span>Current Tournament</span>
            <strong>{currentTournamentId ?? "—"}</strong>
          </div>
        </div>

        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
      </section>

      <section className="bracket-section">
        {bracket ? (
          <>
            <div className="bracket-header">
              <div>
                <p className="eyebrow">{bracket.tournament.bracketType.replaceAll("_", " ")}</p>
                <h2>{bracket.tournament.name}</h2>
                <p className="panel-copy muted">
                  {bracket.tournament.sport} • {bracket.tournament.startDate} to {bracket.tournament.endDate}
                </p>
              </div>
            </div>

            <div className="rounds-row">
              {bracket.rounds.map((round) => (
                <div className="round-column" key={round.roundNumber}>
                  <h3>{round.name}</h3>
                  {round.matches.map((match) => {
                    const draft = scoreDrafts[match.matchId] ?? { homeScore: "", awayScore: "" };
                    const canSubmit =
                      !isGuest &&
                      match.homeTeam.id !== null &&
                      match.awayTeam.id !== null &&
                      match.status !== "completed";

                    return (
                      <article className="match-card" key={match.matchId}>
                        <div className="match-card__top">
                          <div>
                            <strong>{match.label}</strong>
                            <p>
                              {match.venue} • {new Date(match.matchTime).toLocaleString()}
                            </p>
                          </div>
                          <span className={`badge ${match.status}`}>{match.status}</span>
                        </div>

                        <div className={`team-row ${match.winnerTeamId === match.homeTeam.id ? "winner" : ""}`}>
                          <span>{match.homeTeam.name}</span>
                          <span>{match.homeTeam.score ?? "—"}</span>
                        </div>
                        <div className={`team-row ${match.winnerTeamId === match.awayTeam.id ? "winner" : ""}`}>
                          <span>{match.awayTeam.name}</span>
                          <span>{match.awayTeam.score ?? "—"}</span>
                        </div>

                        {canSubmit ? (
                          <div className="score-controls">
                            <input
                              type="number"
                              min="0"
                              placeholder="Home"
                              value={draft.homeScore}
                              onChange={(event) => handleScoreChange(match.matchId, "homeScore", event.target.value)}
                            />
                            <input
                              type="number"
                              min="0"
                              placeholder="Away"
                              value={draft.awayScore}
                              onChange={(event) => handleScoreChange(match.matchId, "awayScore", event.target.value)}
                            />
                            <button onClick={() => handleSubmitResult(match.matchId)} disabled={isBusy}>
                              Save
                            </button>
                          </div>
                        ) : null}

                        {canSubmit ? (
                          <div className="quick-advance-row">
                            <span>Quick advance:</span>
                            <button
                              className="secondary"
                              onClick={() => handleQuickAdvance(match.matchId, "home")}
                              disabled={isBusy}
                            >
                              {match.homeTeam.name} wins
                            </button>
                            <button
                              className="secondary"
                              onClick={() => handleQuickAdvance(match.matchId, "away")}
                              disabled={isBusy}
                            >
                              {match.awayTeam.name} wins
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>No bracket loaded yet</h2>
            <p>Create a new tournament or load an existing one to see the generated bracket.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default TournamentPage;
