import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coffee, BarChart3, ShoppingBag, Receipt, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Akun dibuat! Silakan cek email konfirmasi atau langsung masuk.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Selamat datang kembali!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message || "Gagal masuk dengan Google");
      setSubmitting(false);
    }
  };

  const features = [
    { icon: ShoppingBag, title: "Manajemen Produk", desc: "Kelola menu & stok dengan mudah" },
    { icon: BarChart3, title: "Laporan Real-time", desc: "Pantau penjualan setiap saat" },
    { icon: Receipt, title: "Struk Digital", desc: "Cetak & kirim struk otomatis" },
    { icon: Star, title: "Manajemen Promo", desc: "Buat diskon & paket spesial" },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-accent/40 to-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary/8 translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Coffee className="size-5" />
          </div>
          <span className="text-xl font-bold text-foreground">Kopi Nako</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <Coffee className="size-3" />
              Point of Sale System
            </div>
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              Kelola kasir kamu<br />
              <span className="text-primary">lebih cepat & mudah</span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
              Sistem POS modern untuk warung kopi dan restoran. Dari order hingga laporan, semua dalam satu platform.
            </p>
          </div>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-border/40 backdrop-blur-sm">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-sm text-muted-foreground italic">"Setiap tegukan, cerita baru"</p>
          <p className="text-xs text-muted-foreground/60 mt-1">— Kopi Nako</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-xl border-border/70">
          <div className="flex flex-col items-center mb-6">
            <div className="size-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-3 lg:hidden">
              <Coffee className="size-7" />
            </div>
            <h2 className="text-2xl font-bold">{mode === "signin" ? "Selamat Datang" : "Buat Akun"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Masuk ke akun Kopi Nako kamu" : "Daftarkan akun baru"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Budi Santoso"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@kopinako.id"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Memproses..." : mode === "signin" ? "Masuk" : "Buat Akun"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <span className="relative bg-card px-3 mx-auto block w-fit text-xs text-muted-foreground uppercase">atau</span>
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={onGoogle} disabled={submitting}>
            <svg viewBox="0 0 24 24" className="size-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Lanjut dengan Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Daftar di sini" : "Masuk"}
            </button>
          </p>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            User pertama yang daftar otomatis jadi admin.
          </p>
        </Card>
      </div>
    </div>
  );
}