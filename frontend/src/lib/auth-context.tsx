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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
