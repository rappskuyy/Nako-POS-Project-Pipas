import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Plus, Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*, customers(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((t: any) =>
    !search || t.code.toLowerCase().includes(search.toLowerCase()),
  );

  const exportExcel = () => {
    const rows = filtered.map((t: any) => ({
      "Order ID": t.code,
      Pelanggan: t.customers?.name || "Walk-in",
      Tanggal: format(new Date(t.created_at), "dd/MM/yyyy HH:mm"),
      Subtotal: Number(t.subtotal),
      Pajak: Number(t.tax),
      Total: Number(t.total),
      Metode: t.payment_method,
      Status: t.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    XLSX.writeFile(wb, `kopi-nako-transaksi-${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  return (
    <AppShell title="Transaksi">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <Input
          className="max-w-sm"
          placeholder="Cari Order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel}><Download className="size-4 mr-1" /> Export Excel</Button>
          <Link to="/pos">
            <Button><Plus className="size-4 mr-1" /> Transaksi Baru</Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="py-3 px-4 font-medium">Order ID</th>
                <th className="py-3 px-4 font-medium">Pelanggan</th>
                <th className="py-3 px-4 font-medium">Tanggal</th>
                <th className="py-3 px-4 font-medium">Metode</th>
                <th className="py-3 px-4 font-medium text-right">Total</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Memuat...</td></tr>}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Belum ada transaksi</td></tr>
              )}
              {filtered.map((t: any) => (
                <tr key={t.id} className="border-t">
                  <td className="py-3 px-4 font-mono text-xs">{t.code}</td>
                  <td className="py-3 px-4">{t.customers?.name ?? "Walk-in"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{format(new Date(t.created_at), "dd MMM yyyy HH:mm")}</td>
                  <td className="py-3 px-4 capitalize">{t.payment_method}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatRupiah(Number(t.total))}</td>
                  <td className="py-3 px-4">
                    <Badge variant={t.status === "completed" ? "default" : "secondary"} className="capitalize">
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
