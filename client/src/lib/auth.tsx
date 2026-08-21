import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  name: string;
  dateOfBirth: string;
  role: string;
  brokerCode: string | null;
  companyId: number | null;
  companyCode?: string;
  companyName?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  logout: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  dateOfBirth: string;
  role?: string;
  brokerCode?: string;
  referralCode?: string;
  companyCode?: string;
  termsAccepted?: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 0,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }): Promise<User> => {
      const res = await apiRequest("POST", "/api/auth/login", { email: email.trim(), password });
      return res.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "/api/auth/me" });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData): Promise<User> => {
      const res = await apiRequest("POST", "/api/auth/signup", { ...data, email: data.email.trim() });
      return res.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "/api/auth/me" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      setLocation("/");
    },
  });

  const login = async (email: string, password: string): Promise<User> => {
    return await loginMutation.mutateAsync({ email, password });
  };

  const signup = async (data: SignupData): Promise<User> => {
    return await signupMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, login, signup, logout }}>
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
