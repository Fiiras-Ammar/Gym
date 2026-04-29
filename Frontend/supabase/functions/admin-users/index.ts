import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, service);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json();

    if (body.action === "list") {
      const { data: list, error } = await admin.auth.admin.listUsers();
      if (error) throw error;
      const ids = list.users.map((u) => u.id);
      const [{ data: profiles }, { data: allRoles }] = await Promise.all([
        admin.from("profiles").select("user_id, display_name").in("user_id", ids),
        admin.from("user_roles").select("user_id, role").in("user_id", ids),
      ]);
      const users = list.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
        display_name: profiles?.find((p: any) => p.user_id === u.id)?.display_name ?? null,
        is_admin: !!allRoles?.some((r: any) => r.user_id === u.id && r.role === "admin"),
      }));
      return json({ users });
    }

    if (body.action === "create") {
      const { email, password, display_name, is_admin } = body;
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: display_name ? { display_name } : undefined,
      });
      if (error) throw error;
      if (is_admin && data.user) {
        await admin.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
      }
      return json({ user: data.user });
    }

    if (body.action === "delete") {
      if (body.user_id === user.id) return json({ error: "You can't delete yourself" }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return json({ error: e.message ?? String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
