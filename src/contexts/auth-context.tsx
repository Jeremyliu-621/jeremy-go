import { createContext, useContext, useState, type ReactNode } from "react";

interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

interface AuthCtx {
  user: User | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, signOut: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User>({
    id: "demo-user",
    username: "Trainer",
    avatarUrl: "",
  });

  const signOut = () => {};

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
