/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BoutiqueInfo, FilterState, MergedProduct, OrderItem, SellOutItem, ViewMode } from './types';
import { INITIAL_BOUTIQUE_INFO } from './data/initialData';
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
import { VerificationLoopModal } from './components/VerificationLoopModal';
import { DataEngineerRow } from './utils/excelParser';
import { Upload, Cpu, Sparkles } from 'lucide-react';

export default function App() {
  const [boutiqueInfo, setBoutiqueInfo] = useState<BoutiqueInfo>(INITIAL_BOUTIQUE_INFO);
  // Starts completely empty if no file has been uploaded
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<MergedProduct[]>([]);
  const [dataSourceLabel, setDataSourceLabel] = useState('Nessun file caricato · Please upload files');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('lookbook');
  const [selectedProduct, setSelectedProduct] = useState<MergedProduct | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [preloadedSelloutFile, setPreloadedSelloutFile] = useState<File | null>(null);
  const [preloadedClientInfo, setPreloadedClientInfo] = useState<Partial<BoutiqueInfo> | null>(null);

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
    setBoutiqueInfo(INITIAL_BOUTIQUE_INFO);
    setDataSourceLabel('Nessun dato caricato · Please upload files');
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

  const handleApplyConvertedData = async (
    rows: DataEngineerRow[],
    clientInfo?: Partial<BoutiqueInfo>
  ) => {
    try {
      const { mergeOrderAndSellOut, cleanStr, getColorPrefix, normalizeSize, parseCleanNumber } =
        await import('./utils/excelParser');
      const { INITIAL_ORDERS } = await import('./data/initialData');

      const sellOutItems: SellOutItem[] = rows.map((r) => ({
        style: r.Style,
        styleClean: cleanStr(r.Style),
        colour: r.Color,
        colorPrefix: getColorPrefix(r.Color),
        size: normalizeSize(r.Size),
        qtySold: typeof r.Units === 'number' ? r.Units : parseCleanNumber(r.Units, 1),
        rawLine: `${r.Style}, ${r.Name}, ${r.Color}, ${r.Size}, ${r.Units}`,
      }));

      const baseOrders = orders.length > 0 ? orders : INITIAL_ORDERS;
      const merged = mergeOrderAndSellOut(baseOrders, [], sellOutItems);
      setProducts(merged);
      setOrders(baseOrders);

      if (clientInfo && Object.keys(clientInfo).length > 0) {
        setBoutiqueInfo((prev) => ({ ...prev, ...clientInfo }));
      }

      const totalUnits = sellOutItems.reduce((acc, it) => acc + (it.qtySold || 0), 0);
      setDataSourceLabel(
        `File Convertito (${rows.length} righe · ${totalUnits} capi venduti)`
      );
    } catch (err) {
      console.error('Failed to apply converted data:', err);
    }
  };

  const handleLoadSampleData = async () => {
    try {
      const { loadAttachedCsvSellOut, mergeOrderAndSellOut } = await import('./utils/excelParser');
      const { INITIAL_ORDERS, INITIAL_BOUTIQUE_INFO } = await import('./data/initialData');
      const items = await loadAttachedCsvSellOut();
      const merged = mergeOrderAndSellOut(INITIAL_ORDERS, [], items);
      setOrders(INITIAL_ORDERS);
      setProducts(merged);
      setBoutiqueInfo(INITIAL_BOUTIQUE_INFO);
      setDataSourceLabel('Dataset Verificato (418 Capi Venduti)');
    } catch (err) {
      console.error('Failed to load sample data:', err);
    }
  };

  const handleOpenUploadWithConvertedFile = (file: File, clientInfo?: Partial<BoutiqueInfo>) => {
    setPreloadedSelloutFile(file);
    if (clientInfo && Object.keys(clientInfo).length > 0) {
      setPreloadedClientInfo(clientInfo);
      setBoutiqueInfo((prev) => ({ ...prev, ...clientInfo }));
    }
    setIsConverterOpen(false);
    setIsUploadOpen(true);
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
        onOpenVerificationLoop={() => setIsVerificationOpen(true)}
        onResetData={handleResetData}
        dataSourceLabel={dataSourceLabel}
      />

      {/* Main Merchandising Content Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 space-y-6">
        {products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-10 sm:p-14 text-center shadow-xs my-10 max-w-2xl mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-900 mb-5 border border-amber-200 shadow-xs">
              <Upload className="h-7 w-7 text-amber-900" />
            </div>

            <h2 className="font-serif-luxury text-3xl font-semibold text-stone-900 tracking-tight">
              Please upload files
            </h2>

            <p className="font-mono text-xs text-stone-400 mt-1 uppercase tracking-wider">
              Please upldad files
            </p>

            <p className="mt-3 text-sm text-stone-600 max-w-md mx-auto leading-relaxed font-sans-clean">
              Nessun file caricato al momento. Per visualizzare le metriche di sell-out, i grafici di vendita e le schede di formazione virtuale dei modelli, carica i tuoi file di vendita o esegui il convertitore Excel.
            </p>

            {/* Quick Action Grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="group p-4 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-white hover:border-amber-700 hover:shadow-md transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm group-hover:text-amber-900">
                  <Upload className="h-4 w-4 text-amber-800 shrink-0" />
                  <span>1. Carica File Ordini & Sell-Out</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Importa file Excel (.xlsx) o CSV (Ordini JOOR, Foto catalogo, Sell-Out)
                </p>
              </button>

              <button
                onClick={() => setIsConverterOpen(true)}
                className="group p-4 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-white hover:border-amber-700 hover:shadow-md transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm group-hover:text-amber-900">
                  <Cpu className="h-4 w-4 text-amber-800 shrink-0" />
                  <span>2. Data Engineer Converter</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Converti l'Excel 1C in export_ordinato.csv con il parser Python Colab
                </p>
              </button>
            </div>

            <div className="mt-7 pt-5 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
              <span className="text-stone-400">oppure avvia rapidamente con dati verificati:</span>
              <button
                onClick={handleLoadSampleData}
                className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-950 underline cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Carica Dataset Verificato Boutique Nevskiy (418 Capi)</span>
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

            {/* Empty State when filters yield 0 */}
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
        products={products}
        orders={orders}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Excel & CSV Upload Engine Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setPreloadedSelloutFile(null);
        }}
        currentOrders={orders}
        preloadedSelloutFile={preloadedSelloutFile}
        preloadedClientInfo={preloadedClientInfo}
        onDataParsed={handleDataParsed}
      />

      {/* Data Engineer Converter Modal with Python Colab Pipeline */}
      <DataEngineerConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        onApplyConvertedData={handleApplyConvertedData}
        onOpenUploadWithFile={handleOpenUploadWithConvertedFile}
      />

      {/* Verification Loop & Reconciliation Auditor Modal */}
      <VerificationLoopModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        products={products}
      />
    </div>
  );
}
