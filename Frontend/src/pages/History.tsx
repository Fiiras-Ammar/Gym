import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { LogWithProduct, Settings, sumMacros } from "@/lib/kitchen";
import { settingsApi, logsApi } from "@/lib/api";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { MacroBar } from "@/components/MacroBar";

const History = () => {
  const start = startOfDay(subDays(new Date(), 13));
  const end = endOfDay(new Date());

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });

  const { data: logs } = useQuery({
    queryKey: ["logs", "history"],
    queryFn: () => logsApi.list({
      from: start.toISOString(),
      to: end.toISOString()
    }),
  });

  // group by day
  const byDay = new Map<string, LogWithProduct[]>();
  (logs ?? []).forEach((l) => {
    const k = format(new Date(l.consumed_at), "yyyy-MM-dd");
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(l);
  });

  const days: { key: string; date: Date }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = subDays(new Date(), i);
    days.push({ key: format(d, "yyyy-MM-dd"), date: d });
  }

  return (
    <AppLayout title="History" subtitle="Last 14 days">
      <div className="space-y-3">
        {days.map(({ key, date }, idx) => {
          const dayLogs = byDay.get(key) ?? [];
          const t = sumMacros(dayLogs);
          const isToday = idx === 0;
          if (dayLogs.length === 0) {
            return (
              <div key={key} className="rounded-xl border border-dashed border-border bg-card/50 p-3 text-sm text-muted-foreground">
                {isToday ? "Today" : format(date, "EEE, MMM d")} — no entries
              </div>
            );
          }
          return (
            <details key={key} open={isToday} className="group rounded-xl border border-border bg-card p-4 shadow-soft">
              <summary className="flex cursor-pointer items-center justify-between gap-3 list-none">
                <div>
                  <p className="font-semibold">{isToday ? "Today" : format(date, "EEE, MMM d")}</p>
                  <p className="text-xs text-muted-foreground">{dayLogs.length} item{dayLogs.length !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-lg font-bold text-macro-calories tabular-nums">{t.calories} kcal</p>
              </summary>
              <div className="mt-4 space-y-3 border-t border-border pt-3">
                <MacroBar label="Protein" value={t.protein} goal={settings?.protein_goal} color="protein" />
                <MacroBar label="Carbs" value={t.carbs} goal={settings?.carbs_goal} color="carbs" />
                <MacroBar label="Fat" value={t.fat} goal={settings?.fat_goal} color="fat" />
                <ul className="mt-3 space-y-1 text-sm">
                  {dayLogs.map((l) => (
                    <li key={l.id} className="flex justify-between text-muted-foreground">
                      <span className="truncate">{l.products?.name} <span className="text-xs">({l.amount}{l.products?.unit})</span></span>
                      <span className="tabular-nums">{Math.round(Number(l.products?.calories) * (l.amount / 100))} kcal</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default History;
