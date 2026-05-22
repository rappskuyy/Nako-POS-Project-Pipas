-- ================================================================
-- NAKO POS - SUPABASE SETUP SQL
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ================================================================

-- ============ ENUM ============
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'kasir');
CREATE TYPE public.payment_method AS ENUM ('cash', 'debit', 'credit', 'ewallet', 'qris');
CREATE TYPE public.transaction_status AS ENUM ('completed', 'pending', 'cancelled');
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _has_admin BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO _has_admin;
  IF _has_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'kasir')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  unit TEXT NOT NULL DEFAULT 'pcs',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  change_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status transaction_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_promo BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- ============ VOUCHERS ============
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_purchase NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(12,2),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- ============ STORE SETTINGS ============
CREATE TABLE public.store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'Kopi Nako',
  tagline TEXT DEFAULT 'Setiap tegukan, cerita baru',
  address TEXT DEFAULT 'Jl. Kopi No. 1, Jakarta',
  phone TEXT DEFAULT '0812-3456-7890',
  email TEXT DEFAULT 'hello@kopinako.id',
  website TEXT DEFAULT 'www.kopinako.id',
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 11,
  receipt_footer TEXT DEFAULT 'Terima kasih telah berkunjung ke Kopi Nako!',
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.store_settings (id) VALUES (1);

-- ============ RLS POLICIES ============

-- profiles: semua user yg login bisa baca, hanya bisa update milik sendiri
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles: bisa lihat role sendiri atau jika admin lihat semua
CREATE POLICY "user_roles_select_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- categories: semua bisa baca, admin/manager bisa kelola
CREATE POLICY "categories_select_auth" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_manage_admin_mgr" ON public.categories FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

-- products: semua bisa baca, admin/manager bisa kelola
CREATE POLICY "products_select_auth" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_manage_admin_mgr" ON public.products FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

-- PENTING: kasir bisa UPDATE stock produk saat transaksi
CREATE POLICY "products_update_stock_kasir" ON public.products FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- customers: semua bisa akses
CREATE POLICY "customers_select_auth" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_manage_auth" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- transactions: semua bisa baca, kasir bisa insert transaksi milik sendiri
CREATE POLICY "transactions_select_auth" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "transactions_insert_auth" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = cashier_id);
CREATE POLICY "transactions_update_admin_mgr" ON public.transactions FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

-- transaction_items: semua bisa baca & insert
CREATE POLICY "tx_items_select_auth" ON public.transaction_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "tx_items_insert_auth" ON public.transaction_items FOR INSERT TO authenticated WITH CHECK (true);

-- vouchers
CREATE POLICY "vouchers_select_auth" ON public.vouchers FOR SELECT TO authenticated USING (true);
CREATE POLICY "vouchers_manage_admin_mgr" ON public.vouchers FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

-- store_settings: semua bisa baca, hanya admin bisa update
CREATE POLICY "store_select_auth" ON public.store_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "store_update_admin" ON public.store_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "product_images_auth_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY "product_images_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

-- ============ SEED DATA ============
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Kopi', 'kopi', 1),
  ('Non-Kopi', 'non-kopi', 2),
  ('Makanan', 'makanan', 3),
  ('Snack', 'snack', 4),
  ('Sembako', 'sembako', 5)
ON CONFLICT DO NOTHING;
