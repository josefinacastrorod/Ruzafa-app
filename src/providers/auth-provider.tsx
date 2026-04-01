"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import {
  clearSessionStorage,
  getStoredSession,
  login as loginService,
  register as registerService,
  type AuthSession,
} from "@/services/auth";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  loginUser: (email: string, password: string) => Promise<{ message: string }>;
  registerUser: (email: string, password: string) => Promise<{ message: string }>;
  logoutUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const storedSession = await getStoredSession();

      if (!isMounted) {
        return;
      }

      setSession(storedSession);
      setIsInitializing(false);
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isInitializing,
      async loginUser(email, password) {
        const result = await loginService(email, password);
        setSession(result.session);
        return { message: result.message };
      },
      async registerUser(email, password) {
        const result = await registerService(email, password);
        setSession(result.session);
        return { message: result.message };
      },
      async logoutUser() {
        await clearSessionStorage();
        setSession(null);
      },
    }),
    [isInitializing, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
