import { useState } from "react";
import { productsApi, apiRequest } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles, Barcode, Apple, PencilLine, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarcodeScanner } from "@/components/BarcodeScanner";

type LookupResult = {
  name: string; brand?: string; barcode?: string;
  calories: number; protein: number; carbs: number; fat: number;
  unit: "g" | "ml"; image_url?: string;
};

const Add = () => {
  const navigate = useNavigate();

  // Barcode tab
  const [barcode, setBarcode] = useState("");
  const [bcLoading, setBcLoading] = useState(false);
  const [bcResult, setBcResult] = useState<LookupResult | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Produce tab
  const [produce, setProduce] = useState("");
  const [pLoading, setPLoading] = useState(false);
  const [pResult, setPResult] = useState<LookupResult | null>(null);

  // Custom tab
  const [custom, setCustom] = useState({ name: "", brand: "", calories: "", protein: "", carbs: "", fat: "", unit: "g" as "g" | "ml" });

  const lookup = async (mode: "barcode" | "name", query: string) => {
    const data = await apiRequest(`/food-lookup/?mode=${mode}&query=${encodeURIComponent(query)}`);
    if (!data?.found) return null;
    return data.product as LookupResult;
  };

  const runBarcodeLookup = async (code: string) => {
    setBcLoading(true); setBcResult(null);
    try {
      const r = await lookup("barcode", code);
      if (!r) {
        toast.error("Not in Open Food Facts yet", {
          description: "This product isn't in the community database. Switch to the Custom tab — we've pre-filled the barcode for you.",
          duration: 6000,
        });
        setCustom((c) => ({ ...c, name: c.name || `Product ${code}` }));
      } else { setBcResult(r); toast.success(`Found: ${r.name}`); }
    } catch (e: any) { toast.error(e.message); }
    finally { setBcLoading(false); }
  };

  const scanBarcode = () => {
    if (!barcode.trim()) return;
    runBarcodeLookup(barcode.trim());
  };

  const handleScanned = (code: string) => {
    setScannerOpen(false);
    setBarcode(code);
    runBarcodeLookup(code);
  };

  const lookupProduce = async () => {
    if (!produce.trim()) return;
    setPLoading(true); setPResult(null);
    try {
      const r = await lookup("name", produce.trim());
      if (!r) toast.error("Not found in USDA database");
      else setPResult(r);
    } catch (e: any) { toast.error(e.message); }
    finally { setPLoading(false); }
  };

  const saveProduct = async (p: LookupResult, category: string) => {
    try {
      await productsApi.create({
        name: p.name,
        brand: p.brand ?? null,
        barcode: p.barcode ?? null,
        calories: p.calories,
        protein: p.protein,
        carbs: p.carbs,
        fat: p.fat,
        unit: p.unit,
        category,
        image_url: p.image_url ?? null,
      });
      toast.success(`Added ${p.name} to kitchen`);
      navigate("/kitchen");
    } catch (error: any) {
      if (error.message?.includes("unique")) toast.error("Already in your kitchen");
      else toast.error(error.message || "Failed to save product");
    }
  };

  const saveCustom = async () => {
    if (!custom.name.trim()) return toast.error("Name required");
    const num = (s: string) => Number(s) || 0;
    await saveProduct({
      name: custom.name.trim(), brand: custom.brand.trim() || undefined,
      calories: num(custom.calories), protein: num(custom.protein), carbs: num(custom.carbs), fat: num(custom.fat),
      unit: custom.unit,
    }, "custom");
  };

  const Preview = ({ p, onSave }: { p: LookupResult; onSave: () => void }) => (
    <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex gap-3">
        {p.image_url && <img src={p.image_url} alt={p.name} className="h-16 w-16 rounded-lg object-cover" />}
        <div className="flex-1">
          <p className="font-semibold">{p.name}</p>
          {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg bg-macro-calories/10 p-2"><p className="font-bold text-macro-calories">{p.calories}</p><p className="text-muted-foreground">kcal</p></div>
        <div className="rounded-lg bg-macro-protein/10 p-2"><p className="font-bold text-macro-protein">{p.protein}g</p><p className="text-muted-foreground">protein</p></div>
        <div className="rounded-lg bg-macro-carbs/10 p-2"><p className="font-bold text-macro-carbs">{p.carbs}g</p><p className="text-muted-foreground">carbs</p></div>
        <div className="rounded-lg bg-macro-fat/10 p-2"><p className="font-bold text-macro-fat">{p.fat}g</p><p className="text-muted-foreground">fat</p></div>
      </div>
      <p className="text-center text-xs text-muted-foreground">per 100{p.unit}</p>
      <Button className="w-full" onClick={onSave}>Add to kitchen</Button>
    </div>
  );

  return (
    <AppLayout title="Add product" subtitle="Three ways to stock your kitchen">
      <Tabs defaultValue="barcode" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="barcode"><Barcode className="mr-1 h-4 w-4" />Barcode</TabsTrigger>
          <TabsTrigger value="produce"><Apple className="mr-1 h-4 w-4" />Produce</TabsTrigger>
          <TabsTrigger value="custom"><PencilLine className="mr-1 h-4 w-4" />Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="barcode" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Scan with your camera, or type the barcode from the package. Macros come from Open Food Facts.</p>
          <Button className="w-full gradient-hero text-primary-foreground shadow-glow" onClick={() => setScannerOpen(true)}>
            <Camera className="mr-2 h-4 w-4" /> Scan with camera
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or type it</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex gap-2">
            <Input inputMode="numeric" placeholder="e.g. 3017620422003" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            <Button onClick={scanBarcode} disabled={bcLoading}>
              {bcLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
            </Button>
          </div>
          {bcResult && <Preview p={bcResult} onSave={() => saveProduct(bcResult, "packaged")} />}
          <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleScanned} />
        </TabsContent>

        <TabsContent value="produce" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Just type the fruit or vegetable. Macros come from the USDA database automatically.</p>
          <div className="flex gap-2">
            <Input placeholder="e.g. banana, broccoli, apple" value={produce} onChange={(e) => setProduce(e.target.value)} />
            <Button onClick={lookupProduce} disabled={pLoading}>
              {pLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" />Find</>}
            </Button>
          </div>
          {pResult && <Preview p={pResult} onSave={() => saveProduct(pResult, "produce")} />}
        </TabsContent>

        <TabsContent value="custom" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Enter macros manually (per 100g or 100ml).</p>
          <Input placeholder="Name *" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
          <Input placeholder="Brand (optional)" value={custom.brand} onChange={(e) => setCustom({ ...custom, brand: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Calories" value={custom.calories} onChange={(e) => setCustom({ ...custom, calories: e.target.value })} />
            <Input type="number" placeholder="Protein (g)" value={custom.protein} onChange={(e) => setCustom({ ...custom, protein: e.target.value })} />
            <Input type="number" placeholder="Carbs (g)" value={custom.carbs} onChange={(e) => setCustom({ ...custom, carbs: e.target.value })} />
            <Input type="number" placeholder="Fat (g)" value={custom.fat} onChange={(e) => setCustom({ ...custom, fat: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant={custom.unit === "g" ? "default" : "outline"} className="flex-1" onClick={() => setCustom({ ...custom, unit: "g" })}>per 100g</Button>
            <Button variant={custom.unit === "ml" ? "default" : "outline"} className="flex-1" onClick={() => setCustom({ ...custom, unit: "ml" })}>per 100ml</Button>
          </div>
          <Button className="w-full" onClick={saveCustom}>Add to kitchen</Button>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Add;
