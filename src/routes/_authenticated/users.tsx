import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles ?? []).map((p: any) => ({
        ...p,
        role: roles?.find((r: any) => r.user_id === p.id)?.role ?? "kasir",
      }));
    },
  });

  return (
    <AppShell title="Users">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="py-3 px-4 font-medium">Nama</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u: any) => (
              <tr key={u.id} className="border-t">
                <td className="py-3 px-4 font-medium">{u.full_name || "(tanpa nama)"}</td>
                <td className="py-3 px-4">
                  <Badge variant="outline" className="capitalize">{u.role}</Badge>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">Belum ada user</td></tr>
            )}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted-foreground mt-3">
        Untuk menambah user baru, mereka cukup mendaftar lewat halaman login. Admin pertama otomatis ditetapkan saat user pertama mendaftar.
      </p>
    </AppShell>
  );
}
