import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/format";
import { Copy, Printer, X } from "lucide-react";
import { toast } from "sonner";

interface ReceiptProps {
  data: any;
  onClose: () => void;
  taxRate: number;
}

export function ReceiptDialog({ data, onClose, taxRate }: ReceiptProps) {
  const handlePrint = () => {
    const subtotal = Number(data.subtotal);
    const discount = Number(data.discount);
    const tax = Number(data.tax);
    const total = Number(data.total);
    const paid = Number(data.paid_amount);
    const change = Number(data.change_amount);

    const itemsHtml = data.items.map((it: any) => `
      <div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-weight:600;flex:1;">${it.name}</span>
          <span style="font-weight:600;">${it.isPromo ? "FREE" : formatRupiah(it.price * it.qty)}</span>
        </div>
        <div style="color:#666;font-size:10px;">${it.qty}x ${it.isPromo ? "PROMO" : formatRupiah(it.price)}</div>
      </div>
    `).join("");

    const wifiHtml = data.store?.show_wifi_on_receipt && data.store?.wifi_ssid ? `
      <div style="border-top:1px dashed #000;padding:10px 0;">
        <div style="font-weight:700;font-size:11px;margin-bottom:6px;text-transform:uppercase;">WiFi Information</div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#555;">SSID:</span>
          <span style="font-weight:700;">${data.store.wifi_ssid}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#555;">Pass:</span>
          <span style="font-weight:700;">${data.store.wifi_password ?? "-"}</span>
        </div>
      </div>
    ` : "";

    const logoHtml = data.store?.logo_url ? `
      <div style="display:flex;justify-content:center;margin-bottom:8px;">
        <img src="${data.store.logo_url}" style="height:48px;width:48px;object-fit:cover;" />
      </div>
    ` : "";

    const discountHtml = discount > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#555;">
        <span>Discount</span><span>- ${formatRupiah(discount)}</span>
      </div>
    ` : "";

    const dateStr = new Date(data.created_at).toLocaleString("id-ID", {
      weekday: "short", year: "numeric", month: "short",
      day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt #${data.code}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; background: white; }
    @media print {
      body { width: 80mm; }
      @page { margin: 4mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
<div style="width:80mm;padding:8px;font-family:'Courier New',monospace;font-size:11px;line-height:1.5;background:white;color:black;">

  <!-- Header -->
  <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:10px;">
    ${logoHtml}
    <div style="font-weight:700;font-size:15px;margin-bottom:2px;">${data.store?.name ?? "Kopi Nako"}</div>
    ${data.store?.tagline ? `<div style="color:#666;font-size:10px;font-style:italic;margin-bottom:4px;">${data.store.tagline}</div>` : ""}
    <div style="color:#555;font-size:10px;line-height:1.6;">
      ${data.store?.address ? `<div>${data.store.address}</div>` : ""}
      ${data.store?.phone ? `<div>Tel: ${data.store.phone}</div>` : ""}
      ${data.store?.email ? `<div>Email: ${data.store.email}</div>` : ""}
      ${data.store?.website ? `<div>Web: ${data.store.website}</div>` : ""}
    </div>
  </div>

  <!-- Receipt info -->
  <div style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;">
    <div style="display:flex;justify-content:space-between;font-size:11px;">
      <div><span style="color:#666;">Receipt No:</span> <strong>${data.code}</strong></div>
      <div><span style="color:#666;">Kasir:</span> <strong>${data.cashierName ?? "-"}</strong></div>
    </div>
    <div style="color:#555;font-size:10px;margin-top:2px;">Date: ${dateStr}</div>
  </div>

  <!-- Items header -->
  <div style="display:flex;justify-content:space-between;font-weight:700;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:6px;font-size:11px;">
    <span>Item</span><span>Total</span>
  </div>

  <!-- Items -->
  <div style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;">
    ${itemsHtml}
  </div>

  <!-- Summary -->
  <div style="padding-bottom:8px;margin-bottom:8px;font-size:11px;border-bottom:1px dashed #000;">
    <div style="display:flex;justify-content:space-between;">
      <span>Subtotal</span><span>${formatRupiah(subtotal)}</span>
    </div>
    ${discountHtml}
    <div style="display:flex;justify-content:space-between;">
      <span>Tax (${taxRate}%)</span><span>${formatRupiah(tax)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px;border-top:2px solid #000;margin-top:4px;padding-top:4px;">
      <span>TOTAL</span><span>${formatRupiah(total)}</span>
    </div>
  </div>

  <!-- Payment -->
  <div style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;font-size:11px;">
    <div style="display:flex;justify-content:space-between;">
      <span>Bayar (${data.payment_method?.toUpperCase()})</span><span>${formatRupiah(paid)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-weight:600;">
      <span>Kembalian</span><span>${formatRupiah(change)}</span>
    </div>
  </div>

  ${wifiHtml}

  <!-- Footer -->
  <div style="text-align:center;padding-top:8px;font-size:11px;">
    <div style="font-weight:600;">${data.store?.receipt_footer ?? "Terima kasih telah berkunjung!"}</div>
    <div style="color:#666;margin-top:4px;">Order #${data.code}</div>
    <div style="color:#999;font-size:9px;margin-top:4px;">--- End of Receipt ---</div>
  </div>

</div>
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 500);
  };
</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      toast.error("Popup diblokir! Izinkan popup di browser kamu lalu coba lagi.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const copyWiFi = () => {
    const wifiInfo = `${data.store?.wifi_ssid} | ${data.store?.wifi_password}`;
    navigator.clipboard.writeText(wifiInfo);
    toast.success("WiFi info disalin!");
  };

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader className="sticky top-0 bg-white border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>Receipt #{data.code}</DialogTitle>
            <button onClick={onClose} className="hover:opacity-70 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="receipt-printable flex-1 overflow-y-auto">
          <div
            className="receipt-content bg-white text-black p-6 font-mono text-xs leading-relaxed"
            style={{ width: "80mm", margin: "0 auto" }}
          >
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-black pb-4">
              {data.store?.logo_url && (
                <div className="mb-3 flex justify-center">
                  <img src={data.store.logo_url} alt="Logo" className="h-12 w-12 object-cover" />
                </div>
              )}
              <div className="font-bold text-lg mb-1">{data.store?.name ?? "Kopi Nako"}</div>
              {data.store?.tagline && (
                <div className="text-gray-600 text-xs italic mb-2">{data.store.tagline}</div>
              )}
              <div className="text-gray-700 text-xs space-y-0.5">
                <div>{data.store?.address}</div>
                <div>Tel: {data.store?.phone}</div>
                <div>Email: {data.store?.email}</div>
                {data.store?.website && <div>Web: {data.store.website}</div>}
              </div>
            </div>

            {/* Receipt Number & Date */}
            <div className="border-b border-dashed border-black py-3 space-y-1">
              <div className="flex justify-between text-xs">
                <div><span className="text-gray-600">Receipt No:</span><span className="font-bold ml-2">{data.code}</span></div>
                <div><span className="text-gray-600">Kasir:</span><span className="font-semibold ml-2">{data.cashierName}</span></div>
              </div>
              <div className="text-xs text-gray-700">
                Date: {new Date(data.created_at).toLocaleString("id-ID", {
                  weekday: "short", year: "numeric", month: "short",
                  day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </div>
            </div>

            {/* Items */}
            <div className="flex justify-between border-b border-black py-2 text-xs font-bold">
              <span>Item</span><span>Total</span>
            </div>
            <div className="border-b border-dashed border-black py-2 space-y-1">
              {data.items.map((it: any, idx: number) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold flex-1">{it.name}</span>
                    <span className="font-semibold">{it.isPromo ? "FREE" : formatRupiah(it.price * it.qty)}</span>
                  </div>
                  <div className="text-gray-600 text-[10px]">{it.qty}x {it.isPromo ? "PROMO" : formatRupiah(it.price)}</div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="py-2 space-y-1 text-xs border-b border-dashed border-black">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(Number(data.subtotal))}</span></div>
              {Number(data.discount) > 0 && (
                <div className="flex justify-between text-gray-700"><span>Discount</span><span>- {formatRupiah(Number(data.discount))}</span></div>
              )}
              <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{formatRupiah(Number(data.tax))}</span></div>
              <div className="border-t-2 border-black pt-2 mt-1 flex justify-between font-bold">
                <span>TOTAL</span><span>{formatRupiah(Number(data.total))}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="border-b border-dashed border-black py-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Bayar ({data.payment_method?.toUpperCase()})</span>
                <span>{formatRupiah(Number(data.paid_amount))}</span>
              </div>
              <div className="flex justify-between">
                <span>Kembalian</span>
                <span className="font-semibold">{formatRupiah(Number(data.change_amount))}</span>
              </div>
            </div>

            {/* WiFi */}
            {data.store?.show_wifi_on_receipt && data.store?.wifi_ssid && (
              <div className="border-b border-dashed border-black py-3">
                <div className="font-bold text-xs mb-2 uppercase">WiFi Information</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-600">SSID:</span><span className="font-bold">{data.store.wifi_ssid}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Pass:</span><span className="font-bold">{data.store.wifi_password}</span></div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center py-3 text-xs space-y-1">
              <div className="font-semibold">{data.store?.receipt_footer ?? "Terima kasih telah berkunjung!"}</div>
              <div className="text-gray-600">Order #{data.code}</div>
              <div className="text-[9px] text-gray-600 mt-1">--- End of Receipt ---</div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 pb-4 gap-2 flex flex-wrap justify-end" style={{ minHeight: "60px" }}>
          {data.store?.show_wifi_on_receipt && data.store?.wifi_ssid && (
            <Button variant="outline" size="sm" onClick={copyWiFi} className="flex items-center gap-2">
              <Copy className="w-4 h-4" /> Copy WiFi
            </Button>
          )}
          <Button variant="outline" onClick={onClose} size="sm">Tutup</Button>
          <Button onClick={handlePrint} className="bg-black text-white hover:bg-gray-800 flex items-center gap-2" size="sm">
            <Printer className="w-4 h-4" /> Print Struk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}