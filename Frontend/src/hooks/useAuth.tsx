import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, type User } from "@/lib/api";
import {
  authenticateWithBiometric,
  clearBiometricCredential,
  enrollBiometricCredential,
  getBiometricCredential,
  hasBiometricSupport,
} from "@/lib/biometric";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  biometricSupported: boolean;
  biometricEnabled: boolean;
  biometricUnlocked: boolean;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => void;
  unlockWithBiometric: () => Promise<boolean>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null, loading: true, isAdmin: false,
  biometricSupported: false, biometricEnabled: false, biometricUnlocked: false,
  enableBiometric: async () => false,
  disableBiometric: () => {},
  unlockWithBiometric: async () => false,
  signOut: async () => {},
  login: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);

  useEffect(() => {
    setBiometricSupported(hasBiometricSupport());
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authApi.getUser();
        setUser(userData);
        setIsAdmin(userData.is_admin);
      } catch {
        // Token invalid, clear it
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    const isEnabled = !!getBiometricCredential(user.id);
    setBiometricEnabled(isEnabled);

    const unlockedKey = `gym:unlock:${user.id}`;
    setBiometricUnlocked(sessionStorage.getItem(unlockedKey) === "1");
  }, [user]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    setIsAdmin(data.user.is_admin);
  };

  const enableBiometric = async () => {
    if (!user) return false;
    const ok = await enrollBiometricCredential(user.id, user.email);
    setBiometricEnabled(ok);
    if (ok) {
      const unlockedKey = `gym:unlock:${user.id}`;
      sessionStorage.setItem(unlockedKey, "1");
      setBiometricUnlocked(true);
    }
    return ok;
  };

  const disableBiometric = () => {
    if (!user) return;
    clearBiometricCredential(user.id);
    const unlockedKey = `gym:unlock:${user.id}`;
    sessionStorage.removeItem(unlockedKey);
    setBiometricEnabled(false);
    setBiometricUnlocked(false);
  };

  const unlockWithBiometric = async () => {
    if (!user) return false;
    const ok = await authenticateWithBiometric(user.id);
    if (ok) {
      const unlockedKey = `gym:unlock:${user.id}`;
      sessionStorage.setItem(unlockedKey, "1");
      setBiometricUnlocked(true);
    }
    return ok;
  };

  const signOut = async () => {
    if (user) sessionStorage.removeItem(`gym:unlock:${user.id}`);
    await authApi.logout();
    setUser(null);
    setIsAdmin(false);
    setBiometricEnabled(false);
    setBiometricUnlocked(false);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        isAdmin,
        biometricSupported,
        biometricEnabled,
        biometricUnlocked,
        enableBiometric,
        disableBiometric,
        unlockWithBiometric,
        signOut,
        login,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
