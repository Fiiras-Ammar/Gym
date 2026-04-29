import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Search, Loader2, Dumbbell, CheckCircle2, BookOpen, X } from "lucide-react";
import {
  categoriesApi,
  workoutDaysApi,
  workoutExercisesApi,
  completionsApi,
  exerciseDbApi,
  type ExerciseCategory,
  type WorkoutDay,
  type WorkoutDayExercise,
  type ExerciseDBItem,
} from "@/lib/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Workouts = () => {
  const [tab, setTab] = useState("days");
  const queryClient = useQueryClient();

  // Categories
  const [newCat, setNewCat] = useState("");
  const { data: categories } = useQuery({
    queryKey: ["exercise_categories"],
    queryFn: categoriesApi.list,
  });

  // Workout days
  const [creatingDay, setCreatingDay] = useState(false);
  const [newDay, setNewDay] = useState({ name: "", day_of_week: "none" as string, category_id: "none" as string });
  const { data: days } = useQuery({
    queryKey: ["workout_days"],
    queryFn: workoutDaysApi.list,
  });

  // Day detail
  const [openDay, setOpenDay] = useState<WorkoutDay | null>(null);
  const { data: dayExercises } = useQuery({
    queryKey: ["workout_day_exercises", openDay?.id],
    enabled: !!openDay,
    queryFn: () => workoutExercisesApi.list(openDay!.id),
  });

  // Exercise search
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ExerciseDBItem[]>([]);
  const [tutorial, setTutorial] = useState<ExerciseDBItem | null>(null);

  const runSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const r = await exerciseDbApi.search(searchQ.trim());
      // Enrich top results with detail endpoint so we can pick up video/instructions when available.
      const results = Array.isArray(r) ? r : r.results || [];
      const top = results.slice(0, 10);
      const enrichedTop = await Promise.all(
        top.map(async (item) => {
          const full = await exerciseDbApi.get(item.exerciseId);
          if (!full) return item;
          return {
            ...item,
            ...full,
            // Keep the original search name if detail name is unexpectedly missing.
            name: full.name || item.name,
          };
        }),
      );
      setSearchResults([...enrichedTop, ...results.slice(10)]);
      if (results.length === 0) toast.info("No exercises found");
    } catch (e: any) { toast.error(e.message); }
    finally { setSearching(false); }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await categoriesApi.create({ name: newCat.trim() });
      setNewCat("");
      queryClient.invalidateQueries({ queryKey: ["exercise_categories"] });
      toast.success("Category added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add category");
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await categoriesApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["exercise_categories"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to remove category");
    }
  };

  const createDay = async () => {
    if (!newDay.name.trim()) return toast.error("Name required");
    try {
      await workoutDaysApi.create({
        name: newDay.name.trim(),
        day_of_week: newDay.day_of_week === "none" ? null : Number(newDay.day_of_week),
        category_id: newDay.category_id === "none" ? null : newDay.category_id,
      });
      setCreatingDay(false);
      setNewDay({ name: "", day_of_week: "none", category_id: "none" });
      queryClient.invalidateQueries({ queryKey: ["workout_days"] });
      toast.success("Workout day created");
    } catch (error: any) {
      toast.error(error.message || "Failed to create day");
    }
  };

  const removeDay = async (id: string) => {
    try {
      await workoutDaysApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["workout_days"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to remove day");
    }
  };

  const addExerciseToDay = async (ex: ExerciseDBItem) => {
    if (!openDay) return;
    if (!ex.exerciseId) return toast.error("This exercise is missing an ID. Try searching again.");
    if (!ex.name) return toast.error("This exercise is missing a name. Try another result.");
    const position = (dayExercises?.length ?? 0);
    try {
      await workoutExercisesApi.create({
        workout_day_id: openDay.id,
        exercise_id: ex.exerciseId,
        name: ex.name,
        gif_url: ex.gifUrl || null,
        video_url: ex.videoUrl ?? null,
        body_part: ex.bodyParts?.[0] ?? null,
        target: ex.targetMuscles?.[0] ?? null,
        equipment: ex.equipments?.[0] ?? null,
        position,
      });
      queryClient.invalidateQueries({ queryKey: ["workout_day_exercises", openDay.id] });
      toast.success(`Added ${ex.name}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add exercise");
    }
  };

  const removeDayExercise = async (id: string) => {
    try {
      await workoutExercisesApi.delete(id);
      if (openDay) {
        queryClient.invalidateQueries({ queryKey: ["workout_day_exercises", openDay.id] });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove exercise");
    }
  };

  const completeWorkout = async () => {
    if (!openDay) return;
    try {
      await completionsApi.create({ workout_day_id: openDay.id });
      toast.success(`${openDay.name} marked as done 💪`);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete workout");
    }
  };

  return (
    <AppLayout title="Workouts" subtitle="Build your gym week">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="days"><Dumbbell className="mr-1 h-4 w-4" />My Days</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="days" className="mt-4 space-y-3">
          <Button className="w-full gradient-hero text-primary-foreground shadow-glow" onClick={() => setCreatingDay(true)}>
            <Plus className="mr-1 h-4 w-4" /> New workout day
          </Button>

          {(!days || days.length === 0) && (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No workout days yet. Create one to start building your split.
            </div>
          )}

          <ul className="space-y-2">
            {days?.map((d) => {
              const cat = categories?.find((c) => c.id === d.category_id);
              return (
                <li key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
                  <button className="flex flex-1 items-center gap-3 text-left" onClick={() => setOpenDay(d)}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                      <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{d.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {d.day_of_week !== null && <Badge variant="secondary" className="text-[10px]">{DAYS[d.day_of_week]}</Badge>}
                        {cat && <Badge variant="outline" className="text-[10px]">{cat.name}</Badge>}
                      </div>
                    </div>
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => removeDay(d.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Group your workout days (Push, Pull, Legs, Chest…).</p>
          <div className="flex gap-2">
            <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Chest" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
            <Button onClick={addCategory}><Plus className="h-4 w-4" /></Button>
          </div>
          <ul className="space-y-2">
            {categories?.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-soft">
                <span className="font-medium">{c.name}</span>
                <Button variant="ghost" size="icon" onClick={() => removeCategory(c.id)} aria-label="Remove">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      {/* Create day dialog */}
      <Dialog open={creatingDay} onOpenChange={setCreatingDay}>
        <DialogContent>
          <DialogHeader><DialogTitle>New workout day</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name (e.g. Push Day)" value={newDay.name} onChange={(e) => setNewDay({ ...newDay, name: e.target.value })} autoFocus />
            <Select value={newDay.day_of_week} onValueChange={(v) => setNewDay({ ...newDay, day_of_week: v })}>
              <SelectTrigger><SelectValue placeholder="Day of week (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific day</SelectItem>
                {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={newDay.category_id} onValueChange={(v) => setNewDay({ ...newDay, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Category (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={createDay}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day detail dialog */}
      <Dialog open={!!openDay} onOpenChange={(o) => { if (!o) { setOpenDay(null); setSearchResults([]); setSearchQ(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{openDay?.name}</DialogTitle></DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exercises</h3>
              {(!dayExercises || dayExercises.length === 0) && (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  No exercises yet. Search below to add some.
                </p>
              )}
              <ul className="space-y-2">
                {dayExercises?.map((ex) => (
                  <li key={ex.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                    {ex.video_url ? (
                      <video src={ex.video_url} autoPlay loop muted playsInline className="h-12 w-12 rounded-md object-cover" />
                    ) : ex.gif_url ? (
                      <img src={ex.gif_url} alt={ex.name} className="h-12 w-12 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary"><Dumbbell className="h-5 w-5" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium capitalize">{ex.name}</p>
                      <p className="truncate text-xs text-muted-foreground capitalize">{ex.target} · {ex.equipment}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={async () => {
                      const full = await exerciseDbApi.get(ex.exercise_id);
                      if (full) {
                        setTutorial(full);
                        return;
                      }
                      // Fallback to stored row data when API detail lookup fails.
                      setTutorial({
                        exerciseId: ex.exercise_id,
                        name: ex.name,
                        gifUrl: ex.gif_url ?? "",
                        videoUrl: ex.video_url ?? undefined,
                        bodyParts: ex.body_part ? [ex.body_part] : [],
                        targetMuscles: ex.target ? [ex.target] : [],
                        equipments: ex.equipment ? [ex.equipment] : [],
                        secondaryMuscles: [],
                        instructions: [],
                      });
                    }} aria-label="Tutorial">
                      <BookOpen className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeDayExercise(ex.id)} aria-label="Remove">
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add exercise</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="bench press, squat…" className="pl-9" />
                </div>
                <Button onClick={runSearch} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
              <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {searchResults.map((r) => (
                  <li key={r.exerciseId} className="flex items-center gap-3 rounded-lg border border-border p-2">
                    {r.videoUrl ? (
                      <video src={r.videoUrl} autoPlay loop muted playsInline className="h-12 w-12 rounded-md object-cover" />
                    ) : r.gifUrl ? (
                      <img src={r.gifUrl} alt={r.name} className="h-12 w-12 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary"><Dumbbell className="h-5 w-5" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium capitalize">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground capitalize">{r.targetMuscles?.[0]} · {r.equipments?.[0]}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setTutorial(r)} aria-label="Tutorial"><BookOpen className="h-4 w-4" /></Button>
                    <Button size="icon" onClick={() => addExerciseToDay(r)} aria-label="Add"><Plus className="h-4 w-4" /></Button>
                  </li>
                ))}
              </ul>
            </div>

            <Button className="w-full gradient-hero text-primary-foreground" onClick={completeWorkout}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark workout as done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tutorial dialog */}
      <Dialog open={!!tutorial} onOpenChange={(o) => !o && setTutorial(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="capitalize">{tutorial?.name}</DialogTitle></DialogHeader>
          {tutorial && (
            <div className="space-y-3">
              {tutorial.videoUrl ? (
                <video src={tutorial.videoUrl} autoPlay loop muted playsInline controls className="w-full rounded-lg" />
              ) : tutorial.gifUrl ? (
                <img src={tutorial.gifUrl} alt={tutorial.name} className="w-full rounded-lg" />
              ) : null}
              <div className="flex flex-wrap gap-1">
                {tutorial.targetMuscles?.map((m) => <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>)}
                {tutorial.equipments?.map((m) => <Badge key={m} variant="outline" className="capitalize">{m}</Badge>)}
              </div>
              {tutorial.instructions && tutorial.instructions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">How to do it</h4>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                    {tutorial.instructions.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Workouts;
