
-- Single-user app: no auth. Public read/write.
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT UNIQUE,
  -- macros per 100g (or per 100ml)
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'g', -- 'g' or 'ml'
  category TEXT, -- 'packaged' | 'produce' | 'custom'
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL, -- in grams or ml
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_logs_consumed_at ON public.consumption_logs(consumed_at DESC);

CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1,
  calorie_goal NUMERIC NOT NULL DEFAULT 2000,
  protein_goal NUMERIC NOT NULL DEFAULT 150,
  carbs_goal NUMERIC NOT NULL DEFAULT 250,
  fat_goal NUMERIC NOT NULL DEFAULT 65,
  CONSTRAINT singleton CHECK (id = 1)
);
INSERT INTO public.settings (id) VALUES (1);

-- Enable RLS with permissive policies (single-user, no auth)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_logs" ON public.consumption_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
