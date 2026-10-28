import React, { useState, useMemo } from 'react';
import { BoutiqueInfo, FilterState, MergedProduct, OrderItem, ViewMode } from './types';
import {
  INITIAL_BOUTIQUE_INFO,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
} from './data/initialData';
import { Header } from './components/Header';
import { KpiMetrics } from './components/KpiMetrics';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { TableView } from './components/TableView';
import { SilhouetteBreakdown } from './components/SilhouetteBreakdown';
import { SizeMatrixView } from './components/SizeMatrixView';
import { PoComparisonView } from './components/PoComparisonView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { FileUploadModal } from './components/FileUploadModal';
import { DataEngineerConverterModal } from './components/DataEngineerConverterModal';

export default function App() {
  const [boutiqueInfo, setBoutiqueInfo] = useState<BoutiqueInfo>(INITIAL_BOUTIQUE_INFO);
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [products, setProducts] = useState<MergedProduct[]>(INITIAL_PRODUCTS);
  const [dataSourceLabel, setDataSourceLabel] = useState('Dati precaricati (Catalogo FW26 & Sell-Out)');

  const [viewMode, setViewMode] = useState<ViewMode>('lookbook');
  const [selectedProduct, setSelectedProduct] = useState<MergedProduct | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    silhouette: 'all',
    linesheet: 'all',
    performanceTier: 'all',
    sortBy: 'soldDesc',
    poFilter: 'all',
  });

  // Extract distinct silhouettes and PO numbers
  const allSilhouettes = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => {
      if (p.silhouette) s.add(p.silhouette);
    });
    return Array.from(s).sort();
  }, [products]);

  const allPOs = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => {
      if (o.poNumber) s.add(o.poNumber);
    });
    return Array.from(s).sort();
  }, [orders]);

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search text
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchName = p.styleName.toLowerCase().includes(q);
          const matchColor = (p.colorCode || p.color).toLowerCase().includes(q);
          const matchSil = p.silhouette.toLowerCase().includes(q);
          const matchFab = (p.fabrication || '').toLowerCase().includes(q);
          if (!matchName && !matchColor && !matchSil && !matchFab) return false;
        }

        // Silhouette filter
        if (filters.silhouette !== 'all' && p.silhouette !== filters.silhouette) {
          return false;
        }

        // PO filter
        if (filters.poFilter !== 'all' && !p.poNumbers.includes(filters.poFilter)) {
          return false;
        }

        // Performance Tier filter
        if (filters.performanceTier === 'bestseller' && p.sellOutPct < 70) {
          return false;
        }
        if (
          filters.performanceTier === 'healthy' &&
          (p.sellOutPct < 40 || p.sellOutPct >= 70)
        ) {
          return false;
        }
        if (filters.performanceTier === 'slow' && p.sellOutPct >= 40) {
          return false;
        }
        if (filters.performanceTier === 'soldout' && p.stockRemaining > 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'soldDesc':
            return b.unitsSold - a.unitsSold || b.sellOutPct - a.sellOutPct;
          case 'sellOutDesc':
            return b.sellOutPct - a.sellOutPct || b.unitsSold - a.unitsSold;
          case 'sellOutAsc':
            return a.sellOutPct - b.sellOutPct;
          case 'orderedDesc':
            return b.unitsOrdered - a.unitsOrdered;
          case 'stockDesc':
            return b.stockRemaining - a.stockRemaining;
          case 'revenueDesc':
            return b.realizedRevenueEur - a.realizedRevenueEur;
          case 'nameAsc':
            return a.styleName.localeCompare(b.styleName);
          default:
            return b.unitsSold - a.unitsSold;
        }
      });
  }, [products, filters]);

  const handleResetData = () => {
    setProducts([]);
    setOrders([]);
    setBoutiqueInfo({
      name: 'Luisa Spagnoli',
      location: 'Boutique',
      address: '',
      representative: '',
      email: '',
      customerId: '',
      reportDate: '',
      orderSeason: '',
    });
    setDataSourceLabel('Nessun dato caricato');
    setFilters({
      search: '',
      silhouette: 'all',
      linesheet: 'all',
      performanceTier: 'all',
      sortBy: 'soldDesc',
      poFilter: 'all',
    });
  };

  const handleDataParsed = (
    newProducts: MergedProduct[],
    newOrders: OrderItem[],
    newInfo: Partial<BoutiqueInfo>,
    label: string
  ) => {
    if (newProducts.length > 0) {
      setProducts(newProducts);
    }
    if (newOrders.length > 0) {
      setOrders(newOrders);
    }
    if (Object.keys(newInfo).length > 0) {
      setBoutiqueInfo((prev) => ({ ...prev, ...newInfo }));
    }
    setDataSourceLabel(label);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans-clean selection:bg-amber-100 selection:text-amber-900">
      {/* Brand & Boutique Navigation Header */}
      <Header
        boutiqueInfo={boutiqueInfo}
        products={filteredProducts}
        orders={orders}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenConverter={() => setIsConverterOpen(true)}
        onResetData={handleResetData}
        dataSourceLabel={dataSourceLabel}
      />

      {/* Main Merchandising Content Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 space-y-6">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm my-16 max-w-xl mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-900 mb-4">
              <span className="font-serif-luxury text-2xl font-bold">LS</span>
            </div>
            <h2 className="font-serif-luxury text-2xl font-semibold text-stone-900">
              Nessun Dato Caricato
            </h2>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              Benvenuto in <strong>Luisa Spagnoli | Sell-Out & Order Analytics</strong>. Per iniziare l'analisi commerciale e visualizzare i cruscotti di vendita, premi il pulsante sottostante per importare i tuoi file degli ordini e del sell-out.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 rounded bg-stone-900 px-6 py-2.5 text-xs font-medium text-white shadow hover:bg-stone-800 transition active:scale-95"
              >
                <span>Importa File Ordini & Sell-Out</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Key Commercial Metrics Ribbon */}
            <KpiMetrics products={products} orders={orders} />

            {/* Filters, View Switcher & Search Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              allSilhouettes={allSilhouettes}
              allPOs={allPOs}
              resultCount={filteredProducts.length}
              totalCount={products.length}
            />

            {/* Dynamic View Render */}
            {viewMode === 'lookbook' && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} />
                ))}
              </div>
            )}

            {viewMode === 'table' && (
              <TableView products={filteredProducts} onSelect={setSelectedProduct} />
            )}

            {viewMode === 'categories' && (
              <SilhouetteBreakdown
                products={products}
                onSelectSilhouette={(sil) => {
                  setFilters((prev) => ({ ...prev, silhouette: sil }));
                  setViewMode('lookbook');
                }}
              />
            )}

            {viewMode === 'sizes' && (
              <SizeMatrixView products={filteredProducts} onSelect={setSelectedProduct} />
            )}

            {viewMode === 'linesheets' && (
              <PoComparisonView orders={orders} products={products} />
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="rounded-lg border border-dashed border-stone-300 bg-white p-12 text-center">
                <h3 className="font-serif-luxury text-lg font-semibold text-stone-800">
                  Nessun capo trovato con i filtri selezionati
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Prova a reimpostare la ricerca o azzerare i filtri per visualizzare l'intero catalogo.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      search: '',
                      silhouette: 'all',
                      linesheet: 'all',
                      performanceTier: 'all',
                      sortBy: 'soldDesc',
                      poFilter: 'all',
                    })
                  }
                  className="mt-4 rounded bg-stone-900 px-4 py-1.5 text-xs font-medium text-white shadow hover:bg-stone-800 transition"
                >
                  Azzera Filtri
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Detail Inspector Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Excel & CSV Upload Engine Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentOrders={orders}
        onDataParsed={handleDataParsed}
      />

      {/* Data Engineer Converter Modal */}
      <DataEngineerConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
      />
    </div>
  );
}
