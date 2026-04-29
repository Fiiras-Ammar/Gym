import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { profileApi, authApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Upload, LogOut, Shield, ScanFace } from "lucide-react";
import { useNavigate } from "react-router-dom";

const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

const Profile = () => {
  const {
    user,
    isAdmin,
    signOut,
    biometricSupported,
    biometricEnabled,
    biometricUnlocked,
    enableBiometric,
    disableBiometric,
    unlockWithBiometric,
  } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    // Fetch profile from API
    profileApi.get().then((data) => {
      setDisplayName(data.display_name ?? "");
      setAvatarUrl(data.avatar_url ?? null);
    }).catch(() => {
      // Fallback: use user data from auth context
      setDisplayName(user.profile?.display_name ?? "");
      setAvatarUrl(user.profile?.avatar_url ?? null);
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await profileApi.update({ display_name: displayName.trim() || null });
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const data = await profileApi.uploadAvatar(file);
      setAvatarUrl(data.avatar_url);
      toast.success("Avatar updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async () => {
    if (pwd.length < 6) return toast.error("Password must be at least 6 characters");
    if (pwd !== pwd2) return toast.error("Passwords don't match");
    setSavingPwd(true);
    try {
      await authApi.changePassword("", pwd); // Old password not required for admin/initial setup
      setPwd(""); setPwd2("");
      toast.success("Password changed");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setSavingPwd(false);
    }
  };

  const changeEmail = async () => {
    if (!email.trim()) return;
    setSavingEmail(true);
    try {
      await authApi.changeEmail(email.trim());
      toast.success("Email updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const handleBiometricToggle = async (checked: boolean) => {
    if (!checked) {
      disableBiometric();
      toast.success("Face login disabled on this device");
      return;
    }

    try {
      setBiometricLoading(true);
      const ok = await enableBiometric();
      if (!ok) return toast.error("Could not enable biometric login.");
      toast.success("Face login enabled for this device");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Could not enable biometric login."));
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleUnlockNow = async () => {
    try {
      setBiometricLoading(true);
      const ok = await unlockWithBiometric();
      if (!ok) return toast.error("Biometric verification failed.");
      toast.success("Biometric verification successful");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Biometric verification failed."));
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <AppLayout title="Profile" subtitle="Manage your account">
      <div className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback>{(displayName || email || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{displayName || email}</p>
              {isAdmin && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <label>
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])} />
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-1 h-4 w-4" />Photo</>}</span>
              </Button>
            </label>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="w-full">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
            </Button>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold flex items-center gap-2">
            <ScanFace className="h-4 w-4" />
            Face login
          </h2>
          {!biometricSupported ? (
            <p className="text-sm text-muted-foreground">This device/browser does not support biometric passkeys.</p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Enable face login on this device</p>
                  <p className="text-xs text-muted-foreground">After first password login, unlock Gym with Face ID / Windows Hello.</p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  disabled={biometricLoading}
                  onCheckedChange={handleBiometricToggle}
                />
              </div>
              {biometricEnabled && (
                <Button
                  variant="outline"
                  onClick={handleUnlockNow}
                  disabled={biometricLoading || biometricUnlocked}
                  className="w-full"
                >
                  {biometricLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : biometricUnlocked ? "Biometric verified" : "Verify now"}
                </Button>
              )}
            </>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Email</h2>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="outline" onClick={changeEmail} disabled={savingEmail} className="w-full">
            {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update email"}
          </Button>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Change password</h2>
          <Input type="password" placeholder="New password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <Input type="password" placeholder="Confirm new password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
          <Button variant="outline" onClick={changePassword} disabled={savingPwd} className="w-full">
            {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change password"}
          </Button>
        </section>

        <Button variant="destructive" onClick={handleSignOut} className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
