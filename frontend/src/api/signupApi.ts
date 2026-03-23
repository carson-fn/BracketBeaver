import { getApiUrl } from "./apiConfig";

export const callSignupAPI = async (username: string, password: string) => {
  const res = await fetch(getApiUrl("/api/signup"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return res.json();
};