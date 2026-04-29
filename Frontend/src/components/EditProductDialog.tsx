import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import type { Product } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, ImageOff } from "lucide-react";

type Props = {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

interface FormState {
  name: string;
  brand: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  unit: "g" | "ml";
  image_url: string | null | "";
}

export const EditProductDialog = ({ product, onClose, onSaved }: Props) => {
  const [form, setForm] = useState<FormState>({
    name: "", brand: "", calories: "", protein: "", carbs: "", fat: "",
    unit: "g", image_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name,
      brand: product.brand ?? "",
      calories: String(product.calories),
      protein: String(product.protein),
      carbs: String(product.carbs),
      fat: String(product.fat),
      unit: (product.unit as "g" | "ml") ?? "g",
      image_url: product.image_url ?? "",
    });
  }, [product]);

  const handleUpload = async (file: File) => {
    if (!product) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploading(true);
    try {
      // Upload via Django API
      const data = await productsApi.uploadImage(product.id, file);
      setForm((f) => ({ ...f, image_url: data.image_url }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!product) return;
    if (!form.name.trim()) return toast.error("Name required");
    setSaving(true);
    const num = (s: string) => Number(s) || 0;
    try {
      await productsApi.update(product.id, {
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        calories: num(form.calories),
        protein: num(form.protein),
        carbs: num(form.carbs),
        fat: num(form.fat),
        unit: form.unit,
        image_url: form.image_url || null,
      });
      toast.success("Product updated");
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
        </DialogHeader>
        {product && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {form.image_url ? (
                <img src={form.image_url} alt={form.name} className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Label htmlFor="img" className="block">Product image</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById("img-upload")?.click()}
                  >
                    {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                    Upload
                  </Button>
                  {form.image_url && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, image_url: "" }))}>
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  id="img-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Macros per 100{form.unit}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-macro-calories">Calories</Label>
                  <Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-macro-protein">Protein (g)</Label>
                  <Input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-macro-carbs">Carbs (g)</Label>
                  <Input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-macro-fat">Fat (g)</Label>
                  <Input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant={form.unit === "g" ? "default" : "outline"} className="flex-1" onClick={() => setForm({ ...form, unit: "g" })}>per 100g</Button>
              <Button variant={form.unit === "ml" ? "default" : "outline"} className="flex-1" onClick={() => setForm({ ...form, unit: "ml" })}>per 100ml</Button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={save} disabled={saving || uploading}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
