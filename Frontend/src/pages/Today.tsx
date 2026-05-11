import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { MacroBar } from "@/components/MacroBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogWithProduct, Product, Settings, sumMacros } from "@/lib/kitchen";
import { settingsApi, logsApi, productsApi, type ConsumptionLog } from "@/lib/api";
import { format } from "date-fns";
import { Trash2, Flame, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const Today = () => {
  const today = new Date();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ConsumptionLog | null>(null);
  const [editAmt, setEditAmt] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [logging, setLogging] = useState<Product | null>(null);
  const [logAmt, setLogAmt] = useState("100");

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });

  const { data: logs, refetch } = useQuery({
    queryKey: ["logs", "today"],
    queryFn: logsApi.today,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const filteredProducts = (products ?? []).filter((p) =>
    [p.name, p.brand ?? ""].join(" ").toLowerCase().includes(pickerQ.toLowerCase())
  );

  const totals = sumMacros(logs ?? []);

  const logFromKitchen = async () => {
    if (!logging) return;
    const n = Number(logAmt);
    if (!n || n <= 0) return toast.error("Enter a valid amount");
    try {
      await logsApi.create({ product_id: logging.id, amount: n });
      toast.success(`Logged ${n}${logging.unit} of ${logging.name}`);
      setLogging(null);
      setPickerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["logs", "today"] });
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to log");
    }
  };

  const remove = async (id: string) => {
    try {
      await logsApi.delete(id);
      toast.success("Removed");
      await queryClient.invalidateQueries({ queryKey: ["logs", "today"] });
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove");
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    const n = Number(editAmt);
    if (!n || n <= 0) return toast.error("Invalid amount");
    try {
      await logsApi.update(editing.id, { amount: n });
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["logs", "today"] });
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    }
  };

  return (
    <AppLayout title="Today" subtitle={format(today, "EEEE, MMM d")}>
      <section className="mb-5 rounded-2xl gradient-hero p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center gap-3">
          <Flame className="h-7 w-7" />
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">Calories</p>
            <p className="text-3xl font-bold tabular-nums">
              {totals.calories}
              <span className="text-base font-normal opacity-80"> / {settings?.calorie_goal ?? 2000} kcal</span>
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full rounded-full bg-primary-foreground transition-all duration-500"
            style={{ width: `${Math.min(100, (totals.calories / (settings?.calorie_goal ?? 2000)) * 100)}%` }}
          />
        </div>
      </section>

      <section className="mb-5 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <MacroBar label="Protein" value={totals.protein} goal={settings?.protein_goal} color="protein" />
        <MacroBar label="Carbs" value={totals.carbs} goal={settings?.carbs_goal} color="carbs" />
        <MacroBar label="Fat" value={totals.fat} goal={settings?.fat_goal} color="fat" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">What you ate</h2>
          <Button size="sm" onClick={() => { setPickerOpen(true); setPickerQ(""); }}>
            <Plus className="mr-1 h-4 w-4" /> Log meal
          </Button>
        </div>
        {logs && logs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nothing logged yet today. Tap "Log meal" to pick from your kitchen.
          </div>
        )}
        <ul className="space-y-2">
          {logs?.map((l: LogWithProduct) => {
            const f = l.amount / 100;
            const product = l.products;
            return (
              <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
                <button className="flex-1 text-left" onClick={() => { setEditing(l); setEditAmt(String(l.amount)); }}>
                  <p className="font-medium text-foreground">{product?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.amount}{product?.unit} · {Math.round(Number(product?.calories || 0) * f)} kcal · {format(new Date(l.consumed_at), "HH:mm")}
                  </p>
                </button>
                <Button variant="ghost" size="icon" onClick={() => remove(l.id)} aria-label="Remove">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{editing?.products?.name}</p>
            <Input type="number" value={editAmt} onChange={(e) => setEditAmt(e.target.value)} />
            <Button className="w-full" onClick={saveEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pick from your kitchen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={pickerQ} onChange={(e) => setPickerQ(e.target.value)} placeholder="Search…" className="pl-9" autoFocus />
            </div>
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {filteredProducts.length === 0 && (
                <li className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  {products?.length ? "No matches." : "Your kitchen is empty."}
                </li>
              )}
              {filteredProducts.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => { setLogging(p); setLogAmt("100"); }}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left hover:bg-accent"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">🥗</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.calories} kcal / 100{p.unit}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!logging} onOpenChange={(o) => !o && setLogging(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How much did you eat?</DialogTitle>
          </DialogHeader>
          {logging && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">{logging.name}</p>
                <p className="text-muted-foreground">
                  Per 100{logging.unit}: {logging.calories} kcal · P {logging.protein}g · C {logging.carbs}g · F {logging.fat}g
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Amount ({logging.unit})</label>
                <Input type="number" value={logAmt} onChange={(e) => setLogAmt(e.target.value)} autoFocus />
              </div>
              {Number(logAmt) > 0 && (
                <p className="text-sm text-muted-foreground">
                  = {Math.round((logging.calories * Number(logAmt)) / 100)} kcal
                </p>
              )}
              <Button className="w-full" onClick={logFromKitchen}>Log it</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Today;
