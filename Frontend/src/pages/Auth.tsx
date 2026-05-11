import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { authApi } from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await authApi.register(email.trim(), username.trim() || email.split('@')[0], password);
        toast.success("Account created! Please sign in");
        setIsRegister(false);
        setPassword("");
      } else {
        await login(email.trim(), password);
        toast.success("Welcome back");
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || (isRegister ? "Registration failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-hero shadow-glow">
            {isRegister ? <UserPlus className="h-5 w-5 text-primary-foreground" /> : <LogIn className="h-5 w-5 text-primary-foreground" />}
          </div>
          <h1 className="text-2xl font-bold">{isRegister ? "Create account" : "Sign in"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister ? "Create a new account to get started" : "Sign in to your account"}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {isRegister && (
            <div className="space-y-1.5">
              <Label htmlFor="username">Username (optional)</Label>
              <Input id="username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={email ? email.split('@')[0] : "username"} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground shadow-glow">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRegister ? "Create account" : "Sign in")}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => { setIsRegister(!isRegister); setPassword(""); }}>
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
