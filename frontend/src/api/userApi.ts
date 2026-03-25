import { getApiUrl } from "./apiConfig";

const handleJson = async <T>(response: Response): Promise<T> => {
  const data = (await response.json()) as T & { message?: string; success?: boolean };

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed.");
  }

  return data;
};

export const updateUserApi = async (userId: number, username: string, password: string) => {
  const response = await fetch(getApiUrl(`/api/users/${userId}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return handleJson<{ success: boolean; user: { id: number; username: string; role: string } }>(response);
};

export const getUserListApi = async () => {
  const response = await fetch(getApiUrl("/api/users"));
  return handleJson<{ success: boolean; users: Array<{ id: number; username: string; role: string }> }>(response);
};

export const deleteUserApi = async (userId: number) => {
  const response = await fetch(getApiUrl(`/api/users/${userId}`), {
    method: "DELETE",
  });

  return handleJson<{ success: boolean; message: string }>(response);
};
