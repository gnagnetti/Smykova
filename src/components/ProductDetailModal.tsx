import React, { useState } from 'react';
import { MergedProduct, OrderItem } from '../types';
import { X, CheckCircle2, AlertCircle, ShoppingBag, Euro, Sparkles } from 'lucide-react';
import { ModelTrainingSheet } from './ModelTrainingSheet';

interface ProductDetailModalProps {
  product: MergedProduct | null;
  products?: MergedProduct[];
  orders?: OrderItem[];
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  products = [],
  orders = [],
  onClose,
}) => {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const markup = product.wholesaleEur > 0 ? (product.suggRetailEur / product.wholesaleEur).toFixed(2) : '2.60';
  const isHighVelocity = product.sellOutPct >= 70;
  const isSoldOut = product.stockRemaining === 0;

  const fallbackImg =
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 sm:p-6 backdrop-blur-xs">
      <div
        className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 rounded-full bg-stone-100 p-2.5 text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition shadow-xs"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Product Section: Garment Image & Performance Sheet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Garment Image Showcase */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100 md:aspect-auto md:h-full min-h-[420px]">
            <img
              src={imgError ? fallbackImg : product.image}
              alt={product.styleName}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover object-top"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-stone-900/85 p-3.5 text-white backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-widest text-stone-300">Linesheet</span>
                <span className="font-medium text-amber-200">{product.linesheet}</span>
              </div>
              <div className="mt-1 text-xs text-stone-300 truncate">
                {product.fabrication || 'Made in Italy - Luisa Spagnoli Haute Couture'}
              </div>
            </div>
          </div>

          {/* Details & Performance Sheet */}
          <div className="flex flex-col">
            {/* Header Identity */}
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-900 font-medium">
                <span>{product.silhouette}</span>
                <span>·</span>
                <span className="font-mono">Mod. #{product.styleNumber}</span>
              </div>
              <h2 className="mt-1 font-serif-luxury text-3xl sm:text-4xl font-bold tracking-wide text-stone-900">
                {product.styleName}
              </h2>
              <div className="mt-1 text-sm text-stone-600 font-sans-clean">
                {product.colorCode || product.color}
                {product.colorPrefix && (
                  <span className="ml-2 font-mono text-xs text-stone-400">
                    (Prefix: {product.colorPrefix})
                  </span>
                )}
              </div>
            </div>

            {/* Sell-Out Performance Box */}
            <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">
                    Performance Sell-Out
                  </span>
                  <div className="text-[10px] text-stone-400 font-mono">
                    Formula: (Pezzi Venduti ÷ Pezzi Ordinati) × 100
                  </div>
                </div>
                <span
                  className={`font-serif-luxury text-2xl font-bold ${
                    isSoldOut
                      ? 'text-rose-800'
                      : isHighVelocity
                      ? 'text-emerald-800'
                      : 'text-stone-800'
                  }`}
                >
                  {isSoldOut ? '100% Sold Out' : `${product.sellOutPct.toFixed(1)}%`}
                </span>
              </div>

              <div className="mt-2.5 h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    isHighVelocity ? 'bg-emerald-600' : 'bg-stone-800'
                  }`}
                  style={{ width: `${Math.min(100, product.sellOutPct)}%` }}
                />
              </div>

              {/* Exact formula calculation */}
              <div className="mt-3 rounded-lg bg-white border border-stone-200 p-2.5 text-xs font-mono text-stone-700 flex flex-wrap items-center justify-between gap-1">
                <span className="text-stone-500 font-sans-clean text-[11px]">Calcolo Sell-Out:</span>
                <span className="font-semibold text-emerald-900">
                  ({product.unitsSold} venduti / {product.unitsOrdered} ordinati) × 100 = {product.sellOutPct.toFixed(1)}%
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
                <span>
                  Venduti: <strong className="text-stone-900">{product.unitsSold}</strong> capi
                </span>
                <span>
                  Ordinati: <strong className="text-stone-900">{product.unitsOrdered}</strong> capi
                </span>
                <span>
                  Rimanenza: <strong className="text-stone-900">{product.stockRemaining}</strong> capi
                </span>
              </div>
            </div>

            {/* Sizes Breakdown Grid */}
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Ripartizione Curva Taglie
              </h4>
              <div className="mt-2.5 grid grid-cols-4 gap-2 text-center text-xs">
                {Object.entries(product.sizesOrdered).map(([sz, ord]) => {
                  const sld = product.sizesSold[sz] || 0;
                  const rem = ord - sld;
                  const isSzSoldOut = rem <= 0;

                  return (
                    <div
                      key={sz}
                      className={`rounded-lg border p-2 ${
                        isSzSoldOut
                          ? 'border-rose-200 bg-rose-50/70 text-rose-900'
                          : sld > 0
                          ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      <span className="block font-mono font-bold text-xs">Taglia {sz}</span>
                      <span className="block mt-1 text-[11px]">
                        Venduti: <strong>{sld}</strong>/{ord}
                      </span>
                      <span className="block text-[10px] text-stone-400">
                        {isSzSoldOut ? 'Esaurita' : `${rem} rimasti`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial & Margin Metrics */}
            <div className="mt-5 border-t border-stone-100 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Metriche Finanziarie (EUR)
              </h4>
              <div className="mt-2.5 grid grid-cols-3 gap-2.5 text-xs">
                <div className="rounded-lg border border-stone-200 p-2.5 bg-stone-50/50">
                  <span className="block text-stone-400 text-[10px] uppercase">Prezzo Whs</span>
                  <span className="font-semibold text-stone-900 text-sm">€{product.wholesaleEur}</span>
                  <span className="block text-[10px] text-stone-400">JOOR listino</span>
                </div>
                <div className="rounded-lg border border-stone-200 p-2.5 bg-stone-50/50">
                  <span className="block text-stone-400 text-[10px] uppercase">Prezzo Retail</span>
                  <span className="font-semibold text-stone-900 text-sm">€{product.suggRetailEur}</span>
                  <span className="block text-[10px] text-emerald-800 font-medium">Markup {markup}x</span>
                </div>
                <div className="rounded-lg border border-stone-200 p-2.5 bg-stone-50/50">
                  <span className="block text-stone-400 text-[10px] uppercase">Incasso Realizzato</span>
                  <span className="font-semibold text-stone-900 text-sm">
                    €{product.realizedRevenueEur.toLocaleString('it-IT')}
                  </span>
                  <span className="block text-[10px] text-stone-400">
                    di €{product.totalRetailEur.toLocaleString('it-IT')} max
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-PO Origin & Merchandising Advice */}
            <div className="mt-4 border-t border-stone-100 pt-3 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-stone-400" />
                <span>Origine: {product.poNumbers.join(', ')}</span>
              </div>
              <div>
                {isSoldOut ? (
                  <span className="text-rose-700 font-medium">Riassortimento consigliato</span>
                ) : isHighVelocity ? (
                  <span className="text-emerald-800 font-medium">Top Performer della stagione</span>
                ) : (
                  <span className="text-stone-500">Stock regolare in boutique</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VIRTUAL TRAINING EXPERT: Model Training Sheet inserted directly underneath description */}
        <ModelTrainingSheet
          modelName={product.styleName}
          modelNumber={product.styleNumber}
          image={product.image}
          silhouette={product.silhouette}
          colorName={product.colorCode || product.color}
          fabrication={product.fabrication}
          products={products}
          orders={orders}
        />
      </div>
    </div>
  );
};
