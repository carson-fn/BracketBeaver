export type CreateTournamentRequest = {
  name: string;
  sport: string;
  bracketType: "single_elimination" | "round_robin";
  startDate: string;
  endDate: string;
  createdBy: number;
  teams: string[];
  venues: string[];
};

export type BracketResponse = {
  success: boolean;
  bracket?: {
    tournament: {
      tournamentId: number;
      name: string;
      sport: string;
      bracketType: string;
      startDate: string;
      endDate: string;
    };
    rounds: Array<{
      roundNumber: number;
      name: string;
      matches: Array<{
        matchId: number;
        label: string;
        slotNumber: number;
        status: "pending" | "completed";
        venue: string;
        matchTime: string;
        winnerTeamId: number | null;
        homeSourceMatchId: number | null;
        awaySourceMatchId: number | null;
        homeTeam: {
          id: number | null;
          name: string;
          score: number | null;
        };
        awayTeam: {
          id: number | null;
          name: string;
          score: number | null;
        };
      }>;
    }>;
  };
  message?: string;
};

const handleJson = async <T>(response: Response): Promise<T> => {
  const data = (await response.json()) as T & { message?: string; success?: boolean };

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed.");
  }

  return data;
};

export const createTournamentApi = async (payload: CreateTournamentRequest) => {
  const response = await fetch("/api/tournaments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson<{ success: boolean; tournamentId: number }>(response);
};

export const generateTournamentApi = async (tournamentId: number) => {
  const response = await fetch(`/api/tournaments/${tournamentId}/schedule/generate`, {
    method: "POST",
  });

  return handleJson<{ success: boolean; generatedMatches: number }>(response);
};

export const getBracketApi = async (tournamentId: number) => {
  const response = await fetch(`/api/tournaments/${tournamentId}/bracket`);
  return handleJson<BracketResponse>(response);
};

export const updateMatchResultApi = async (
  tournamentId: number,
  matchId: number,
  homeScore: number,
  awayScore: number
) => {
  const response = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}/result`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ homeScore, awayScore }),
  });

  return handleJson<{ success: boolean; winnerTeamId: number }>(response);
};

export const generateTournamentSummaryApi = async (tournamentId: number) => {
  const response = await fetch(`/api/tournaments/${tournamentId}/summary`, {
    method: "POST",
  });

  return handleJson<{
    success: boolean;
    summary: string;
    model: string;
    tokensUsed?: number;
  }>(response);
};
