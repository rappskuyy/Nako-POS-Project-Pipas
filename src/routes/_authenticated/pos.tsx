import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Trash2, Plus, Minus, X, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart-store";
import { formatRupiah, generateTxCode } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReceiptDialog } from "@/components/ReceiptDialog";

export const Route = createFileRoute("/_authenticated/pos")({
  component: POSPage,
});

function POSPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const cart = useCart();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const { data: settings } = useQuery({
    queryKey: ["store_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });
  const taxRate = Number(settings?.tax_rate ?? 11);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: products } = useQuery({
    queryKey: ["pos-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock, image_url, category_id, sku")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (products ?? []).filter((p) => {
    const s = search.toLowerCase();
    const matchSearch = !s || p.name.toLowerCase().includes(s) || (p.sku ?? "").toLowerCase().includes(s);
    const matchCat = cat === "all" || p.category_id === cat;
    return matchSearch && matchCat;
  });

  const subtotal = cart.getSubtotal();
  const discount = cart.voucherDiscount;
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;

  // Stable tx code per cart session
  const txCode = useMemo(() => generateTxCode(), []);

  const handlePayment = async (method: string, paid: number) => {
    if (!user) {
      toast.error("Anda harus login terlebih dahulu");
      return;
    }
    if (cart.items.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }

    try {
      // 1. Insert transaction
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          code: txCode,
          cashier_id: user.id,
          subtotal,
          tax,
          discount,
          total,
          payment_method: method as any,
          paid_amount: paid,
          change_amount: Math.max(0, paid - total),
          status: "completed",
        })
        .select()
        .single();

      if (txErr) throw new Error(`Transaksi gagal: ${txErr.message}`);

      // 2. Insert transaction items
      const items = cart.items.map((i) => ({
        transaction_id: tx.id,
        product_id: i.productId,
        product_name: i.name,
        qty: i.qty,
        price: i.isPromo ? 0 : i.price,
        subtotal: i.isPromo ? 0 : i.price * i.qty,
        is_promo: !!i.isPromo,
      }));

      const { error: itErr } = await supabase.from("transaction_items").insert(items);
      if (itErr) throw new Error(`Item gagal disimpan: ${itErr.message}`);

      // 3. Update stock for each product
      for (const i of cart.items) {
        const product = (products ?? []).find((pp: any) => pp.id === i.productId);
        if (product) {
          const newStock = Math.max(0, (product.stock ?? 0) - i.qty);
          await supabase.from("products").update({ stock: newStock }).eq("id", i.productId);
        }
      }

      toast.success("Transaksi berhasil!");
      setReceipt({
        ...tx,
        items: cart.items,
        store: settings,
        cashierName: user.email,
      });
      cart.clear();
      qc.invalidateQueries({ queryKey: ["pos-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setPayOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">POS Terminal</h1>
            <p className="text-xs text-muted-foreground">{settings?.name ?? "Kopi Nako"}</p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">Kembali</Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 flex-1">
          {/* Product panel */}
          <div className="p-5 overflow-y-auto">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari nama produk atau SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              <CategoryPill active={cat === "all"} onClick={() => setCat("all")} label="Semua" />
              {(categories ?? []).map((c: any) => (
                <CategoryPill key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} label={c.name} />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() =>
                    cart.addItem({
                      productId: p.id,
                      name: p.name,
                      price: Number(p.price),
                      imageUrl: p.image_url,
                      stock: p.stock,
                    })
                  }
                  disabled={p.stock === 0}
                  className={cn(
                    "text-left rounded-xl bg-card border border-border p-3 hover:border-primary hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <div className="aspect-square rounded-lg bg-accent mb-2 overflow-hidden flex items-center justify-center text-accent-foreground text-xs">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                    ) : (
                      p.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="text-sm font-medium line-clamp-2 mb-1">{p.name}</div>
                  <div className="text-primary font-bold text-sm">{formatRupiah(Number(p.price))}</div>
                  <div className="text-[11px] text-muted-foreground">Stok: {p.stock}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-12">Tidak ada produk</div>
              )}
            </div>
          </div>

          {/* Cart panel */}
          <aside className="border-l bg-card flex flex-col max-h-[calc(100vh-65px)] sticky top-[65px]">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="size-4" /> Keranjang
                </h2>
                <p className="text-[11px] text-muted-foreground font-mono">{txCode}</p>
              </div>
              {cart.items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => cart.clear()}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.items.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-12">
                  Keranjang masih kosong.<br />Pilih produk untuk mulai.
                </div>
              ) : (
                cart.items.map((i) => (
                  <div key={i.productId} className="flex items-center gap-3">
                    <div className="size-12 rounded-lg bg-accent shrink-0 overflow-hidden flex items-center justify-center text-xs text-accent-foreground">
                      {i.imageUrl ? <img src={i.imageUrl} className="size-full object-cover" alt={i.name} /> : i.name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{i.name}</div>
                      <div className="text-xs text-primary font-semibold">
                        {i.isPromo ? "Promo · Rp 0" : formatRupiah(i.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="size-7" onClick={() => cart.decrement(i.productId)}>
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{i.qty}</span>
                      <Button size="icon" variant="outline" className="size-7" onClick={() => cart.increment(i.productId)}>
                        <Plus className="size-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => cart.removeItem(i.productId)}>
                        <X className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Diskon</span><span>- {formatRupiah(discount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Pajak ({taxRate}%)</span><span>{formatRupiah(tax)}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span>Total</span><span className="text-primary">{formatRupiah(total)}</span>
              </div>
              <Button
                size="lg"
                className="w-full mt-2"
                disabled={cart.items.length === 0}
                onClick={() => setPayOpen(true)}
              >
                Bayar & Cetak Struk
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} total={total} onConfirm={handlePayment} />
      {receipt && <ReceiptDialog data={receipt} onClose={() => setReceipt(null)} taxRate={taxRate} />}
    </div>
  );
}

function CategoryPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}

function PaymentDialog({
  open, onOpenChange, total, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirm: (method: string, paid: number) => void;
}) {
  const [method, setMethod] = useState("cash");
  const [paid, setPaid] = useState<string>("");
  const paidNum = Number(paid) || 0;
  const change = paidNum - total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Pembayaran</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Tagihan</p>
            <p className="text-3xl font-bold text-primary">{formatRupiah(total)}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Metode Pembayaran</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="credit">Kredit</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method === "cash" && (
            <>
              <div className="space-y-1.5">
                <Label>Nominal Bayar</Label>
                <Input type="number" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[50000, 100000, 150000, 200000].map((v) => (
                    <Button key={v} type="button" size="sm" variant="outline" onClick={() => setPaid(String(v))}>
                      {formatRupiah(v)}
                    </Button>
                  ))}
                  <Button type="button" size="sm" variant="outline" onClick={() => setPaid(String(Math.ceil(total / 1000) * 1000))}>
                    Pas
                  </Button>
                </div>
              </div>
              <div className="flex justify-between text-sm bg-green-500/10 p-3 rounded-lg">
                <span>Kembalian</span>
                <span className="font-bold text-green-600">{change >= 0 ? formatRupiah(change) : "-"}</span>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            disabled={method === "cash" && (paidNum < total || paidNum === 0)}
            onClick={() => onConfirm(method, method === "cash" ? paidNum : total)}
          >
            Konfirmasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


