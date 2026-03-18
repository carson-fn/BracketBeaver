export type GeminiDemoResponse = {
  text: string;
  model: string;
};

export async function callGeminiDemo(prompt: string): Promise<GeminiDemoResponse> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  const res = await fetch("/api/llm/demo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    // Attempt to get server-provided error, otherwise fallback
    const errBody = await res.json().catch(() => ({}));
    const message = (errBody as { error?: string }).error ?? `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}
