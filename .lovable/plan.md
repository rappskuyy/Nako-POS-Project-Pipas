# Kopi Nako POS — Implementation Plan

A modern Point of Sale web app for a coffee shop with a warm brown brand identity, full kasir flow, inventory, reports, and thermal receipt printing.

## Stack note
The project runs on **TanStack Start + Lovable Cloud (Supabase)**, not Next.js. All features from the brief will be delivered using this stack — functionality is identical, only the framework conventions differ (file-based routes under `src/routes/`, server functions instead of API routes, Lovable Cloud for DB/Auth/Storage/Realtime).

## Scope — Phase 1 (this build)
Core POS that a shop can actually use end-to-end:

1. **Brand & design system** — Kopi Nako brown palette wired into `src/styles.css` as semantic tokens, Inter font, rounded cards, sidebar shell.
2. **Auth** — Email/password login + Google sign-in via Lovable Cloud. `profiles` + `user_roles` tables (roles: admin, manager, kasir).
3. **Database schema** (Lovable Cloud):
   - `categories`, `products` (with image, sku, barcode, price, cost, stock, min_stock, status)
   - `customers` (with loyalty_points)
   - `transactions` + `transaction_items`
   - `vouchers`
   - `store_settings`
   - RLS policies scoped by role; product images in a `product-images` storage bucket.
4. **Sidebar layout** with Dashboard, Products, Transactions, Reports, Users, Settings.
5. **Dashboard** — 4 stat cards, sales trend chart (Recharts), recent transactions table, quick-action panel.
6. **Products** — list with search/filter, add/edit modal with image upload, stock & low-stock badges, stats footer.
7. **POS Terminal** (`/transactions/new`) — 2-panel layout: product grid + cart (Zustand store, persisted), tax calc, voucher input, payment modal (Cash/Debit/Credit/E-Wallet/QRIS) with change calculation.
8. **Receipt** — printable 80mm thermal layout via `window.print()` + PDF download via `@react-pdf/renderer`, includes QR of transaction code.
9. **Transactions history** — table with filters, status badges, view detail + reprint receipt.
10. **Reports** — revenue/profit bar chart, top products, transactions table, Excel + PDF export.
11. **Users** — list, invite, role management, deactivate (admin only).
12. **Settings** — store profile, tax rate, payment methods, receipt footer.
13. **Realtime low-stock toast** via Supabase Realtime.
14. **Rupiah formatting** helper, Indonesian copy throughout.

## Out of scope for Phase 1 (can follow up)
- Barcode camera scanner (html5-qrcode) — wire after core flow is stable
- PWA / offline mode — TanStack Start preview iframe makes service workers risky; add only if requested
- WhatsApp notification integration
- Loyalty points auto-accrual rules UI (schema will be ready)
- Dark mode

## Technical notes
- Routes are flat files in `src/routes/` (e.g. `dashboard.tsx`, `products.tsx`, `transactions.new.tsx`). An `_authenticated.tsx` pathless layout gates the sidebar pages.
- Data access via `createServerFn` with `requireSupabaseAuth` middleware; browser client only for auth/session/realtime.
- Cart state in Zustand with `localStorage` persist.
- Charts: Recharts. Forms: React Hook Form + Zod. Icons: lucide-react. Toasts: sonner (already wired).
- Receipt PDF: `@react-pdf/renderer`. QR: `qrcode` lib.
- Excel export: `xlsx`. PDF report export: `@react-pdf/renderer`.
- Tax rate, store name/address pulled from `store_settings` table (not env), so the shop can edit them in Settings.

## Build order
1. Enable Lovable Cloud, create schema + RLS + storage bucket, seed categories and an admin role.
2. Design tokens (brown palette in `src/styles.css`) + sidebar shell + auth pages.
3. Products CRUD + image upload.
4. POS terminal + payment modal + receipt print/PDF.
5. Transactions history + reprint.
6. Dashboard + Reports + exports.
7. Users + Settings + realtime low-stock toast.

## Clarifying question
The brief lists features for several distinct screens. I'll build all of Phase 1 above in one pass, but if you'd rather I stop after the POS Terminal works end-to-end (steps 1–5) and review before continuing, say so and I'll pause there.
