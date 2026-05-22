# Elegant Black & White Receipt System

## Overview

Receipt system telah diupgrade menjadi **desain minimalis black & white yang elegan** dengan symbol profesional, tanpa emoji.

## Key Features

### 1. **Elegant Monochrome Design**
- Pure black & white (no colors)
- Clean typography
- Professional symbol usage (‒ — — | ✓ etc)
- Minimalist aesthetic

### 2. **Refined Receipt Layout**
```
┌─ Store Name ─────────────────────┐
│ Logo (if available)               │
│ Tagline (optional)               │
│ Address, Tel, Email, Web         │
├─────────────────────────────────┤
│ Receipt No: XXX  | Cashier: YYY │
│ Date: DD/MM/YYYY HH:MM          │
├─────────────────────────────────┤
│ Item          | Qty x Price | Total│
├─────────────────────────────────┤
│ Item list...                    │
├─────────────────────────────────┤
│ Subtotal                   Rp... │
│ Discount (if any)          Rp... │
│ Tax (x%)                   Rp... │
│ ─────────────────────────────── │
│ TOTAL                      Rp... │
│ Payment (METHOD)           Rp... │
│ Change                     Rp... │
├─────────────────────────────────┤
│ WiFi Information (optional)      │
│ SSID: NetworkName               │
│ Pass: ••••••••                  │
├─────────────────────────────────┤
│ Thank you for visiting!         │
│ Order #ABC123                   │
│ ─── End of Receipt ───          │
└─────────────────────────────────┘
```

### 3. **Professional Symbols**
- Borders: `─` horizontal lines
- Section dividers: `├─┤` box-drawing characters
- Dashes: `‒` or `—` for emphasis
- No emoji, pure elegance

### 4. **WiFi Section**
Optional section showing network info:
```
WiFi Information
SSID: YourNetworkName
Pass: SecurePassword
```

## Setup

### Step 1: Database
Migration already done (if not, check `supabase/migrations/20260520_add_wifi_receipt_settings.sql`)

### Step 2: Configure Settings
1. Go to **Store Settings**
2. Tab: **General Information**
   - Store name, address, contact
   - Logo URL (optional)
   - Receipt footer message
   - Tax rate
   
3. Tab: **WiFi Settings**
   - Toggle: Display WiFi on Receipt
   - SSID: Network name
   - Password: Network password

### Step 3: Test Print
1. Open POS Terminal
2. Create a transaction
3. Click **Print Receipt**
4. Open new print window
5. Print to thermal printer or PDF

## Print Behavior

### New Print Flow:
- Click **Print Receipt** button
- New browser window opens with receipt
- Auto-print dialog appears
- Select printer (thermal 80mm recommended)
- Print!

### Print Output:
- Guaranteed black & white
- 80mm width optimized
- No colors (color adjustment disabled)
- Clean text, no artifacts
- Professional appearance

## Customization

### Logo
- Upload to: Supabase Storage or external CDN
- Format: PNG or JPG
- Size: 300x300px minimum
- Display: Small square, left-aligned
- Paste URL in Settings > General Information > Logo URL

### Receipt Text
- Store name: Will appear in header
- Tagline: Below name
- Footer message: At bottom of receipt
- All customizable in Settings

### Format (Fixed)
- All black & white
- Symbol-based design
- Professional typography
- Readable on thermal printers

## Technical Details

### Component
- File: `src/components/ReceiptDialog.tsx`
- Uses new print window approach
- Clean HTML generation
- Monospace font: Courier New

### Print Styles
- File: `src/styles.css`
- Optimized for 80mm thermal
- Color adjustment: DISABLED
- Force black & white output

### Settings Page
- File: `src/routes/_authenticated/settings.tsx`
- 2 tabs: General Information + WiFi Settings
- Clean, professional UI
- No design customization (fixed BW)

## Troubleshooting

### Print doesn't work?
→ Check browser console (F12) for errors
→ Ensure pop-ups are allowed
→ Try different browser (Chrome recommended)

### Logo doesn't show?
→ Check URL is accessible
→ Verify image format (PNG/JPG)
→ Try uploading to Supabase Storage

### WiFi info doesn't appear?
→ Ensure "Display WiFi on Receipt" is checked
→ Verify SSID field is not empty
→ Check "show_wifi_on_receipt" = true in database

### Print looks messy?
→ Check printer is 80mm thermal
→ Adjust paper width in print dialog
→ Try printing to PDF first
→ Check font settings in printer

## Features Removed

- Gradient colors: ✓ Removed
- Color customization: ✓ Removed
- Design tab: ✓ Removed
- Emoji icons: ✓ Removed
- Decorative elements: ✓ Removed

## Features Added

- Elegant symbol-based design
- Improved print window handling
- Better text alignment
- Professional monospace layout
- Reliable print output
- Black & white guaranteed

## File Changes

### Created:
- None (redesigned existing component)

### Modified:
- `src/components/ReceiptDialog.tsx` → Black & white design
- `src/routes/_authenticated/settings.tsx` → Simplified to 2 tabs
- `src/styles.css` → Print optimizations

## Usage Example

### In POS:
```
1. Create transaction
2. Add items
3. Click "Bayar & Cetak Struk"
4. Confirm payment method
5. Receipt dialog appears
6. Preview in monochrome
7. Click "Print Receipt"
8. New window opens
9. Auto-print dialog
10. Select printer 80mm thermal
11. Done!
```

## Quality Assurance

- ✓ Black & white output guaranteed
- ✓ No colors in print
- ✓ Professional appearance
- ✓ Symbol-based design
- ✓ Thermal printer optimized
- ✓ No emoji
- ✓ Elegant layout
- ✓ Clean typography

## Support

Issues? Check:
1. Browser console (F12)
2. Supabase logs
3. Print settings in dialog
4. Printer configuration
5. Paper size: 80mm
