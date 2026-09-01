"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getToken,
  setToken as saveToken,
  removeToken,
  setCookie,
  isAuthenticated as checkAuth,
} from "@/lib/auth";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getToken();
    if (stored && checkAuth()) {
      setTokenState(stored);
      setCookie();
    } else {
      removeToken();
      setTokenState(null);
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Login failed");
      }

      const data = await res.json();
      saveToken(data.access_token);
      setTokenState(data.access_token);

      const params = new URLSearchParams(window.location.search);
      const from = params.get("from") || "/dashboard";
      router.push(from);
    },
    [router]
  );

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token && checkAuth(),
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
