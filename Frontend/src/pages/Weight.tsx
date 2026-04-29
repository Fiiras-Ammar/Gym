import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { weightApi } from "@/lib/api";
import { Trash2, Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { format } from "date-fns";

import type { WeightLog } from "@/lib/api";

const Weight = () => {
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const { data: logs } = useQuery({
    queryKey: ["weight_logs"],
    queryFn: weightApi.list,
  });

  const add = async () => {
    const n = Number(weight);
    if (!n || n <= 0) return toast.error("Enter a valid weight");
    try {
      await weightApi.create({ weight_kg: n, note: note.trim() || undefined });
      setWeight(""); setNote("");
      toast.success(`Logged ${n} kg`);
      queryClient.invalidateQueries({ queryKey: ["weight_logs"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to log weight");
    }
  };

  const remove = async (id: string) => {
    try {
      await weightApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["weight_logs"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to remove");
    }
  };

  const latest = logs?.[0];
  const previous = logs?.[1];
  const diff = latest && previous ? Number(latest.weight_kg) - Number(previous.weight_kg) : 0;

  return (
    <AppLayout title="Weight" subtitle="Track your bodyweight">
      <section className="mb-5 rounded-2xl gradient-hero p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center gap-3">
          <Scale className="h-7 w-7" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide opacity-80">Latest</p>
            <p className="text-3xl font-bold tabular-nums">
              {latest ? `${Number(latest.weight_kg).toFixed(1)}` : "—"}
              <span className="text-base font-normal opacity-80"> kg</span>
            </p>
          </div>
          {latest && previous && (
            <div className="flex items-center gap-1 rounded-lg bg-primary-foreground/20 px-2 py-1 text-sm">
              {diff > 0 ? <TrendingUp className="h-4 w-4" /> : diff < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              <span className="tabular-nums">{diff > 0 ? "+" : ""}{diff.toFixed(1)} kg</span>
            </div>
          )}
        </div>
      </section>

      <section className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <h2 className="text-sm font-semibold">Log new entry</h2>
        <div className="flex gap-2">
          <Input type="number" step="0.1" inputMode="decimal" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <Button onClick={add}>Add</Button>
        </div>
        <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
        {logs && logs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No entries yet. Add your first weight above.
          </div>
        )}
        <ul className="space-y-2">
          {logs?.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
              <div className="min-w-0 flex-1">
                <p className="font-semibold tabular-nums">{Number(l.weight_kg).toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(l.logged_at), "MMM d, yyyy · HH:mm")}{l.note ? ` · ${l.note}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(l.id)} aria-label="Remove">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
};

export default Weight;
