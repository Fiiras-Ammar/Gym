import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { Loader2, Trash2, UserPlus, Shield } from "lucide-react";
import { format } from "date-fns";

type AdminUser = {
  id: string; email: string; created_at: string;
  display_name: string | null; is_admin: boolean;
};

const Admin = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", display_name: "", is_admin: false });

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/users/");
      setUsers(data.users ?? []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    if (!form.email || !form.password) return toast.error("Email and password required");
    setCreating(true);
    try {
      await apiRequest("/admin/users/", {
        method: "POST",
        body: JSON.stringify({ action: "create", ...form }),
      });
      setForm({ email: "", password: "", display_name: "", is_admin: false });
      toast.success("User created");
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this user and all their data?")) return;
    try {
      await apiRequest("/admin/users/", {
        method: "POST",
        body: JSON.stringify({ action: "delete", user_id: id }),
      });
      toast.success("User deleted");
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  return (
    <AppLayout title="User management" subtitle="Create and manage accounts">
      <section className="mb-5 space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4" /> Create user</h2>
        <div className="space-y-2">
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Temporary password</Label>
            <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Display name (optional)</Label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="mt-1" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <Label htmlFor="adm">Make admin</Label>
            </div>
            <Switch id="adm" checked={form.is_admin} onCheckedChange={(v) => setForm({ ...form, is_admin: v })} />
          </div>
          <Button className="w-full" onClick={create} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create user"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">All users</h2>
        {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{u.display_name || u.email}</p>
                  {u.is_admin && <Badge variant="secondary" className="text-[10px]"><Shield className="mr-1 h-3 w-3" />Admin</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{u.email} · {format(new Date(u.created_at), "MMM d, yyyy")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(u.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
};

export default Admin;
