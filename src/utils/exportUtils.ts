import { MergedProduct, OrderItem } from '../types';

export function exportSellOutReportCSV(products: MergedProduct[], filename = 'report_sell_out_finale.csv') {
  const headers = [
    'Style Name',
    'Style Clean',
    'Style Number',
    'Color Code',
    'Color Prefix',
    'Silhouette',
    'Linesheet',
    'Fabrication',
    'Image URL',
    'Qty Ordered',
    'Qty Sold',
    'Stock Remaining',
    'Sell Out Pct (%)',
    'Wholesale (EUR)',
    'Sugg. Retail (EUR)',
    'Total Wholesale (EUR)',
    'Realized Retail Revenue (EUR)',
    'PO Numbers',
  ];

  const rows = products.map((p) => [
    `"${(p.styleName || '').replace(/"/g, '""')}"`,
    `"${p.styleClean}"`,
    `"${p.styleNumber}"`,
    `"${(p.colorCode || p.color).replace(/"/g, '""')}"`,
    `"${p.colorPrefix}"`,
    `"${p.silhouette}"`,
    `"${p.linesheet}"`,
    `"${(p.fabrication || '').replace(/"/g, '""')}"`,
    `"${p.image}"`,
    p.unitsOrdered,
    p.unitsSold,
    p.stockRemaining,
    p.sellOutPct.toFixed(1),
    p.wholesaleEur,
    p.suggRetailEur,
    p.totalWholesaleEur,
    p.realizedRevenueEur,
    `"${p.poNumbers.join(', ')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportConsolidatedOrdersCSV(orders: OrderItem[], filename = 'export_ordini_totale.csv') {
  const headers = [
    'PO Number',
    'Style Name',
    'Style Number',
    'Color',
    'Color Code',
    'Silhouette',
    'Fabrication',
    'Wholesale (EUR)',
    'Sugg. Retail (EUR)',
    'Units Ordered',
    'Total (EUR)',
    'Sizes Breakdown',
    'Status',
  ];

  const rows = orders.map((o) => {
    const sizeStr = Object.entries(o.sizes)
      .map(([sz, q]) => `${sz}:${q}`)
      .join(' | ');

    return [
      `"${o.poNumber}"`,
      `"${(o.styleName || '').replace(/"/g, '""')}"`,
      `"${o.styleNumber}"`,
      `"${o.color}"`,
      `"${(o.colorCode || '').replace(/"/g, '""')}"`,
      `"${o.silhouette}"`,
      `"${(o.fabrication || '').replace(/"/g, '""')}"`,
      o.wholesaleEur,
      o.suggRetailEur,
      o.unitsOrdered,
      o.totalEur,
      `"${sizeStr}"`,
      `"${o.status || 'Approved'}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function downloadSampleSellOutCsv() {
  const content =
`Style Name,Color,Size,Qty Sold
Morolo,Nero,S,1
Morolo,Nero,L,1
Mossa,0319,M,1
Mossa,0319,L,1
Mossa,0319,XL,1
Faggi,3331,40,2
Faggi,3331,42,3
Faggi,3331,44,2
Faggi,3331,46,1
Spettatore,3331,40,1
Spettatore,3331,42,2
Spettatore,3331,44,1
Spettatore,3331,46,1
Domenica,1020,40,2
Domenica,1020,42,3
Domenica,1020,44,1
Domenica,1020,46,1`;

  downloadBlob('\uFEFF' + content, 'template_sell_out_boutique.csv', 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printReportToPdf(products: MergedProduct[], boutiqueInfo: any) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Impossibile aprire la finestra di stampa. Controlla le impostazioni dei popup del browser.");
    return;
  }

  const totalOrdered = products.reduce((acc, p) => acc + p.unitsOrdered, 0);
  const totalSold = products.reduce((acc, p) => acc + p.unitsSold, 0);
  const overallSellOut = totalOrdered > 0 ? ((totalSold / totalOrdered) * 100).toFixed(1) : '0';
  const totalRevenue = products.reduce((acc, p) => acc + p.realizedRevenueEur, 0).toLocaleString('it-IT');
  const totalWholesale = products.reduce((acc, p) => acc + p.totalWholesaleEur, 0).toLocaleString('it-IT');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Luisa Spagnoli - Sell-Out Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1c1917; margin: 20px; font-size: 12px; }
          .header { border-bottom: 2px solid #78350f; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { font-size: 24px; margin: 0; font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 1px; color: #1c1917; }
          .subtitle { font-size: 11px; color: #78350f; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
          .meta { font-size: 11px; color: #57534e; margin-top: 6px; }
          .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
          .kpi-card { border: 1px solid #e7e5e4; padding: 12px; border-radius: 6px; background: #fafaf9; }
          .kpi-title { font-size: 10px; color: #78716c; text-transform: uppercase; }
          .kpi-value { font-size: 20px; font-weight: bold; font-family: Georgia, serif; margin-top: 4px; color: #1c1917; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #e7e5e4; padding: 8px 10px; text-align: left; vertical-align: middle; }
          th { background: #f5f5f4; color: #1c1917; text-transform: uppercase; font-size: 10px; }
          img { width: 40px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #d6d3d1; }
          .badge { padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
          .badge-high { background: #d1fae5; color: #065f46; }
          .badge-mid { background: #fef3c7; color: #92400e; }
          .badge-low { background: #fee2e2; color: #991b1b; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Luisa Spagnoli</h1>
            <div class="subtitle">Sell-Out & Merchandising Intelligence Report</div>
            <div class="meta">${boutiqueInfo.location || 'Boutique'} &bull; Rep: ${boutiqueInfo.representative || 'N/A'} &bull; Cust ID: ${boutiqueInfo.customerId || 'N/A'}</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #78716c;">
            Data Report: ${new Date().toLocaleDateString('it-IT')}<br>
            Totale Articoli: ${products.length} SKUs
          </div>
        </div>

        <div class="kpis">
          <div class="kpi-card">
            <div class="kpi-title">Sell-Out Totale</div>
            <div class="kpi-value">${overallSellOut}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Capi Venduti / Ordinati</div>
            <div class="kpi-value">${totalSold} / ${totalOrdered} pcs</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Fatturato Realizzato</div>
            <div class="kpi-value">€${totalRevenue}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Valore Wholesale</div>
            <div class="kpi-value">€${totalWholesale}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">Foto</th>
              <th>Modello</th>
              <th>Colore</th>
              <th>Silhouette</th>
              <th style="text-align: right;">Ordinati</th>
              <th style="text-align: right;">Venduti</th>
              <th style="text-align: right;">Stock</th>
              <th style="text-align: right;">Sell-Out %</th>
              <th style="text-align: right;">Fatturato</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => {
              const badgeClass = p.sellOutPct >= 70 ? 'badge-high' : p.sellOutPct >= 40 ? 'badge-mid' : 'badge-low';
              return `
                <tr>
                  <td><img src="${p.image}" alt="${p.styleName}" /></td>
                  <td><strong>${p.styleName}</strong><br><span style="color: #78716c; font-size: 10px;">#${p.styleNumber}</span></td>
                  <td>${p.colorCode || p.color}</td>
                  <td>${p.silhouette}</td>
                  <td style="text-align: right;">${p.unitsOrdered}</td>
                  <td style="text-align: right; font-weight: bold;">${p.unitsSold}</td>
                  <td style="text-align: right;">${p.stockRemaining}</td>
                  <td style="text-align: right;"><span class="badge ${badgeClass}">${p.sellOutPct.toFixed(1)}%</span></td>
                  <td style="text-align: right;">€${p.realizedRevenueEur.toLocaleString('it-IT')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
