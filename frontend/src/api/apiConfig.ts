// Centralized API configuration
export const API_BASE_URL = "http://localhost:3000";

export const getApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};
