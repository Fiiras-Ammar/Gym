// Food lookup edge function
// - mode "barcode": queries Open Food Facts (no key required)
// - mode "name":    queries USDA FoodData Central (free key)
// Returns normalized macros per 100g.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USDA_KEY = Deno.env.get("USDA_API_KEY");

type Macros = {
  name: string;
  brand?: string;
  barcode?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: "g" | "ml";
  image_url?: string;
};

async function fetchOFF(host: string, barcode: string) {
  const url = `https://${host}/api/v2/product/${encodeURIComponent(barcode)}.json`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Gym/1.0" } });
    if (!r.ok) return null;
    const data = await r.json();
    if (data.status !== 1 || !data.product) return null;
    return data.product;
  } catch (e) {
    console.error(`OFF ${host} fetch failed:`, e);
    return null;
  }
}

async function lookupBarcode(barcode: string): Promise<Macros | null> {
  // Try world DB first, then regional mirrors with stronger discounter coverage
  // (Lidl, Aldi, Penny -> DE/AT; Auchan -> FR; Spar -> AT/IE; Tesco -> UK/IE)
  const hosts = [
    "world.openfoodfacts.org",
    "uk.openfoodfacts.org",
    "de.openfoodfacts.org",
    "fr.openfoodfacts.org",
    "at.openfoodfacts.org",
    "ie.openfoodfacts.org",
    "hu.openfoodfacts.org",
  ];
  let p: any = null;
  for (const h of hosts) {
    p = await fetchOFF(h, barcode);
    if (p) { console.log(`Found ${barcode} on ${h}`); break; }
  }
  if (!p) { console.log(`Not found on any OFF mirror: ${barcode}`); return null; }
  const n = p.nutriments ?? {};
  const cals = Number(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0)) || 0;
  return {
    name: p.product_name || p.generic_name || "Unknown product",
    brand: p.brands || undefined,
    barcode,
    calories: Math.round(cals * 10) / 10,
    protein: Number(n.proteins_100g ?? 0),
    carbs: Number(n.carbohydrates_100g ?? 0),
    fat: Number(n.fat_100g ?? 0),
    unit: (p.serving_quantity_unit === "ml" || /drink|juice|milk|water|soda/i.test(p.categories || "")) ? "ml" : "g",
    image_url: p.image_front_small_url || p.image_url || undefined,
  };
}

async function lookupName(name: string): Promise<Macros | null> {
  if (!USDA_KEY) throw new Error("USDA_API_KEY not configured");
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(name)}&pageSize=10`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const data = await r.json();
  const foods = data.foods ?? [];
  const preferred = foods.find((f: any) => f.dataType === "Foundation" || f.dataType === "SR Legacy");
  const food = preferred ?? foods[0];
  if (!food) return null;
  const get = (id: number) => Number(food.foodNutrients?.find((x: any) => x.nutrientId === id)?.value ?? 0);
  return {
    name: food.description,
    calories: get(1008), // Energy kcal
    protein: get(1003),
    carbs: get(1005),
    fat: get(1004),
    unit: "g",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { mode, query } = await req.json();
    if (!mode || !query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Provide { mode: 'barcode'|'name', query: string }" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleaned = query.trim().slice(0, 200);
    let result: Macros | null = null;
    if (mode === "barcode") result = await lookupBarcode(cleaned);
    else if (mode === "name") result = await lookupName(cleaned);
    else return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!result) {
      return new Response(JSON.stringify({ found: false }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ found: true, product: result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lookup-food error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
