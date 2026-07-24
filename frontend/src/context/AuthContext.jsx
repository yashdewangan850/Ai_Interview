import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, setAuthToken, setUnauthorizedHandler } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "ai-interview-platform-auth";

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  function clearSession() {
    setToken("");
    setUser(null);
    setAuthToken("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);

      if (!storedValue) {
        setAuthLoading(false);
        return;
      }

      try {
        const parsedValue = JSON.parse(storedValue);

        if (!parsedValue.token) {
          clearSession();
          return;
        }

        setAuthToken(parsedValue.token);
        const data = await apiRequest("/auth/me");
        const nextSession = {
          token: parsedValue.token,
          user: data.user,
        };

        setToken(parsedValue.token);
        setUser(data.user);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      } catch (_error) {
        clearSession();
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function syncCurrentUser(sessionToken) {
    setAuthToken(sessionToken);
    const data = await apiRequest("/auth/me");
    const session = {
      token: sessionToken,
      user: data.user,
    };
    setToken(sessionToken);
    setUser(data.user);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return data.user;
  }

  async function login(credentials) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    await syncCurrentUser(data.token);
    return data.user;
  }

  async function signup(payload) {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    await syncCurrentUser(data.token);
    return data.user;
  }

  function logout() {
    clearSession();
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      authLoading,
      login,
      signup,
      logout,
    }),
    [token, user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
