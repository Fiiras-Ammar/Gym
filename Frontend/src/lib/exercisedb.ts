// Free, open-source exercise database (873 exercises with images + instructions).
// Source: https://github.com/yuhonas/free-exercise-db
const DATA_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

type RawExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

export type ExerciseDBItem = {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  targetMuscles: string[];
  equipments: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  videoUrl?: string;
};

function normalizeExerciseItem(item: any): ExerciseDBItem {
  const exerciseId = String(item?.exerciseId ?? item?.id ?? "").trim();
  const name = String(item?.name ?? "").trim();
  const gifUrl = String(item?.gifUrl ?? item?.gif_url ?? "").trim();
  const videoUrlRaw = item?.videoUrl ?? item?.video_url;
  const videoUrl = typeof videoUrlRaw === "string" && videoUrlRaw.trim() ? videoUrlRaw.trim() : undefined;

  return {
    exerciseId,
    name,
    gifUrl,
    videoUrl,
    bodyParts: Array.isArray(item?.bodyParts) ? item.bodyParts : [],
    targetMuscles: Array.isArray(item?.targetMuscles) ? item.targetMuscles : [],
    equipments: Array.isArray(item?.equipments) ? item.equipments : [],
    secondaryMuscles: Array.isArray(item?.secondaryMuscles) ? item.secondaryMuscles : [],
    instructions: Array.isArray(item?.instructions) ? item.instructions : [],
  };
}

let cache: RawExercise[] | null = null;
let inflight: Promise<RawExercise[]> | null = null;

async function loadAll(): Promise<RawExercise[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(DATA_URL).then(async (res) => {
    if (!res.ok) throw new Error(`Exercise database unavailable (${res.status})`);
    cache = (await res.json()) as RawExercise[];
    return cache;
  }).finally(() => { inflight = null; });
  return inflight;
}

function toItem(r: RawExercise): ExerciseDBItem {
  return {
    exerciseId: r.id,
    name: r.name,
    gifUrl: r.images?.[0] ? `${IMG_BASE}${r.images[0]}` : "",
    bodyParts: [r.category].filter(Boolean),
    targetMuscles: r.primaryMuscles ?? [],
    equipments: r.equipment ? [r.equipment] : [],
    secondaryMuscles: r.secondaryMuscles ?? [],
    instructions: r.instructions ?? [],
  };
}

export async function searchExercises(query: string, limit = 25): Promise<ExerciseDBItem[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await fetch(`https://oss.exercisedb.dev/api/v1/exercises/search?search=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) throw new Error("Could not fetch exercises");
  const json = await res.json();
  const data = json.data || [];
  // Map the OSS response to our expected interface
  return data
    .map((item: any) => normalizeExerciseItem(item))
    .filter((item) => !!item.exerciseId && !!item.name);
}

export async function getExercise(id: string): Promise<ExerciseDBItem | null> {
  try {
    if (!id?.trim()) return null;
    const res = await fetch(`https://oss.exercisedb.dev/api/v1/exercises/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const item = json.data;
    if (!item) return null;
    const normalized = normalizeExerciseItem(item);
    return normalized.exerciseId ? normalized : null;
  } catch (error) {
    return null;
  }
}
