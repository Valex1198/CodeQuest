import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8055";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ensures cookies are sent
});

export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
};

export const getCurrentUser = async () => {
  try {
    const res = await api.get("/users/me");
    return res.data;
  } catch {
    return null;
  }
};
