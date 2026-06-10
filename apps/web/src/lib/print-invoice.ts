/* Professional Invoice & Receipt printing for Bloom ERP — Multi-tenant */

interface InvoiceData {
  order_number: string;
  receipt_number?: string;
  date: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_city?: string;
  customer_governorate?: string;
  shipping_address?: string;
  items: { name: string; sku?: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paid: number;
  payment_method?: string;
  channel?: string;
  notes?: string;
}

function getTenantBranding() {
  try {
    const raw = localStorage.getItem('bloom-auth');
    if (raw) {
      const state = JSON.parse(raw)?.state;
      const tenant = state?.tenant;
      if (tenant) return tenant;
    }
  } catch {}
  return {
    name: 'Bloom',
    tagline: 'Beauty & Cosmetics',
    primaryColor: '#059669',
    email: '',
    city: '',
    website: '',
    invoiceHeader: null,
    invoiceFooter: null,
    receiptHeader: null,
    receiptFooter: null,
  };
}

function buildAddressHTML(data: InvoiceData): string {
  const parts: string[] = [];
  if (data.customer_address) parts.push(data.customer_address);
  if (data.customer_city) parts.push(data.customer_city);
  if (data.customer_governorate && data.customer_governorate !== data.customer_city) parts.push(data.customer_governorate);
  return parts.join('، ');
}

export function printA4Invoice(data: InvoiceData) {
  const w = window.open('', '_blank');
  if (!w) return;
  const b = getTenantBranding();
  const companyName = b.name || 'Bloom';
  const tagline = b.tagline || 'Beauty & Cosmetics';
  const color = b.primaryColor || '#059669';
  const city = b.city || '';
  const email = b.email || '';
  const website = b.website || '';
  const header = b.invoiceHeader || `✨ ${companyName}`;
  const footer = b.invoiceFooter || `Thank you for shopping with ${companyName}! ✨`;
  const customerAddress = buildAddressHTML(data);

  const itemRows = data.items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px">${i.name}${i.sku ? `<br/><span style="color:#999;font-size:11px">${i.sku}</span>` : ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px">EGP ${(i.unit_price / 100).toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:600">EGP ${(i.total / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const vatLine = data.tax > 0 ? `
    <tr><td style="padding:4px 0;color:#666;font-size:13px">VAT (14%)</td><td style="padding:4px 0;text-align:right;font-size:13px">EGP ${(data.tax / 100).toFixed(2)}</td></tr>
  ` : '';

  const discountLine = data.discount > 0 ? `
    <tr><td style="padding:4px 0;color:${color};font-size:13px">Discount</td><td style="padding:4px 0;text-align:right;color:${color};font-size:13px">- EGP ${(data.discount / 100).toFixed(2)}</td></tr>
  ` : '';

  const shippingLine = data.shipping > 0 ? `
    <tr><td style="padding:4px 0;color:#666;font-size:13px">Shipping</td><td style="padding:4px 0;text-align:right;font-size:13px">EGP ${(data.shipping / 100).toFixed(2)}</td></tr>
  ` : '';

  // Shipping address section (if different from billing)
  const shippingAddressHTML = data.shipping_address ? `
  <div style="background:#fafafa;border-radius:10px;padding:16px;margin-bottom:24px">
    <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Ship To</p>
    <p style="color:#444;font-size:14px">${typeof data.shipping_address === 'object' ? JSON.stringify(data.shipping_address) : data.shipping_address}</p>
  </div>
  ` : '';

  w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${data.order_number}</title>
<style>
  @page { margin: 15mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.5; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
<div style="max-width:800px;margin:0 auto;padding:20px">

  <!-- Print Button -->
  <div class="no-print" style="text-align:center;margin-bottom:20px">
    <button onclick="window.print()" style="background:${color};color:white;border:none;padding:12px 40px;border-radius:8px;font-size:16px;cursor:pointer;font-weight:600">
      🖨️ Print Invoice
    </button>
    <button onclick="window.close()" style="background:#eee;color:#333;border:none;padding:12px 30px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:10px">
      Close
    </button>
  </div>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid ${color}">
    <div>
      <h1 style="font-size:32px;font-weight:800;color:${color};margin-bottom:4px">${header}</h1>
      <p style="color:#888;font-size:13px">${tagline}</p>
      ${city ? `<p style="color:#888;font-size:12px;margin-top:8px">📍 ${city}, Egypt</p>` : ''}
      ${email ? `<p style="color:#888;font-size:12px">✉️ ${email}</p>` : ''}
    </div>
    <div style="text-align:right">
      <h2 style="font-size:28px;font-weight:700;color:#333;margin-bottom:8px">INVOICE</h2>
      <table style="font-size:13px;margin-left:auto">
        <tr><td style="color:#888;padding-right:12px">Invoice #</td><td style="font-weight:600">${data.order_number}</td></tr>
        ${data.receipt_number ? `<tr><td style="color:#888;padding-right:12px">Receipt #</td><td style="font-weight:600">${data.receipt_number}</td></tr>` : ''}
        <tr><td style="color:#888;padding-right:12px">Date</td><td style="font-weight:600">${data.date}</td></tr>
        ${data.channel ? `<tr><td style="color:#888;padding-right:12px">Channel</td><td style="font-weight:600">${data.channel.toUpperCase()}</td></tr>` : ''}
        ${data.payment_method ? `<tr><td style="color:#888;padding-right:12px">Payment</td><td style="font-weight:600">${data.payment_method}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <!-- Customer / Bill To -->
  ${data.customer_name ? `
  <div style="display:flex;gap:24px;margin-bottom:24px">
    <div style="flex:1;background:#fafafa;border-radius:10px;padding:16px">
      <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Bill To</p>
      <p style="font-weight:600;font-size:16px">${data.customer_name}</p>
      ${data.customer_phone ? `<p style="color:#666;font-size:13px;margin-top:4px">📞 ${data.customer_phone}</p>` : ''}
      ${data.customer_email ? `<p style="color:#666;font-size:13px">✉️ ${data.customer_email}</p>` : ''}
      ${customerAddress ? `<p style="color:#666;font-size:13px;margin-top:4px">📍 ${customerAddress}</p>` : ''}
    </div>
    ${data.shipping_address ? `
    <div style="flex:1;background:#fafafa;border-radius:10px;padding:16px">
      <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Ship To</p>
      <p style="color:#444;font-size:14px">${typeof data.shipping_address === 'object' ? JSON.stringify(data.shipping_address) : data.shipping_address}</p>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#f8f8f8">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee">Product</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end">
    <table style="min-width:280px">
      <tr><td style="padding:4px 0;color:#666;font-size:13px">Subtotal</td><td style="padding:4px 0;text-align:right;font-size:13px">EGP ${(data.subtotal / 100).toFixed(2)}</td></tr>
      ${discountLine}
      ${vatLine}
      ${shippingLine}
      <tr style="border-top:2px solid #333"><td style="padding:10px 0;font-size:18px;font-weight:700">Total</td><td style="padding:10px 0;text-align:right;font-size:18px;font-weight:700;color:${color}">EGP ${(data.total / 100).toFixed(2)}</td></tr>
      <tr><td style="padding:2px 0;color:#16a34a;font-size:13px;font-weight:600">Amount Paid</td><td style="padding:2px 0;text-align:right;color:#16a34a;font-size:13px;font-weight:600">EGP ${(data.paid / 100).toFixed(2)}</td></tr>
    </table>
  </div>

  ${data.notes ? `<div style="margin-top:20px;padding:12px;background:#fffbeb;border-radius:8px;border-left:4px solid #f59e0b"><p style="color:#92400e;font-size:12px"><strong>Notes:</strong> ${data.notes}</p></div>` : ''}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center">
    <p style="color:${color};font-weight:600;font-size:14px">${footer}</p>
    ${website ? `<p style="color:#aaa;font-size:11px;margin-top:6px">${website}</p>` : ''}
    <p style="color:#ccc;font-size:9px;margin-top:4px">Powered by Bloom</p>
  </div>
</div>
</body></html>`);
  w.document.close();
}

export function printThermalReceipt(data: InvoiceData) {
  const w = window.open('', '_blank');
  if (!w) return;
  const b = getTenantBranding();
  const receiptHeader = b.receiptHeader || `✨ ${(b.name || 'BLOOM').toUpperCase()} ✨`;
  const tagline = b.tagline || 'Beauty & Cosmetics';
  const city = b.city || '';
  const receiptFooter = b.receiptFooter || 'Thank you for shopping! ✨';
  const website = b.website || '';
  const customerAddress = buildAddressHTML(data);

  const items = data.items.map(i => `
    <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12px">
      <span>${i.name} ×${i.quantity}</span>
      <span>EGP ${(i.total / 100).toFixed(2)}</span>
    </div>
  `).join('');

  w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
<style>
  @page { margin: 2mm; size: 80mm auto; }
  body { font-family: monospace; font-size: 12px; width: 76mm; margin: 0 auto; color: #000; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
<div class="no-print" style="text-align:center;margin:10px 0">
  <button onclick="window.print()" style="background:#059669;color:white;border:none;padding:8px 24px;border-radius:6px;cursor:pointer">🖨️ Print</button>
  <button onclick="window.close()" style="background:#eee;color:#333;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-left:5px">Close</button>
</div>
<div style="text-align:center;padding:8px 0">
  <div style="font-size:18px;font-weight:bold">${receiptHeader}</div>
  <div style="font-size:10px;color:#666">${tagline}</div>
  ${city ? `<div style="font-size:10px;color:#666">${city}, Egypt</div>` : ''}
</div>
<div class="line"></div>
<div style="display:flex;justify-content:space-between;font-size:11px">
  <span>#${data.receipt_number || data.order_number}</span>
  <span>${data.date}</span>
</div>
${data.customer_name ? `<div style="font-size:11px"><b>Customer:</b> ${data.customer_name}</div>` : ''}
${data.customer_phone ? `<div style="font-size:11px"><b>Phone:</b> ${data.customer_phone}</div>` : ''}
${customerAddress ? `<div style="font-size:11px"><b>Address:</b> ${customerAddress}</div>` : ''}
${data.payment_method ? `<div style="font-size:11px"><b>Payment:</b> ${data.payment_method}</div>` : ''}
<div class="line"></div>
${items}
<div class="line"></div>
<div style="display:flex;justify-content:space-between;font-size:12px"><span>Subtotal</span><span>EGP ${(data.subtotal / 100).toFixed(2)}</span></div>
${data.discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px"><span>Discount</span><span>-EGP ${(data.discount / 100).toFixed(2)}</span></div>` : ''}
${data.tax > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px"><span>VAT 14%</span><span>EGP ${(data.tax / 100).toFixed(2)}</span></div>` : ''}
${data.shipping > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px"><span>Shipping</span><span>EGP ${(data.shipping / 100).toFixed(2)}</span></div>` : ''}
<div class="line"></div>
<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;padding:4px 0">
  <span>TOTAL</span><span>EGP ${(data.total / 100).toFixed(2)}</span>
</div>
<div style="display:flex;justify-content:space-between;font-size:12px"><span>Paid</span><span>EGP ${(data.paid / 100).toFixed(2)}</span></div>
<div class="line"></div>
<div style="text-align:center;padding:8px 0">
  <div style="font-size:11px;font-weight:bold">${receiptFooter}</div>
  ${website ? `<div style="font-size:9px;color:#888;margin-top:4px">${website}</div>` : ''}
</div>
</body></html>`);
  w.document.close();
}
