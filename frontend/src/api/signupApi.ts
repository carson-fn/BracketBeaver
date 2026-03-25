import { getApiUrl } from "./apiConfig";

export const callSignupAPI = async (
  username: string,
  password: string,
  isAdmin: boolean = false
) => {
  const res = await fetch(getApiUrl("/api/signup"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, isAdmin }),
  });

  return res.json();
};
