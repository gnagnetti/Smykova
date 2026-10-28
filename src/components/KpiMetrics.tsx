import React from 'react';
import { MergedProduct, OrderItem } from '../types';
import { TrendingUp, ShoppingBag, Euro, Layers, AlertCircle } from 'lucide-react';

interface KpiMetricsProps {
  products: MergedProduct[];
  orders: OrderItem[];
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ products, orders }) => {
  const totalOrdered = products.reduce((acc, p) => acc + p.unitsOrdered, 0);
  const totalSold = products.reduce((acc, p) => acc + p.unitsSold, 0);
  const stockRemaining = Math.max(0, totalOrdered - totalSold);
  const overallSellOut = totalOrdered > 0 ? (totalSold / totalOrdered) * 100 : 0;

  const totalWholesaleEur = products.reduce((acc, p) => acc + p.totalWholesaleEur, 0);
  const realizedRevenueEur = products.reduce((acc, p) => acc + p.realizedRevenueEur, 0);
  const totalRetailPotential = products.reduce((acc, p) => acc + p.totalRetailEur, 0);

  const bestSellersCount = products.filter((p) => p.sellOutPct >= 70).length;
  const slowMoversCount = products.filter((p) => p.sellOutPct < 40).length;
  const uniquePOs = new Set(orders.map((o) => o.poNumber)).size;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {/* 1. Overall Sell Out */}
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 font-sans-clean">
          <span>Sell-Out Totale</span>
          <TrendingUp className="h-4 w-4 text-emerald-700" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-serif-luxury text-3xl font-semibold text-stone-900">
            {overallSellOut.toFixed(1)}%
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">Target 70%</span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${Math.min(100, overallSellOut)}%` }}
          />
        </div>
        <div className="mt-2 text-[10px] text-stone-400 font-mono">
          ({totalSold} / {totalOrdered}) × 100
        </div>
      </div>

      {/* 2. Units Sold / Ordered */}
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 font-sans-clean">
          <span>Units Sold / Ordered</span>
          <ShoppingBag className="h-4 w-4 text-stone-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-serif-luxury text-3xl font-semibold text-stone-900">
            {totalSold}
          </span>
          <span className="text-xs text-stone-500 font-sans-clean">/ {totalOrdered} pcs</span>
        </div>
        <div className="mt-2 text-xs text-stone-500">
          <span>{stockRemaining} units on floor/stock</span>
        </div>
      </div>

      {/* 3. Realized Retail Turnover */}
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 font-sans-clean">
          <span>Realized Retail Revenue</span>
          <Euro className="h-4 w-4 text-amber-800" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-serif-luxury text-2xl sm:text-3xl font-semibold text-stone-900">
            €{realizedRevenueEur.toLocaleString('it-IT')}
          </span>
        </div>
        <div className="mt-2 text-xs text-stone-500">
          <span>Max pot: €{totalRetailPotential.toLocaleString('it-IT')}</span>
        </div>
      </div>

      {/* 4. Wholesale Budget Invested */}
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 font-sans-clean">
          <span>Wholesale Value</span>
          <Euro className="h-4 w-4 text-stone-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-serif-luxury text-2xl sm:text-3xl font-semibold text-stone-900">
            €{totalWholesaleEur.toLocaleString('it-IT')}
          </span>
        </div>
        <div className="mt-2 text-xs text-stone-500">
          <span>Mark-up avg ~2.6x</span>
        </div>
      </div>

      {/* 5. Merchandising Health */}
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 font-sans-clean">
          <span>Catalog Assortment</span>
          <Layers className="h-4 w-4 text-stone-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-serif-luxury text-3xl font-semibold text-stone-900">
            {products.length}
          </span>
          <span className="text-xs text-stone-500">SKUs</span>
        </div>
        <div className="mt-2 text-xs text-stone-500">
          <span>Across {uniquePOs} Active PO Orders</span>
        </div>
      </div>

      {/* 6. Velocity Split */}
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 font-sans-clean">
          <span>Velocity Analysis</span>
          <AlertCircle className="h-4 w-4 text-stone-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-emerald-800">
            {bestSellersCount} <span className="text-xs font-normal text-stone-500">Top (&ge;70%)</span>
          </span>
        </div>
        <div className="mt-2 text-xs text-amber-800">
          <span>{slowMoversCount} under 40% sell-out</span>
        </div>
      </div>
    </section>
  );
};
