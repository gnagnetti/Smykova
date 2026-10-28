import React from 'react';
import { OrderItem, MergedProduct } from '../types';
import { FileSpreadsheet, Ban, CheckCircle2, Clock } from 'lucide-react';

interface PoComparisonViewProps {
  orders: OrderItem[];
  products: MergedProduct[];
}

export const PoComparisonView: React.FC<PoComparisonViewProps> = ({ orders, products }) => {
  // Group orders by PO Number
  const poMap = new Map<
    string,
    {
      poNumber: string;
      items: OrderItem[];
      totalUnits: number;
      totalEur: number;
    }
  >();

  orders.forEach((o) => {
    const entry = poMap.get(o.poNumber) || {
      poNumber: o.poNumber,
      items: [],
      totalUnits: 0,
      totalEur: 0,
    };
    entry.items.push(o);
    entry.totalUnits += o.unitsOrdered;
    entry.totalEur += o.totalEur;
    poMap.set(o.poNumber, entry);
  });

  const poList = Array.from(poMap.values());

  // Cancelled items identified in prompt
  const cancelledStyles = [
    {
      po: 'PO# 19085382',
      styleName: 'Cips',
      styleNumber: '100503',
      color: '64400000000',
      colorCode: 'Celeste(0644)',
      silhouette: 'Polo Shirt - PO',
      fabrication: '75% WP 25% PA',
      units: 0,
      wholesaleEur: 127,
      totalEur: 127,
      reason: 'Cancelled by production / fabric shortage',
    },
    {
      po: 'PO# 18827955',
      styleName: 'Girevole',
      styleNumber: '543517',
      color: '340600000000',
      colorCode: 'Var Verde _ Senape(3406)',
      silhouette: 'Dress - AB',
      fabrication: '48% LY 44% VI 8% WO',
      units: 0,
      wholesaleEur: 183,
      totalEur: 549,
      reason: 'Cancelled style colorway variation',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif-luxury text-xl font-semibold text-stone-900">
          Riconciliazione Ordini di Acquisto (Multi-PO Consolidation)
        </h2>
        <p className="text-xs text-stone-500">
          Analisi comparativa dei 4 ordini d'acquisto JOOR Luisa Spagnoli e monitoraggio capi cancellati
        </p>
      </div>

      {/* PO Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {poList.map((po) => {
          // Calculate sell out for styles in this PO
          const relatedProducts = products.filter((p) => p.poNumbers.includes(po.poNumber));
          const poSold = relatedProducts.reduce((acc, p) => acc + p.unitsSold, 0);
          const poOrdered = relatedProducts.reduce((acc, p) => acc + p.unitsOrdered, 0);
          const poSellOut = poOrdered > 0 ? (poSold / poOrdered) * 100 : 0;

          return (
            <div
              key={po.poNumber}
              className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-stone-800">
                  {po.poNumber}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3 w-3" /> Approvato
                </span>
              </div>

              <div className="mt-3">
                <div className="font-serif-luxury text-2xl font-semibold text-stone-900">
                  {po.totalUnits} <span className="text-xs font-sans-clean font-normal text-stone-500">capi ordinati</span>
                </div>
                <div className="text-xs text-stone-500 font-sans-clean">
                  Investito: <strong>€{po.totalEur.toLocaleString('it-IT')}</strong> wholesale
                </div>
              </div>

              <div className="mt-3 border-t border-stone-100 pt-3">
                <div className="flex justify-between text-xs font-sans-clean">
                  <span className="text-stone-500">Sell-Out generato:</span>
                  <span className="font-semibold text-emerald-800">{poSellOut.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${Math.min(100, poSellOut)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-stone-400">
                  <span>{po.items.length} modelli unici</span>
                  <span>{poSold} venduti</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancelled Styles Alert Table */}
      <div className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50/30 shadow-xs">
        <div className="flex items-center justify-between border-b border-amber-200/80 bg-amber-100/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-amber-800" />
            <h3 className="font-serif-luxury text-base font-semibold text-amber-950">
              Capi e Varianti Cancellate (Cancelled Styles in JOOR)
            </h3>
          </div>
          <span className="text-xs text-amber-800 font-medium">
            2 Modelli Segnalati da Sede Spagnoli
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="border-b border-amber-200/60 bg-amber-50 text-[11px] text-amber-900 uppercase">
              <tr>
                <th className="py-2.5 px-4">PO Origine</th>
                <th className="py-2.5 px-4">Nome Modello</th>
                <th className="py-2.5 px-3">Colore / Codice</th>
                <th className="py-2.5 px-3">Silhouette</th>
                <th className="py-2.5 px-3">Composizione Tessuto</th>
                <th className="py-2.5 px-3 text-right">Wholesale (EUR)</th>
                <th className="py-2.5 px-4">Motivo / Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 bg-white">
              {cancelledStyles.map((cs) => (
                <tr key={`${cs.po}-${cs.styleName}`} className="hover:bg-amber-50/50">
                  <td className="py-2.5 px-4 font-mono font-medium text-stone-800">{cs.po}</td>
                  <td className="py-2.5 px-4 font-serif-luxury font-semibold text-stone-900 text-sm">
                    {cs.styleName} <span className="font-mono text-xs text-stone-400 font-normal">#{cs.styleNumber}</span>
                  </td>
                  <td className="py-2.5 px-3 text-stone-600">{cs.colorCode}</td>
                  <td className="py-2.5 px-3 text-stone-600">{cs.silhouette}</td>
                  <td className="py-2.5 px-3 text-stone-500 text-[11px]">{cs.fabrication}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-stone-800">€{cs.wholesaleEur}</td>
                  <td className="py-2.5 px-4 text-rose-700 font-medium text-[11px]">
                    {cs.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
