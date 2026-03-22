import { useEffect, useState } from "react";
import { generateTournamentSummaryApi } from "../../../api/tournamentApi";

type SummarySectionProps = {
  tournamentId: number | null;
  isComplete: boolean;
};

function SummarySection({ tournamentId, isComplete }: SummarySectionProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setSummary(null);
    setSummaryError("");
    setSummaryLoading(false);
  }, [tournamentId]);

  const handleGenerateSummary = async () => {
    if (!tournamentId) {
      setSummaryError("No tournament is loaded.");
      return;
    }

    setSummaryError("");
    setSummary(null);
    setSummaryLoading(true);

    try {
      const result = await generateTournamentSummaryApi(tournamentId);
      setSummary(result.summary);
    } catch (caughtError) {
      setSummaryError(caughtError instanceof Error ? caughtError.message : "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const hint = isComplete
    ? "Ready to summarize this finished bracket."
    : "Complete every match to enable summary.";

  return (
    <>
      <div className="summary-actions">
        <button className="secondary" onClick={handleGenerateSummary} disabled={summaryLoading || !isComplete}>
          {summaryLoading ? "Generating..." : "Generate summary"}
        </button>
        <p className="summary-hint">{hint}</p>
      </div>

      {(summary || summaryError) && (
        <div className="summary-panel">
          {summaryError ? <p className="status-message error">{summaryError}</p> : null}
          {summary ? (
            <>
              <p className="eyebrow">LLM summary</p>
              <p className="summary-text">{summary}</p>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}

export default SummarySection;
