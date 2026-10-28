import React from 'react';
import { MergedProduct } from '../types';

interface SilhouetteBreakdownProps {
  products: MergedProduct[];
  onSelectSilhouette: (silhouette: string) => void;
}

export const SilhouetteBreakdown: React.FC<SilhouetteBreakdownProps> = ({
  products,
  onSelectSilhouette,
}) => {
  // Aggregate stats by silhouette
  const silhouetteMap = new Map<
    string,
    {
      name: string;
      ordered: number;
      sold: number;
      wholesale: number;
      revenue: number;
      skus: MergedProduct[];
    }
  >();

  products.forEach((p) => {
    const sil = p.silhouette || 'Other';
    const entry = silhouetteMap.get(sil) || {
      name: sil,
      ordered: 0,
      sold: 0,
      wholesale: 0,
      revenue: 0,
      skus: [],
    };
    entry.ordered += p.unitsOrdered;
    entry.sold += p.unitsSold;
    entry.wholesale += p.totalWholesaleEur;
    entry.revenue += p.realizedRevenueEur;
    entry.skus.push(p);
    silhouetteMap.set(sil, entry);
  });

  const categories = Array.from(silhouetteMap.values()).map((c) => ({
    ...c,
    sellOutPct: c.ordered > 0 ? (c.sold / c.ordered) * 100 : 0,
    topStyle: c.skus.reduce((best, cur) => (cur.unitsSold > best.unitsSold ? cur : best), c.skus[0]),
  })).sort((a, b) => b.sold - a.sold);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-luxury text-xl font-semibold text-stone-900">
            Performance per Categoria & Silhouette
          </h2>
          <p className="text-xs text-stone-500">
            Confronto sell-out, volumi acquistati e fatturato realizzato per tipologia di capo
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const isHigh = cat.sellOutPct >= 70;
          const isLow = cat.sellOutPct < 40;

          return (
            <div
              key={cat.name}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-xs transition hover:border-stone-400"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif-luxury text-lg font-semibold text-stone-900">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-stone-400">
                    {cat.skus.length} modelli in assortimento
                  </span>
                </div>
                <span
                  className={`font-serif-luxury text-xl font-semibold ${
                    isHigh ? 'text-emerald-800' : isLow ? 'text-amber-800' : 'text-stone-800'
                  }`}
                >
                  {cat.sellOutPct.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    isHigh ? 'bg-emerald-600' : isLow ? 'bg-amber-500' : 'bg-stone-700'
                  }`}
                  style={{ width: `${Math.min(100, cat.sellOutPct)}%` }}
                />
              </div>

              {/* Key numbers */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-100 pt-3 text-center text-xs">
                <div>
                  <span className="block text-stone-400 text-[11px]">Ordinati</span>
                  <span className="font-semibold text-stone-900">{cat.ordered} pcs</span>
                </div>
                <div>
                  <span className="block text-stone-400 text-[11px]">Venduti</span>
                  <span className="font-semibold text-stone-900">{cat.sold} pcs</span>
                </div>
                <div>
                  <span className="block text-stone-400 text-[11px]">Incasso</span>
                  <span className="font-semibold text-stone-900">
                    €{cat.revenue.toLocaleString('it-IT')}
                  </span>
                </div>
              </div>

              {/* Top Seller in this category */}
              {cat.topStyle && (
                <div className="mt-3 rounded bg-stone-50 p-2 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={cat.topStyle.image}
                      alt={cat.topStyle.styleName}
                      className="h-8 w-6 rounded object-cover"
                    />
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wide">Top SKU</span>
                      <div className="font-medium text-stone-800">{cat.topStyle.styleName}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800">
                    {cat.topStyle.unitsSold} pcs ({cat.topStyle.sellOutPct.toFixed(0)}%)
                  </span>
                </div>
              )}

              <button
                onClick={() => onSelectSilhouette(cat.name)}
                className="mt-3 w-full rounded border border-stone-200 py-1.5 text-center text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition"
              >
                Filtra capi {cat.name} →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
