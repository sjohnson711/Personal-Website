import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

interface AuthState {
  email: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ email: null, loading: true });

  useEffect(() => {
    api
      .get("/auth/me")
      .then((data: { email: string } | null) =>
        setState({ email: data?.email ?? null, loading: false }),
      )
      .catch(() => setState({ email: null, loading: false }));
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const data: { email: string } = await api.post("/auth/login", {
        email,
        password,
      });
      setState({ email: data.email, loading: false });
      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    await api.post("/auth/logout");
    setState({ email: null, loading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
