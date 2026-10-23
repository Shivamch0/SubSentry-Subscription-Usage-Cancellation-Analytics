import axios from "axios";

export const apiBase =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
let accessToken = "";
let refreshing = null;
export const setAccessToken = (token) => {
  accessToken = token || "";
};
const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 12000,
});
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.startsWith("/auth/")
    ) {
      original._retried = true;
      try {
        refreshing ||= axios.post(
          `${apiBase}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          },
        );
        const response = await refreshing;
        refreshing = null;
        setAccessToken(response.data.data.accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshing = null;
        setAccessToken("");
        window.dispatchEvent(new Event("session-expired"));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
export const getData = async (url, config) =>
  (await api.get(url, config)).data.data;
export const postData = async (url, payload) =>
  (await api.post(url, payload)).data.data;
export const patchData = async (url, payload) =>
  (await api.patch(url, payload)).data.data;
export default api;
