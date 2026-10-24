import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { api, getToken } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const signOut = useCallback(() => {
    api.logout();
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("applytrack:unauthorized", handleUnauthorized);
    if (getToken()) {
      api
        .me()
        .then(setUser)
        .catch(() => signOut())
        .finally(() => setLoading(false));
    }
    return () => window.removeEventListener("applytrack:unauthorized", handleUnauthorized);
  }, [signOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    const loggedInUser = await api.login({ email, password });
    setUser(loggedInUser);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await api.register({ name, email, password });
    const loggedInUser = await api.login({ email, password });
    setUser(loggedInUser);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
