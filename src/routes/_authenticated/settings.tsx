import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wifi, Palette, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["store_settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle()).data,
  });
  const [form, setForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState<"general" | "wifi" | "design">("general");

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const updateData: any = {
        name: form.name,
        tagline: form.tagline,
        address: form.address,
        phone: form.phone,
        email: form.email,
        website: form.website,
        tax_rate: Number(form.tax_rate),
        receipt_footer: form.receipt_footer,
        logo_url: form.logo_url,
        wifi_ssid: form.wifi_ssid,
        wifi_password: form.wifi_password,
        show_wifi_on_receipt: form.show_wifi_on_receipt ?? true,
        receipt_primary_color: form.receipt_primary_color,
        receipt_accent_color: form.receipt_accent_color,
      };

      const { error } = await supabase.from("store_settings").update(updateData).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pengaturan disimpan! 🎉");
      qc.invalidateQueries({ queryKey: ["store_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Pengaturan Toko">
      <div className="max-w-3xl space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b bg-card rounded-t-lg p-4 flex-wrap">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "general"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            📋 Umum
          </button>
          <button
            onClick={() => setActiveTab("wifi")}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === "wifi"
                ? "bg-blue-500 text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Wifi className="w-4 h-4" /> WiFi
          </button>
          <button
            onClick={() => setActiveTab("design")}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === "design"
                ? "bg-purple-500 text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Palette className="w-4 h-4" /> Desain Struk
          </button>
        </div>

        {/* Content */}
        <Card className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Nama Toko</Label>
                    <Input
                      value={form.name ?? ""}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Kopi Nako"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Tagline</Label>
                    <Input
                      value={form.tagline ?? ""}
                      onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                      placeholder="Setiap tegukan, cerita baru"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Alamat</Label>
                    <Textarea
                      value={form.address ?? ""}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Jl. Kopi No. 1, Jakarta"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telepon</Label>
                    <Input
                      value={form.phone ?? ""}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0812-3456-7890"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      value={form.email ?? ""}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="hello@kopinako.id"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input
                      value={form.website ?? ""}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="www.kopinako.id"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pajak (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.tax_rate ?? 0}
                      onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Footer Struk</Label>
                    <Textarea
                      value={form.receipt_footer ?? ""}
                      onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
                      placeholder="Terima kasih telah berkunjung!"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WiFi Tab */}
            {activeTab === "wifi" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ Tambahkan informasi WiFi yang akan ditampilkan di bagian bawah struk
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.show_wifi_on_receipt ?? true}
                      onChange={(e) =>
                        setForm({ ...form, show_wifi_on_receipt: e.target.checked })
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    Tampilkan WiFi di Struk
                  </Label>
                </div>

                <div className="space-y-1.5">
                  <Label>SSID (Nama WiFi)</Label>
                  <Input
                    value={form.wifi_ssid ?? ""}
                    onChange={(e) => setForm({ ...form, wifi_ssid: e.target.value })}
                    placeholder="Nako_WiFi"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Password WiFi</Label>
                  <Input
                    type="password"
                    value={form.wifi_password ?? ""}
                    onChange={(e) => setForm({ ...form, wifi_password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-green-800 font-medium">✅ Preview:</p>
                  <div className="mt-2 bg-white border border-green-300 rounded p-3 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span>SSID:</span>
                      <span className="font-bold text-blue-600">{form.wifi_ssid || "Nako_WiFi"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Password:</span>
                      <span className="font-bold text-blue-600">
                        {form.wifi_password ? "•".repeat(form.wifi_password.length) : "••••••••"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Design Tab */}
            {activeTab === "design" && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-800">
                    🎨 Personalisasi warna dan logo struk Anda
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    URL Logo
                  </Label>
                  <Input
                    value={form.logo_url ?? ""}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  {form.logo_url && (
                    <div className="mt-2 flex justify-center">
                      <img
                        src={form.logo_url}
                        alt="Logo"
                        className="h-16 w-16 rounded-full shadow-lg object-cover border-4 border-primary"
                        onError={() => toast.error("URL logo tidak valid")}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Warna Utama
                    </Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.receipt_primary_color ?? "#8B4513"}
                        onChange={(e) => setForm({ ...form, receipt_primary_color: e.target.value })}
                        className="w-16 h-10 cursor-pointer rounded border"
                      />
                      <Input
                        value={form.receipt_primary_color ?? "#8B4513"}
                        onChange={(e) => setForm({ ...form, receipt_primary_color: e.target.value })}
                        placeholder="#8B4513"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Warna Aksen
                    </Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.receipt_accent_color ?? "#D2691E"}
                        onChange={(e) => setForm({ ...form, receipt_accent_color: e.target.value })}
                        className="w-16 h-10 cursor-pointer rounded border"
                      />
                      <Input
                        value={form.receipt_accent_color ?? "#D2691E"}
                        onChange={(e) => setForm({ ...form, receipt_accent_color: e.target.value })}
                        placeholder="#D2691E"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="space-y-2">
                  <Label>Preset Warna:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          receipt_primary_color: "#8B4513",
                          receipt_accent_color: "#D2691E",
                        })
                      }
                      className="px-3 py-2 rounded border border-amber-300 bg-amber-50 text-sm hover:bg-amber-100 transition"
                    >
                      ☕ Coffee Brown
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          receipt_primary_color: "#2C3E50",
                          receipt_accent_color: "#3498DB",
                        })
                      }
                      className="px-3 py-2 rounded border border-blue-300 bg-blue-50 text-sm hover:bg-blue-100 transition"
                    >
                      🌳 Modern Blue
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          receipt_primary_color: "#D35400",
                          receipt_accent_color: "#E67E22",
                        })
                      }
                      className="px-3 py-2 rounded border border-orange-300 bg-orange-50 text-sm hover:bg-orange-100 transition"
                    >
                      🌅 Warm Orange
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          receipt_primary_color: "#6C3483",
                          receipt_accent_color: "#AF7AC5",
                        })
                      }
                      className="px-3 py-2 rounded border border-purple-300 bg-purple-50 text-sm hover:bg-purple-100 transition"
                    >
                      🎨 Purple Vibes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t flex gap-2 justify-end">
              <Button type="submit" disabled={save.isPending} className="bg-primary">
                {save.isPending ? "Menyimpan..." : "💾 Simpan Pengaturan"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

