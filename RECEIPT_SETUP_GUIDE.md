# 🎨 RECEIPT UPGRADE GUIDE

## ✨ Fitur Baru yang Ditambahkan:

### 1. **Struk yang Lebih Cantik** 💅
- ✅ Header gradient colorful dengan logo
- ✅ Decorative elements (background shapes)
- ✅ Better organized layout
- ✅ Color-coded sections (green untuk diskon, blue untuk WiFi)
- ✅ Professional typography dan spacing

### 2. **WiFi Information Section** 📶
- ✅ Display SSID & Password di struk
- ✅ Copy-to-clipboard button
- ✅ Toggle on/off dari store settings
- ✅ Beautiful blue section dengan WiFi icon

### 3. **Logo Display** 🏷️
- ✅ Circular logo dengan shadow effect
- ✅ Responsive sizing
- ✅ Border styling untuk professional look

### 4. **Custom Colors** 🎨
- ✅ Primary color gradient
- ✅ Accent color
- ✅ Customizable dari database

---

## 🔧 Setup di Database (Supabase)

### Option 1: Run Migration
1. Buka Supabase Dashboard
2. Go to: **SQL Editor**
3. Copy-paste isi file: `supabase/migrations/20260520_add_wifi_receipt_settings.sql`
4. Klik **Execute**

### Option 2: Manual Setup
Jalankan query ini di Supabase SQL Editor:

```sql
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS wifi_ssid TEXT,
ADD COLUMN IF NOT EXISTS wifi_password TEXT,
ADD COLUMN IF NOT EXISTS receipt_primary_color TEXT DEFAULT '#8B4513',
ADD COLUMN IF NOT EXISTS receipt_accent_color TEXT DEFAULT '#D2691E',
ADD COLUMN IF NOT EXISTS show_wifi_on_receipt BOOLEAN DEFAULT true;
```

---

## 📝 Setting Store Configuration

Di Supabase, update tabel `store_settings` dengan data berikut:

```sql
UPDATE public.store_settings 
SET 
  wifi_ssid = 'Nako_WiFi',
  wifi_password = 'KopiNako2024',
  receipt_primary_color = '#8B4513',          -- Warm brown
  receipt_accent_color = '#D2691E',           -- Chocolate
  show_wifi_on_receipt = true,
  logo_url = 'https://your-image-url.com/logo.png'
WHERE id = 1;
```

### Color Suggestions:

#### ☕ Coffee Shop Theme:
- Primary: `#8B4513` (Saddle Brown)
- Accent: `#D2691E` (Chocolate)

#### 🌳 Modern Cafe:
- Primary: `#2C3E50` (Dark Blue-Gray)
- Accent: `#3498DB` (Sky Blue)

#### 🌅 Warm & Cozy:
- Primary: `#D35400` (Carrot Orange)
- Accent: `#E67E22` (Pumpkin)

#### 🎨 Purple Vibes:
- Primary: `#6C3483` (Purple)
- Accent: `#AF7AC5` (Light Purple)

---

## 📸 Screenshot Preview

Struk sekarang menampilkan:
1. **Header** dengan logo, nama toko, tagline
2. **Contact Info** dengan format menarik
3. **Items** dengan better layout
4. **Summary** dengan gradient box untuk total
5. **WiFi Section** (jika enabled) - SSID + Password
6. **Footer** dengan QR code placeholder

---

## 🖨️ Print Test

1. Klik **"Bayar & Cetak Struk"** di POS
2. Klik **"Cetak Struk"** di dialog
3. Preview akan muncul
4. Klik **"Print"** di browser
5. Pilih printer thermal 80mm

---

## 🎯 Tips Menggunakan Logo

Untuk hasil terbaik:
- **Format**: PNG atau JPG
- **Size**: 300x300px minimal
- **Background**: Transparent atau white
- **Upload ke**: Supabase Storage atau external CDN
- **Copy URL** ke field `logo_url` di store_settings

---

## ❓ Troubleshooting

### Logo tidak muncul?
→ Pastikan URL accessible & format gambar benar

### WiFi info tidak muncul?
→ Cek field `show_wifi_on_receipt = true` dan `wifi_ssid` tidak kosong

### Warna tidak sesuai?
→ Pastikan format color: `#RRGGBB` (hex format)

### Print tidak rapi?
→ Gunakan thermal printer 80mm atau adjust CSS di `styles.css`

---

## 🚀 Next Steps

1. ✅ Run migration di Supabase
2. ✅ Update store_settings dengan WiFi & colors
3. ✅ Upload logo & set logo_url
4. ✅ Test print receipt
5. ✅ Adjust colors sesuai brand

Selamat! Struk Anda sekarang lebih cantik dan profesional! 🎉
