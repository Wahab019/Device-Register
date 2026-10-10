"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, loginStaff, signupStaff } from "./api";
import type { StaffUser } from "./types";

type AuthContextType = {
  user: StaffUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => void;
};

// Shared auth state for the staff app. Components can consume this without
// manually passing user/session props through the component tree.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore the current staff session on first load by checking the saved token
    // and fetching the authenticated user profile from the backend.
    const token = localStorage.getItem("staff_access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem("staff_access_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Store the token immediately after a successful login or signup so the rest of
  // the app can reuse the same session without a separate reload.
  const login = async (email: string, password: string) => {
    const res = await loginStaff({ email, password });
    localStorage.setItem("staff_access_token", res.access_token);
    setUser(res.user);
  };

  const signup = async (email: string, password: string, inviteCode: string) => {
    const res = await signupStaff({ email, password, invite_code: inviteCode });
    localStorage.setItem("staff_access_token", res.access_token);
    setUser(res.user);
  };

  // Clear the session and redirect back to the sign-in screen.
  const logout = () => {
    localStorage.removeItem("staff_access_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // This hook should only be used from a component inside AuthProvider.
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
