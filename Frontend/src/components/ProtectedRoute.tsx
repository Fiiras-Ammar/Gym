import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { Loader2, ScanFace, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const ProtectedRoute = ({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) => {
  const {
    user,
    loading,
    isAdmin,
    biometricEnabled,
    biometricUnlocked,
    unlockWithBiometric,
    signOut,
  } = useAuth();
  const [unlocking, setUnlocking] = useState(false);
  const [attemptedAutoUnlock, setAttemptedAutoUnlock] = useState(false);
  const [unlockError, setUnlockError] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    if (!user || !biometricEnabled || biometricUnlocked || attemptedAutoUnlock) return;
    setAttemptedAutoUnlock(true);
    setUnlocking(true);
    setUnlockError(false);
    unlockWithBiometric()
      .then((ok) => {
        if (!ok) setUnlockError(true);
      })
      .catch(() => setUnlockError(true))
      .finally(() => setUnlocking(false));
  }, [attemptedAutoUnlock, biometricEnabled, biometricUnlocked, unlockWithBiometric, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (biometricEnabled && !biometricUnlocked) {
    const retry = () => {
      setAttemptedAutoUnlock(false);
      setUnlockError(false);
      setUsePassword(false);
    };

    const verifyPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.email || !password) return;
      setVerifyingPassword(true);
      try {
        await authApi.login(user.email, password);
        toast.success("Unlocked with password");
      } catch (error: any) {
        toast.error(error.message || "Invalid password");
      } finally {
        setVerifyingPassword(false);
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-hero shadow-glow">
            {usePassword ? <Lock className="h-5 w-5 text-primary-foreground" /> : <ScanFace className="h-5 w-5 text-primary-foreground" />}
          </div>
          {usePassword ? (
            <form onSubmit={verifyPassword} className="space-y-3 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2 pt-2">
                <Button type="submit" disabled={verifyingPassword} className="w-full gradient-hero text-primary-foreground shadow-glow">
                  {verifyingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setUsePassword(false)} className="w-full">
                  Back
                </Button>
              </div>
            </form>
          ) : unlockError ? (
            <>
              <p className="text-sm text-muted-foreground">Biometric unlock failed.</p>
              <div className="space-y-2">
                <Button onClick={retry} disabled={unlocking} className="w-full gradient-hero text-primary-foreground shadow-glow">
                  {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Try again"}
                </Button>
                <Button variant="outline" onClick={() => setUsePassword(true)} className="w-full">
                  Use password
                </Button>
                <Button variant="ghost" onClick={signOut} className="w-full">
                  Use another account
                </Button>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Authenticating...</p>
            </>
          )}
        </div>
      </div>
    );
  }
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};
