-- Add WiFi and receipt design fields to store_settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS wifi_ssid TEXT,
ADD COLUMN IF NOT EXISTS wifi_password TEXT,
ADD COLUMN IF NOT EXISTS receipt_primary_color TEXT DEFAULT '#8B4513',
ADD COLUMN IF NOT EXISTS receipt_accent_color TEXT DEFAULT '#D2691E',
ADD COLUMN IF NOT EXISTS show_wifi_on_receipt BOOLEAN DEFAULT true;
