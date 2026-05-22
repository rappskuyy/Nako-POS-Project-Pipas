import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package, Receipt, Wallet, Users as UsersIcon, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const weekAgo = subDays(new Date(), 6).toISOString();
      const [productsRes, txTodayRes, txWeekRes, customersRes, recentRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("total").gte("created_at", today).eq("status", "completed"),
        supabase.from("transactions").select("total, created_at").gte("created_at", weekAgo).eq("status", "completed"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase
          .from("transactions")
          .select("id, code, total, status, created_at, payment_method, customers(name)")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const revenueToday = (txTodayRes.data ?? []).reduce((s, t) => s + Number(t.total), 0);
      const txTodayCount = (txTodayRes.data ?? []).length;

      // Build 7-day series
      const series: { date: string; total: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = startOfDay(subDays(new Date(), i));
        series.push({ date: format(d, "EEE", { locale: idLocale }), total: 0 });
      }
      (txWeekRes.data ?? []).forEach((t) => {
        const d = startOfDay(new Date(t.created_at));
        const idx = 6 - Math.floor((Date.now() - d.getTime()) / 86400000);
        if (idx >= 0 && idx < 7) series[idx].total += Number(t.total);
      });

      return {
        productCount: productsRes.count ?? 0,
        revenueToday,
        txTodayCount,
        customerCount: customersRes.count ?? 0,
        series,
        recent: recentRes.data ?? [],
      };
    },
  });

  const stats = [
    { label: "Total Produk", value: data?.productCount ?? 0, icon: Package, accent: "bg-primary/10 text-primary" },
    { label: "Transaksi Hari Ini", value: data?.txTodayCount ?? 0, icon: Receipt, accent: "bg-accent text-accent-foreground" },
    { label: "Pendapatan Hari Ini", value: formatRupiah(data?.revenueToday ?? 0), icon: Wallet, accent: "bg-success/10 text-success" },
    { label: "Pelanggan", value: data?.customerCount ?? 0, icon: UsersIcon, accent: "bg-warning/10 text-warning" },
  ];

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-2">{s.value}</p>
              </div>
              <div className={`size-10 rounded-xl flex items-center justify-center ${s.accent}`}>
                <s.icon className="size-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Tren Penjualan</h2>
              <p className="text-xs text-muted-foreground">7 hari terakhir</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => formatRupiah(v)}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
                />
                <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Aksi Cepat</h2>
          <Link to="/transactions/new">
            <Button className="w-full justify-between mb-3" size="lg">
              Buka POS Terminal <ArrowRight className="size-4" />
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/products"><Button variant="outline" className="w-full">Produk</Button></Link>
            <Link to="/transactions"><Button variant="outline" className="w-full">Transaksi</Button></Link>
            <Link to="/reports"><Button variant="outline" className="w-full">Laporan</Button></Link>
            <Link to="/settings"><Button variant="outline" className="w-full">Pengaturan</Button></Link>
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Transaksi Terbaru</h2>
          <Link to="/transactions" className="text-sm text-primary hover:underline">Lihat semua</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 font-medium">Order ID</th>
                <th className="py-2 font-medium">Pelanggan</th>
                <th className="py-2 font-medium">Tanggal</th>
                <th className="py-2 font-medium">Metode</th>
                <th className="py-2 font-medium text-right">Total</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent ?? []).map((t: any) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-3 font-mono text-xs">{t.code}</td>
                  <td className="py-3">{t.customers?.name ?? "Walk-in"}</td>
                  <td className="py-3 text-muted-foreground">{format(new Date(t.created_at), "dd MMM HH:mm")}</td>
                  <td className="py-3 capitalize">{t.payment_method}</td>
                  <td className="py-3 text-right font-medium">{formatRupiah(Number(t.total))}</td>
                  <td className="py-3">
                    <Badge variant={t.status === "completed" ? "default" : "secondary"} className="capitalize">{t.status}</Badge>
                  </td>
                </tr>
              ))}
              {(!data?.recent || data.recent.length === 0) && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada transaksi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
