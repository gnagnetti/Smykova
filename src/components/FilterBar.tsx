import React from 'react';
import { FilterState, ViewMode } from '../types';
import { Search, LayoutGrid, Table as TableIcon, BarChart3, Ruler, PackageCheck } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  viewMode: ViewMode;
  onViewModeChange: (view: ViewMode) => void;
  allSilhouettes: string[];
  allPOs: string[];
  resultCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  allSilhouettes,
  allPOs,
  resultCount,
  totalCount,
}) => {
  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-3 sm:p-4 shadow-xs">
      {/* Top Row: View Switcher & Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Navigation View Switcher */}
        <div className="flex flex-wrap items-center gap-1 rounded-md bg-stone-100 p-1">
          <button
            onClick={() => onViewModeChange('lookbook')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'lookbook'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Lookbook Gallery</span>
          </button>

          <button
            onClick={() => onViewModeChange('table')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Master Table</span>
          </button>

          <button
            onClick={() => onViewModeChange('categories')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'categories'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Silhouettes</span>
          </button>

          <button
            onClick={() => onViewModeChange('sizes')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'sizes'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>Size Curve</span>
          </button>

          <button
            onClick={() => onViewModeChange('linesheets')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'linesheets'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            <span>Linesheets</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search style (e.g. Faggi, Girevole), color, fabrication..."
            className="w-full rounded border border-stone-200 bg-stone-50/60 py-1.5 pl-9 pr-3 text-xs text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-hidden"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Granular Filters & Sorts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Silhouette Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Silhouette:</span>
            <select
              value={filters.silhouette}
              onChange={(e) => onFilterChange({ ...filters, silhouette: e.target.value })}
              className="rounded border border-stone-200 bg-white py-1 px-2 text-xs text-stone-800 focus:border-stone-400 focus:outline-hidden"
            >
              <option value="all">All Silhouettes</option>
              {allSilhouettes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Performance Tier Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Sell-Out Tier:</span>
            <select
              value={filters.performanceTier}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  performanceTier: e.target.value as FilterState['performanceTier'],
                })
              }
              className="rounded border border-stone-200 bg-white py-1 px-2 text-xs text-stone-800 focus:border-stone-400 focus:outline-hidden"
            >
              <option value="all">All Performance Tiers</option>
              <option value="bestseller">Top Sellers (&ge;70%)</option>
              <option value="healthy">Healthy (40% - 69%)</option>
              <option value="slow">Slow Movers (&lt;40%)</option>
              <option value="soldout">Sold Out (100%)</option>
            </select>
          </div>

          {/* PO Filter */}
          {allPOs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">Order:</span>
              <select
                value={filters.poFilter}
                onChange={(e) => onFilterChange({ ...filters, poFilter: e.target.value })}
                className="rounded border border-stone-200 bg-white py-1 px-2 text-xs text-stone-800 focus:border-stone-400 focus:outline-hidden"
              >
                <option value="all">All Orders</option>
                {allPOs.map((po) => (
                  <option key={po} value={po}>
                    {po}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sort Order & Results Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  sortBy: e.target.value as FilterState['sortBy'],
                })
              }
              className="rounded border border-stone-200 bg-white py-1 px-2 text-xs font-medium text-stone-800 focus:border-stone-400 focus:outline-hidden"
            >
              <option value="soldDesc">Units Sold (High → Low)</option>
              <option value="sellOutDesc">Sell-Out % (High → Low)</option>
              <option value="orderedDesc">Units Ordered (High → Low)</option>
              <option value="stockDesc">Stock Remaining (High → Low)</option>
              <option value="revenueDesc">Revenue Generated (€)</option>
              <option value="nameAsc">Style Name (A → Z)</option>
              <option value="sellOutAsc">Sell-Out % (Low → High)</option>
            </select>
          </div>

          <span className="text-stone-400">|</span>

          <span className="text-stone-500">
            Showing <strong className="text-stone-800">{resultCount}</strong> of {totalCount} styles
          </span>
        </div>
      </div>
    </div>
  );
};
