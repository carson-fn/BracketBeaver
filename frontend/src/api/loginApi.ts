import { getApiUrl } from "./apiConfig";

export const callLoginAPI = async (username: string, password: string) => {
  const res = await fetch(getApiUrl("/api/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return res.json();
};