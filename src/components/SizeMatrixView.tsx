import React from 'react';
import { MergedProduct } from '../types';

interface SizeMatrixViewProps {
  products: MergedProduct[];
  onSelect: (product: MergedProduct) => void;
}

export const SizeMatrixView: React.FC<SizeMatrixViewProps> = ({ products, onSelect }) => {
  // Common sizes in boutique
  const primarySizes = ['40', '42', '44', '46', '48', 'XS', 'S', 'M', 'L', 'XL', 'U'];

  // Global aggregate per size
  const sizeTotals: Record<string, { ordered: number; sold: number }> = {};
  primarySizes.forEach((sz) => {
    sizeTotals[sz] = { ordered: 0, sold: 0 };
  });

  products.forEach((p) => {
    Object.entries(p.sizesOrdered).forEach(([sz, ord]) => {
      if (!sizeTotals[sz]) sizeTotals[sz] = { ordered: 0, sold: 0 };
      sizeTotals[sz].ordered += ord;
    });
    Object.entries(p.sizesSold).forEach(([sz, sld]) => {
      if (!sizeTotals[sz]) sizeTotals[sz] = { ordered: 0, sold: 0 };
      sizeTotals[sz].sold += sld;
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif-luxury text-xl font-semibold text-stone-900">
          Analisi Curva Taglie (Size Curve & Stock Health)
        </h2>
        <p className="text-xs text-stone-500">
          Monitoraggio vendite per singola taglia per identificare rotture di stock e riassortimenti
        </p>
      </div>

      {/* Aggregated Size Curve Bar Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {primarySizes.map((sz) => {
          const tot = sizeTotals[sz] || { ordered: 0, sold: 0 };
          if (tot.ordered === 0) return null;
          const pct = tot.ordered > 0 ? (tot.sold / tot.ordered) * 100 : 0;
          const left = tot.ordered - tot.sold;

          return (
            <div key={sz} className="rounded-lg border border-stone-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-stone-900">Taglia {sz}</span>
                <span
                  className={`font-semibold ${
                    pct >= 75 ? 'text-emerald-800' : pct < 45 ? 'text-amber-800' : 'text-stone-700'
                  }`}
                >
                  {pct.toFixed(0)}% S/O
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between text-xs text-stone-500">
                <span>
                  Venduti: <strong className="text-stone-800">{tot.sold}</strong>/{tot.ordered}
                </span>
                <span className="text-[11px] font-mono text-stone-400">Rimanenti: {left}</span>
              </div>

              <div className="mt-2 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${pct >= 75 ? 'bg-emerald-600' : 'bg-stone-700'}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dense SKU Size Matrix Table */}
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xs">
        <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
          <h3 className="font-serif-luxury text-base font-semibold text-stone-900">
            Dettaglio Venduto per Modello e Taglia
          </h3>
          <span className="text-xs text-stone-500">
            Formato: <strong>Venduti / Ordinati</strong> (rosso barrato = taglia esaurita)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-100/60 text-[11px] text-stone-600 uppercase font-medium">
              <tr>
                <th scope="col" className="py-2.5 px-4">
                  Modello & Colore
                </th>
                <th scope="col" className="py-2.5 px-3">
                  Silhouette
                </th>
                {primarySizes.map((sz) => (
                  <th key={sz} scope="col" className="py-2.5 px-2 text-center w-14 font-mono">
                    {sz}
                  </th>
                ))}
                <th scope="col" className="py-2.5 px-3 text-right">
                  Tot. Venduto
                </th>
                <th scope="col" className="py-2.5 px-3 text-right">
                  Tot. Ordinato
                </th>
                <th scope="col" className="py-2.5 px-4 text-right">
                  % S/O
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans-clean">
              {products.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <div className="font-serif-luxury text-sm font-semibold text-stone-900">
                      {p.styleName}
                    </div>
                    <div className="text-[11px] text-stone-400">{p.colorCode || p.color}</div>
                  </td>
                  <td className="py-2.5 px-3 text-stone-700">{p.silhouette}</td>

                  {primarySizes.map((sz) => {
                    const ord = p.sizesOrdered[sz] || 0;
                    const sld = p.sizesSold[sz] || 0;
                    if (ord === 0) {
                      return (
                        <td key={sz} className="py-2.5 px-2 text-center text-stone-300 font-mono text-[11px]">
                          -
                        </td>
                      );
                    }
                    const remaining = ord - sld;
                    const isSoldOut = remaining <= 0;

                    return (
                      <td key={sz} className="py-2.5 px-2 text-center font-mono">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                            isSoldOut
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : sld > 0
                              ? 'bg-emerald-50 text-emerald-900 font-medium'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                          title={`Taglia ${sz}: ${sld} venduti di ${ord} ordinati`}
                        >
                          {sld}/{ord}
                        </span>
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-3 text-right font-semibold text-stone-900">
                    {p.unitsSold} pcs
                  </td>
                  <td className="py-2.5 px-3 text-right text-stone-600">
                    {p.unitsOrdered} pcs
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-emerald-800">
                    {p.sellOutPct.toFixed(1)}%
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
