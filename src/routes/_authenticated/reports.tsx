import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const since = subDays(new Date(), 13).toISOString();
      const { data: tx } = await supabase
        .from("transactions")
        .select("total, subtotal, tax, created_at, status")
        .gte("created_at", since)
        .eq("status", "completed");
      const { data: items } = await supabase
        .from("transaction_items")
        .select("product_name, qty, subtotal");

      const series: { date: string; revenue: number; profit: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = startOfDay(subDays(new Date(), i));
        series.push({ date: format(d, "dd MMM"), revenue: 0, profit: 0 });
      }
      (tx ?? []).forEach((t: any) => {
        const d = startOfDay(new Date(t.created_at));
        const idx = 13 - Math.floor((Date.now() - d.getTime()) / 86400000);
        if (idx >= 0 && idx < 14) {
          series[idx].revenue += Number(t.total);
          series[idx].profit += Number(t.subtotal) * 0.3; // estimate
        }
      });

      const top: Record<string, { name: string; qty: number; revenue: number }> = {};
      (items ?? []).forEach((it: any) => {
        if (!top[it.product_name]) top[it.product_name] = { name: it.product_name, qty: 0, revenue: 0 };
        top[it.product_name].qty += it.qty;
        top[it.product_name].revenue += Number(it.subtotal);
      });

      const totalRevenue = (tx ?? []).reduce((s, t) => s + Number(t.total), 0);
      const totalSales = (tx ?? []).length;

      return {
        series,
        top: Object.values(top).sort((a, b) => b.qty - a.qty).slice(0, 5),
        totalRevenue,
        totalSales,
      };
    },
  });

  return (
    <AppShell title="Laporan">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatRupiah(data?.totalRevenue ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">14 hari terakhir</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total Transaksi</p>
          <p className="text-2xl font-bold mt-1">{data?.totalSales ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Rata-rata Order</p>
          <p className="text-2xl font-bold mt-1">
            {formatRupiah(data?.totalSales ? (data.totalRevenue / data.totalSales) : 0)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Revenue & Profit</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" fill="var(--primary-glow)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Produk Terlaris</h2>
          <ul className="space-y-3">
            {(data?.top ?? []).map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.qty} terjual</div>
                </div>
                <div className="text-sm font-semibold text-primary">{formatRupiah(p.revenue)}</div>
              </li>
            ))}
            {(!data?.top || data.top.length === 0) && (
              <li className="text-sm text-muted-foreground text-center py-6">Belum ada data</li>
            )}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
