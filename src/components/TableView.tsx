import React, { useState } from 'react';
import { MergedProduct } from '../types';
import { Eye, ArrowUpDown } from 'lucide-react';

interface TableViewProps {
  products: MergedProduct[];
  onSelect: (product: MergedProduct) => void;
}

export const TableView: React.FC<TableViewProps> = ({ products, onSelect }) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  const fallbackImg =
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="border-b border-stone-200 bg-stone-50 font-medium text-stone-600 uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="py-3 px-4 w-16">
                Foto
              </th>
              <th scope="col" className="py-3 px-4">
                Nome Modello & Colore
              </th>
              <th scope="col" className="py-3 px-3">
                Silhouette
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Pezzi Acquistati
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Pezzi Venduti
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Rimanenza
              </th>
              <th scope="col" className="py-3 px-4 text-right min-w-[150px]">
                <div>% Sell Out</div>
                <div className="text-[9px] font-mono normal-case text-stone-400 font-normal">
                  (venduti / ordinati × 100)
                </div>
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Prezzi (Whs / Ret)
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Incasso Realizzato
              </th>
              <th scope="col" className="py-3 px-3 text-center w-16">
                Azione
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-sans-clean">
            {products.map((p) => {
              const isHigh = p.sellOutPct >= 70;
              const isLow = p.sellOutPct < 40;
              const isOut = p.stockRemaining === 0 && p.unitsOrdered > 0;

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                >
                  {/* Foto Thumbnail */}
                  <td className="py-2.5 px-4">
                    <div className="h-14 w-11 overflow-hidden rounded bg-stone-100 border border-stone-200 shadow-2xs">
                      <img
                        src={imgErrors[p.id] ? fallbackImg : p.image}
                        alt={p.styleName}
                        onError={() => handleImgError(p.id)}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                  </td>

                  {/* Nome Modello & Colore */}
                  <td className="py-2.5 px-4">
                    <div className="font-serif-luxury text-sm font-semibold text-stone-900">
                      {p.styleName}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {p.colorCode || p.color}
                      {p.fabrication && (
                        <span className="block text-[10px] text-stone-400 truncate max-w-xs">
                          {p.fabrication}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Silhouette */}
                  <td className="py-2.5 px-3">
                    <span className="text-stone-800 font-medium">{p.silhouette}</span>
                    <span className="block text-[10px] text-stone-400">{p.linesheet}</span>
                  </td>

                  {/* Pezzi Acquistati */}
                  <td className="py-2.5 px-3 text-right font-medium text-stone-800">
                    {p.unitsOrdered} <span className="text-[10px] text-stone-400 font-normal">pcs</span>
                  </td>

                  {/* Pezzi Venduti */}
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-semibold text-stone-900 text-sm">
                      {p.unitsSold}
                    </span>
                    <span className="text-[10px] text-stone-400"> pcs</span>
                  </td>

                  {/* Rimanenza Stock */}
                  <td className="py-2.5 px-3 text-right">
                    {isOut ? (
                      <span className="text-rose-700 font-medium">Esaurito (0)</span>
                    ) : (
                      <span className="text-stone-700">{p.stockRemaining} pcs</span>
                    )}
                  </td>

                  {/* % Sell Out Bar & Number + Formula Detail */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isHigh ? 'bg-emerald-600' : isLow ? 'bg-amber-500' : 'bg-stone-600'
                          }`}
                          style={{ width: `${Math.min(100, p.sellOutPct)}%` }}
                        />
                      </div>
                      <span
                        className={`font-semibold text-xs min-w-[42px] ${
                          isHigh ? 'text-emerald-800' : isLow ? 'text-amber-800' : 'text-stone-800'
                        }`}
                      >
                        {p.sellOutPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-stone-400 text-right">
                      ({p.unitsSold}/{p.unitsOrdered}) × 100
                    </div>
                  </td>

                  {/* Prezzi Whs / Ret */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-medium text-stone-900">€{p.suggRetailEur}</div>
                    <div className="text-[10px] text-stone-400">Whs: €{p.wholesaleEur}</div>
                  </td>

                  {/* Incasso Realizzato */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-medium text-stone-900">
                      €{p.realizedRevenueEur.toLocaleString('it-IT')}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Tot Whs: €{p.totalWholesaleEur.toLocaleString('it-IT')}
                    </div>
                  </td>

                  {/* Azione Inspect */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(p);
                      }}
                      className="inline-flex items-center justify-center rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition"
                      title="Apri scheda capo"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
