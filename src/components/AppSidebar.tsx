import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Coffee,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: AppRole[];
}

const items: NavItem[] = [
  { title: "Dashboard",         url: "/dashboard",    icon: LayoutDashboard, roles: [] },
  { title: "Transaksi Baru",    url: "/pos",          icon: PlusCircle,      roles: [] },
  { title: "Riwayat Transaksi", url: "/transactions", icon: Receipt,         roles: [] },
  { title: "Produk",            url: "/products",     icon: Package,         roles: ["admin", "manager"] },
  { title: "Laporan",           url: "/reports",      icon: BarChart3,       roles: ["admin", "manager"] },
  { title: "Users",             url: "/users",        icon: Users,           roles: ["admin"] },
  { title: "Settings",          url: "/settings",     icon: SettingsIcon,    roles: ["admin"] },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { fullName, role, user } = useAuth();
  const navigate = useNavigate();

  const initials = (fullName || user?.email || "U")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const visibleItems = items.filter(
    (item) => item.roles.length === 0 || (role && item.roles.includes(role))
  );

  const roleBadge: Record<AppRole, string> = {
    admin: "Admin",
    manager: "Manager",
    kasir: "Kasir",
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground min-h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
          <Coffee className="size-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <div className="font-bold text-lg leading-none">Kopi Nako</div>
          <div className="text-[11px] text-sidebar-foreground/60 mt-1">POS System</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {visibleItems.map((item) => {
          const active = pathname === item.url || pathname.startsWith(item.url + "/");
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{fullName || user?.email}</div>
            <div className="text-[11px] text-sidebar-foreground/60 capitalize">
              {role ? roleBadge[role] : "-"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Keluar"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}