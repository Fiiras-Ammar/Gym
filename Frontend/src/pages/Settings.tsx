import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings as TSettings } from "@/lib/kitchen";
import { settingsApi } from "@/lib/api";
import { toast } from "sonner";

const Field = ({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix: string }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium">{label}</span>
    <div className="relative">
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
    </div>
  </label>
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const [s, setS] = useState<TSettings | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsApi.get();
        setS(data as TSettings);
      } catch (error) {
        toast.error("Failed to load settings");
      }
    })();
  }, []);

  const save = async () => {
    if (!s) return;
    try {
      await settingsApi.update(s.id, {
        calorie_goal: Number(s.calorie_goal) || 0,
        protein_goal: Number(s.protein_goal) || 0,
        carbs_goal: Number(s.carbs_goal) || 0,
        fat_goal: Number(s.fat_goal) || 0,
      });
      toast.success("Goals updated");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    }
  };

  if (!s) return <AppLayout title="Daily goals"><p className="text-muted-foreground">Loading…</p></AppLayout>;

  return (
    <AppLayout title="Daily goals" subtitle="Your macro targets">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <Field label="Calories" value={s.calorie_goal} onChange={(n) => setS({ ...s, calorie_goal: n })} suffix="kcal" />
        <Field label="Protein" value={s.protein_goal} onChange={(n) => setS({ ...s, protein_goal: n })} suffix="g" />
        <Field label="Carbs" value={s.carbs_goal} onChange={(n) => setS({ ...s, carbs_goal: n })} suffix="g" />
        <Field label="Fat" value={s.fat_goal} onChange={(n) => setS({ ...s, fat_goal: n })} suffix="g" />
        <Button className="w-full" onClick={save}>Save goals</Button>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
