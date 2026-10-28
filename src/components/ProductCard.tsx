import React, { useState } from 'react';
import { MergedProduct } from '../types';
import { Eye, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: MergedProduct;
  onSelect: (product: MergedProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [imgError, setImgError] = useState(false);

  // Status styling
  const isHighVelocity = product.sellOutPct >= 70;
  const isSoldOut = product.stockRemaining === 0 && product.unitsOrdered > 0;
  const isSlowMover = product.sellOutPct < 40;

  // Fallback high quality fashion placeholder if JOOR CDN link fails
  const fallbackImg =
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition-all hover:border-stone-400 hover:shadow-md cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        <img
          src={imgError ? fallbackImg : product.image}
          alt={product.styleName}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Quiet top-left indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[11px] font-medium text-stone-800 rounded shadow-xs">
          <span>{product.silhouette}</span>
        </div>

        {/* Top-right Sell-Out rate indicator */}
        <div
          className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold rounded shadow-xs backdrop-blur-xs ${
            isSoldOut
              ? 'bg-rose-900 text-white'
              : isHighVelocity
              ? 'bg-emerald-900 text-white'
              : isSlowMover
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-white/90 text-stone-900'
          }`}
        >
          {isSoldOut ? 'SOLD OUT' : `${product.sellOutPct.toFixed(0)}% S/O`}
        </div>

        {/* Hover Inspect overlay button */}
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/30 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-medium text-stone-900 shadow">
            <Eye className="h-3.5 w-3.5" />
            Inspect Style
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col p-4">
        {/* Style Name and Colorway */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif-luxury text-lg font-semibold tracking-wide text-stone-900 group-hover:text-amber-900 transition-colors">
              {product.styleName}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500 font-sans-clean">
              <span>{product.colorCode || product.color}</span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="font-mono text-[11px]">#{product.styleNumber}</span>
            </div>
          </div>
        </div>

        {/* Sell-Out Progress Bar & Formula */}
        <div className="mt-3">
          <div className="flex justify-between text-xs font-sans-clean">
            <span className="text-stone-600 font-medium">
              Venduti: <strong className="text-stone-900">{product.unitsSold}</strong> di {product.unitsOrdered} pcs
            </span>
            <span className="font-semibold text-stone-800">
              {product.sellOutPct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className={`h-full transition-all duration-300 ${
                isHighVelocity
                  ? 'bg-emerald-600'
                  : isSlowMover
                  ? 'bg-amber-500'
                  : 'bg-stone-600'
              }`}
              style={{ width: `${Math.min(100, product.sellOutPct)}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-stone-400 font-mono">
            <span>({product.unitsSold} / {product.unitsOrdered}) × 100</span>
            <span className="font-sans-clean">Rimanenza: {product.stockRemaining} pcs</span>
          </div>
        </div>

        {/* Key Commercial Metrics */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3 text-xs">
          <div>
            <span className="block text-stone-400 text-[11px]">Retail / Whs</span>
            <span className="font-medium text-stone-800">
              €{product.suggRetailEur} <span className="text-stone-400 font-normal">/ €{product.wholesaleEur}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="block text-stone-400 text-[11px]">Stock Left</span>
            <span className="font-medium text-stone-800">
              {product.stockRemaining === 0 ? (
                <span className="text-rose-700 font-semibold">0 pcs</span>
              ) : (
                `${product.stockRemaining} pcs`
              )}
            </span>
          </div>
        </div>

        {/* Size chips summary */}
        <div className="mt-3 flex flex-wrap items-center gap-1 text-[11px] text-stone-500">
          {Object.entries(product.sizesOrdered).map(([sz, ordQty]) => {
            const soldQty = product.sizesSold[sz] || 0;
            const remaining = ordQty - soldQty;
            return (
              <span
                key={sz}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  remaining <= 0
                    ? 'bg-rose-50 text-rose-800 line-through decoration-rose-400'
                    : 'bg-stone-100 text-stone-700'
                }`}
                title={`Size ${sz}: ${soldQty} sold of ${ordQty} ordered (${remaining} remaining)`}
              >
                {sz}:{soldQty}/{ordQty}
              </span>
            );
          })}
        </div>

        {/* Orders link */}
        <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between">
          <span>{product.poNumbers.join(', ')}</span>
          {product.stockRemaining === 1 && (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
              <AlertTriangle className="h-3 w-3" /> 1 Left
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
