import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from "@/lib/kitchen";
import { productsApi, logsApi } from "@/lib/api";
import { Search, Trash2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { EditProductDialog } from "@/components/EditProductDialog";

const Kitchen = () => {
  const [q, setQ] = useState("");
  const [eating, setEating] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [amount, setAmount] = useState("100");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const filtered = (products ?? []).filter((p) =>
    [p.name, p.brand ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const log = async () => {
    if (!eating) return;
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Enter a valid amount");
    try {
      await logsApi.create({ product_id: eating.id, amount: n });
      toast.success(`Logged ${n}${eating.unit} of ${eating.name}`);
      setEating(null);
      queryClient.invalidateQueries({ queryKey: ["logs", "today"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to log");
    }
  };

  const remove = async (id: string) => {
    try {
      await productsApi.delete(id);
      toast.success("Removed from kitchen");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to remove");
    }
  };

  return (
    <AppLayout title="Kitchen" subtitle="Tap a product to log it">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your kitchen…" className="pl-9" />
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{products?.length ? "No matches." : "Your kitchen is empty."}</p>
          <Button className="mt-3" onClick={() => navigate("/add")}>
            <Plus className="mr-1 h-4 w-4" /> Add a product
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
            <button className="flex flex-1 items-center gap-3 text-left" onClick={() => { setEating(p); setAmount("100"); }}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-lg">🥗</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.brand ? `${p.brand} · ` : ""}{p.calories} kcal / 100{p.unit}
                </p>
              </div>
            </button>
            <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label="Edit">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => remove(p.id)} aria-label="Remove">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={!!eating} onOpenChange={(o) => !o && setEating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How much did you eat?</DialogTitle>
          </DialogHeader>
          {eating && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">{eating.name}</p>
                <p className="text-muted-foreground">
                  Per 100{eating.unit}: {eating.calories} kcal · P {eating.protein}g · C {eating.carbs}g · F {eating.fat}g
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Amount ({eating.unit})</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
              </div>
              {Number(amount) > 0 && (
                <p className="text-sm text-muted-foreground">
                  = {Math.round((eating.calories * Number(amount)) / 100)} kcal
                </p>
              )}
              <Button className="w-full" onClick={log}>Log it</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditProductDialog product={editing} onClose={() => setEditing(null)} onSaved={() => queryClient.invalidateQueries({ queryKey: ["products"] })} />
    </AppLayout>
  );
};

export default Kitchen;
