-- Exercise categories (Push, Pull, Legs, Chest, etc.)
CREATE TABLE public.exercise_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workout days (e.g. "Monday - Push", "Leg Day")
CREATE TABLE public.workout_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  day_of_week SMALLINT,
  category_id UUID REFERENCES public.exercise_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exercises within a workout day (sourced from ExerciseDB)
CREATE TABLE public.workout_day_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_day_id UUID NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gif_url TEXT,
  body_part TEXT,
  target TEXT,
  equipment TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_day_exercises_day ON public.workout_day_exercises(workout_day_id);

-- Mark a workout day as done
CREATE TABLE public.workout_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_day_id UUID NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_completions_day ON public.workout_completions(workout_day_id);
CREATE INDEX idx_workout_completions_at ON public.workout_completions(completed_at DESC);

-- Bodyweight tracking
CREATE TABLE public.weight_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weight_kg NUMERIC(5,2) NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_weight_logs_at ON public.weight_logs(logged_at DESC);

-- Enable RLS and add open policies (matching existing app pattern: no auth)
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open access" ON public.exercise_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access" ON public.workout_days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access" ON public.workout_day_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access" ON public.workout_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access" ON public.weight_logs FOR ALL USING (true) WITH CHECK (true);

-- Seed a few common categories
INSERT INTO public.exercise_categories (name, color) VALUES
  ('Push', 'macro-protein'),
  ('Pull', 'macro-carbs'),
  ('Legs', 'macro-fat'),
  ('Full Body', 'primary');
