import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, generateSku } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
});

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  category_id: string | null;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  categories?: { name: string } | null;
}

function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const filtered = (products ?? []).filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === "all" || p.category_id === catFilter;
    return matchesSearch && matchesCat;
  });

  const totalValue = (products ?? []).reduce((s, p) => s + Number(p.price) * p.stock, 0);
  const outOfStock = (products ?? []).filter((p) => p.stock === 0).length;

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produk dihapus");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleEdit = (p: Product) => {
    setEditing(p);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin hapus produk ini?")) {
      deleteMut.mutate(id);
    }
  };

  return (
    <AppShell title="Produk">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Kelola katalog produk Kopi Nako</p>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4 mr-1" /> Tambah Produk
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Nilai Inventory</p>
          <p className="text-lg font-bold">{formatRupiah(totalValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Habis Stok</p>
          <p className="text-lg font-bold text-destructive">{outOfStock}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Produk</p>
          <p className="text-lg font-bold">{products?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Kategori</p>
          <p className="text-lg font-bold">{categories?.length ?? 0}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {(categories ?? []).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left p-3">Produk</th>
                <th className="text-left p-3">Kategori</th>
                <th className="text-right p-3">Harga</th>
                <th className="text-right p-3">Stok</th>
                <th className="text-left p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">Tidak ada produk</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-accent overflow-hidden flex items-center justify-center text-xs text-accent-foreground shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                          ) : (
                            p.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.categories?.name ?? "-"}</td>
                    <td className="p-3 text-right font-medium">{formatRupiah(Number(p.price))}</td>
                    <td className="p-3 text-right">
                      <span className={p.stock === 0 ? "text-destructive font-bold" : p.stock <= p.min_stock ? "text-amber-500 font-semibold" : ""}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleEdit(p)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p.id)}
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ProductDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
        categories={categories ?? []}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["products"] });
          setOpen(false);
          setEditing(null);
        }}
      />
    </AppShell>
  );
}

function ProductDialog({
  open, onOpenChange, editing, categories, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Product | null;
  categories: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState<string>("0");
  const [cost, setCost] = useState<string>("0");
  const [stock, setStock] = useState<string>("0");
  const [minStock, setMinStock] = useState<string>("5");
  const [unit, setUnit] = useState("pcs");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens/closes or editing changes
  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setSku(editing.sku);
        setBarcode(editing.barcode ?? "");
        setDescription(editing.description ?? "");
        setCategoryId(editing.category_id ?? "");
        setPrice(String(editing.price));
        setCost(String(editing.cost));
        setStock(String(editing.stock));
        setMinStock(String(editing.min_stock));
        setUnit(editing.unit);
        setIsActive(editing.is_active);
        setImageUrl(editing.image_url);
        setImage(null);
      } else {
        setName(""); setSku(""); setBarcode(""); setDescription("");
        setCategoryId(""); setPrice("0"); setCost("0"); setStock("0");
        setMinStock("5"); setUnit("pcs"); setIsActive(true); setImage(null); setImageUrl(null);
      }
    }
  }, [open, editing]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nama produk wajib diisi"); return; }
    setSaving(true);
    try {
      let finalImageUrl = imageUrl;
      if (image) {
        const path = `${Date.now()}-${image.name.replace(/\s+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, image, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        finalImageUrl = pub.publicUrl;
      }

      const payload = {
        name: name.trim(),
        sku: sku.trim() || generateSku(name),
        barcode: barcode.trim() || null,
        description: description.trim() || null,
        category_id: categoryId || null,
        price: Number(price),
        cost: Number(cost),
        stock: Number(stock),
        min_stock: Number(minStock),
        unit: unit.trim() || "pcs",
        is_active: isActive,
        image_url: finalImageUrl,
      };

      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Produk diperbarui");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Produk ditambahkan");
      }
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Foto Produk</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
              {imageUrl && !image && (
                <img src={imageUrl} alt="" className="size-20 rounded-lg object-cover mt-2" />
              )}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Nama Produk *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama produk" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto-generate jika kosong" />
            </div>
            <div className="space-y-1.5">
              <Label>Barcode</Label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kategori</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Satuan</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, cup, box..." />
            </div>
            <div className="space-y-1.5">
              <Label>Harga Jual (Rp) *</Label>
              <Input type="number" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Harga Modal (Rp)</Label>
              <Input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Stok</Label>
              <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Stok Minimum</Label>
              <Input type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Deskripsi</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Deskripsi produk (opsional)" />
            </div>
            <div className="flex items-center gap-3 col-span-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="is-active" />
              <Label htmlFor="is-active">Produk Aktif (tampil di POS)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
