// Shared types for the kitchen app
export type Product = {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: "g" | "ml";
  category: string | null;
  image_url: string | null;
  created_at: string;
};

export type ConsumptionLog = {
  id: string;
  product_id: string;
  amount: number;
  consumed_at: string;
  created_at: string;
};

export type LogWithProduct = ConsumptionLog & { products: Product };

export type Settings = {
  id: string;
  user_id: string;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
};

export type Macros = { calories: number; protein: number; carbs: number; fat: number };

export const sumMacros = (logs: LogWithProduct[]): Macros => {
  const total: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const l of logs) {
    if (!l.products) continue;
    const f = l.amount / 100;
    total.calories += Number(l.products.calories) * f;
    total.protein += Number(l.products.protein) * f;
    total.carbs += Number(l.products.carbs) * f;
    total.fat += Number(l.products.fat) * f;
  }
  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
  };
};
