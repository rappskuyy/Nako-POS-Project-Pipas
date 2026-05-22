import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/format";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";

interface ReceiptProps {
  data: any;
  onClose: () => void;
  taxRate: number;
}

export function ReceiptDialog({ data, onClose, taxRate }: ReceiptProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const receiptHtml = document.querySelector(".receipt-printable")?.innerHTML;
    if (printWindow && receiptHtml) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; }
              body { font-family: 'Courier New', monospace; width: 80mm; }
              .receipt { width: 80mm; padding: 0; }
              .receipt-content { background: white; color: black; }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${receiptHtml}
            </div>
            <script>
              window.print();
              window.close();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
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
            <button
              onClick={onClose}
              className="hover:opacity-70 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Receipt Content */}
        <div className="receipt-printable flex-1 overflow-y-auto">
          <div className="receipt-content bg-white text-black p-6 font-mono text-xs leading-relaxed"
               style={{ width: "80mm", margin: "0 auto" }}>
            
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-black pb-4">
              {data.store?.logo_url && (
                <div className="mb-3 flex justify-center">
                  <img
                    src={data.store.logo_url}
                    alt="Logo"
                    className="h-12 w-12 object-cover"
                  />
                </div>
              )}

              {/* Store Name */}
              <div className="font-bold text-lg mb-1">
                {data.store?.name ?? "Kopi Nako"}
              </div>

              {/* Tagline */}
              {data.store?.tagline && (
                <div className="text-gray-600 text-xs italic mb-2">
                  {data.store.tagline}
                </div>
              )}

              {/* Contact Info */}
              <div className="text-gray-700 text-xs space-y-0.5">
                <div>{data.store?.address}</div>
                <div>Tel: {data.store?.phone}</div>
                <div>Email: {data.store?.email}</div>
                {data.store?.website && <div>Web: {data.store.website}</div>}
              </div>
            </div>

            {/* Receipt Number & Date */}
            <div className="border-b border-black py-3 space-y-1">
              <div className="flex justify-between text-xs">
                <div>
                  <span className="text-gray-600">Receipt No:</span>
                  <span className="font-bold ml-2">{data.code}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600">Cashier:</span>
                  <span className="font-semibold ml-2">{data.cashierName}</span>
                </div>
              </div>
              <div className="text-xs text-gray-700">
                Date: {new Date(data.created_at).toLocaleString("id-ID", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* Items Header */}
            <div className="flex justify-between border-b border-black py-2 text-xs font-bold">
              <span>Item</span>
              <span>Qty x Price</span>
              <span className="text-right">Total</span>
            </div>

            {/* Items */}
            <div className="border-b border-black py-2 space-y-1">
              {data.items.map((it: any, idx: number) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold flex-1">{it.name}</span>
                    <span className="text-right font-semibold">
                      {it.isPromo ? "FREE" : formatRupiah(it.price * it.qty)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-[10px]">
                    <span>{it.qty}x {it.isPromo ? "PROMO" : formatRupiah(it.price)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="py-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(Number(data.subtotal))}</span>
              </div>

              {Number(data.discount) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount</span>
                  <span>- {formatRupiah(Number(data.discount))}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Tax ({taxRate}%)</span>
                <span>{formatRupiah(Number(data.tax))}</span>
              </div>

              <div className="border-t-2 border-black pt-2 mt-1 flex justify-between font-bold">
                <span>TOTAL</span>
                <span>{formatRupiah(Number(data.total))}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border-b border-black py-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Payment ({data.payment_method.toUpperCase()})</span>
                <span>{formatRupiah(Number(data.paid_amount))}</span>
              </div>
              <div className="flex justify-between">
                <span>Change</span>
                <span className="font-semibold">{formatRupiah(Number(data.change_amount))}</span>
              </div>
            </div>

            {/* WiFi Section */}
            {data.store?.show_wifi_on_receipt && data.store?.wifi_ssid && (
              <div className="border-b border-black py-3">
                <div className="font-bold text-xs mb-2 uppercase">WiFi Information</div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-600">SSID:</span>
                    <span className="font-bold">{data.store.wifi_ssid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pass:</span>
                    <span className="font-bold">{data.store.wifi_password}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center py-3 text-xs space-y-1">
              <div className="font-semibold">{data.store?.receipt_footer ?? "Thank you for visiting"}</div>
              <div className="text-gray-600">Order #{data.code}</div>
              <div className="text-[9px] text-gray-600 mt-1">--- End of Receipt ---</div>
            </div>
          </div>
        </div>

        {/* Dialog Footer - Controls */}
        <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 pb-4 gap-2 flex flex-wrap justify-end"
                       style={{ minHeight: "60px" }}>
          {data.store?.show_wifi_on_receipt && data.store?.wifi_ssid && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyWiFi}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy WiFi
            </Button>
          )}
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-black text-white hover:bg-gray-800" size="sm">
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
