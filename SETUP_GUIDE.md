# 🚀 Nako POS - Setup Guide

## 1. Setup Supabase Project

1. Buka [supabase.com](https://supabase.com) → buat project baru
2. Masuk ke **SQL Editor** → paste seluruh isi `SUPABASE_SETUP.sql` → klik **Run**
3. Catat **Project URL** dan **anon/public key** dari: Project Settings → API

## 2. Setup Google OAuth

1. Di Supabase: **Authentication → Providers → Google** → Enable
2. Buka [console.cloud.google.com](https://console.cloud.google.com)
3. Buat project → **APIs & Services → Credentials → Create OAuth 2.0 Client**
4. Application type: **Web application**
5. Authorized redirect URIs tambahkan:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
6. Copy **Client ID** dan **Client Secret** → paste ke Supabase Google provider settings
7. Save

## 3. Update .env

Edit file `.env` dengan nilai dari project Supabase kamu:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

## 4. Install & Jalankan

```bash
npm install
npm run dev
```

## 5. Login Pertama

- Daftar akun → otomatis jadi **Admin**
- User berikutnya → otomatis jadi **Kasir**
- Admin bisa ubah role user di halaman Users

---

## Ringkasan Perubahan yang Sudah Diperbaiki

### Bug Fixes
- ✅ **Transaksi**: Fix error saat tambah transaksi baru (broken RPC call dihapus, error handling diperbaiki)
- ✅ **Produk Edit**: Form sekarang ter-populate dengan benar pakai `useEffect` (bukan conditional state update yang buggy)
- ✅ **Produk Delete**: Tombol hapus berfungsi dengan confirm dialog
- ✅ **RLS Policy**: Kasir sekarang bisa update stock produk saat transaksi

### Migrasi dari Lovable ke Supabase Native
- ✅ `src/integrations/supabase/client.ts` — dihapus ketergantungan Lovable Cloud
- ✅ `src/routes/login.tsx` — Google OAuth pakai `supabase.auth.signInWithOAuth()` native
- ✅ Tidak ada lagi error "Connect Supabase in Lovable Cloud"

### Role-Based Navigation
- ✅ **Kasir**: hanya lihat Dashboard, Transaksi Baru, Riwayat Transaksi
- ✅ **Manager**: + Produk, Laporan
- ✅ **Admin**: + Users, Settings
