import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number;
  goal?: number;
  unit?: string;
  color: "calories" | "protein" | "carbs" | "fat";
  className?: string;
};

const colorMap = {
  calories: "bg-macro-calories",
  protein: "bg-macro-protein",
  carbs: "bg-macro-carbs",
  fat: "bg-macro-fat",
};

const textMap = {
  calories: "text-macro-calories",
  protein: "text-macro-protein",
  carbs: "text-macro-carbs",
  fat: "text-macro-fat",
};

export const MacroBar = ({ label, value, goal, unit = "g", color, className }: Props) => {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          <span className={cn("font-semibold", textMap[color])}>{value}</span>
          {goal ? <> / {goal}</> : null} {unit}
        </span>
      </div>
      {goal ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-500", colorMap[color])}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
};
