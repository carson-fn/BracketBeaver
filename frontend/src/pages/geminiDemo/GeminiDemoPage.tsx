import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { callGeminiDemo, type GeminiDemoResponse } from "../../api/geminiApi";
import "./styles/geminiDemo.css";

function GeminiDemoPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<GeminiDemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please enter a prompt to try the demo.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await callGeminiDemo(trimmed);
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gemini-page">
      <div className="gemini-card">
        <h1 className="gemini-title">Gemini LLM Demo</h1>
        <p className="gemini-subtitle">
          Enter a prompt to test the backend demo endpoint.
        </p>

        <textarea
          className="gemini-textarea"
          rows={6}
          placeholder="e.g., Write a haiku about tournament brackets."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="gemini-actions">
          <button className="gemini-button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Sending..." : "Send to Gemini"}
          </button>
          <button className="gemini-link" onClick={() => navigate("/")}>
            Back to home
          </button>
        </div>

        {error && <div className="gemini-error">{error}</div>}

        {result && (
          <div className="gemini-result">
            <div className="gemini-result-label">Model</div>
            <div className="gemini-chip">{result.model}</div>
            <div className="gemini-result-label">Response</div>
            <p className="gemini-result-text">{result.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GeminiDemoPage;
