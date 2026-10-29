import React from 'react';
import { BoutiqueInfo, MergedProduct, OrderItem } from '../types';
import { Upload, Download, FileSpreadsheet, RefreshCw, Printer, Cpu, ShieldCheck } from 'lucide-react';
import { exportConsolidatedOrdersCSV, exportSellOutReportCSV, printReportToPdf } from '../utils/exportUtils';

interface HeaderProps {
  boutiqueInfo: BoutiqueInfo;
  products: MergedProduct[];
  orders: OrderItem[];
  onOpenUpload: () => void;
  onOpenConverter: () => void;
  onOpenVerificationLoop: () => void;
  onResetData: () => void;
  dataSourceLabel: string;
}

export const Header: React.FC<HeaderProps> = ({
  boutiqueInfo,
  products,
  orders,
  onOpenUpload,
  onOpenConverter,
  onOpenVerificationLoop,
  onResetData,
  dataSourceLabel,
}) => {
  return (
    <header className="border-b border-stone-200 bg-[#fdfcfb] px-4 py-5 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand & Boutique Identifiers */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif-luxury text-2xl tracking-wider uppercase text-stone-900 sm:text-3xl font-medium">
              Luisa Spagnoli
            </h1>
            <span className="text-stone-300 font-light text-xl">|</span>
            <span className="text-xs uppercase tracking-widest text-amber-900/80 font-medium">
              Sell-Out & Merchandising Intelligence
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 font-sans-clean">
            <span
              className="inline-flex items-center gap-1.5 font-semibold text-stone-900 bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded shadow-2xs"
              title={boutiqueInfo.clientLines ? boutiqueInfo.clientLines.join('\n') : (boutiqueInfo.name || boutiqueInfo.location)}
            >
              <span className="text-[10px] uppercase tracking-wider text-amber-900 font-bold">Cliente:</span>
              <span>{boutiqueInfo.name || boutiqueInfo.location}</span>
            </span>
            {boutiqueInfo.address && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-600" title={boutiqueInfo.clientLines?.join('\n')}>{boutiqueInfo.address}</span>
              </>
            )}
            {boutiqueInfo.representative && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>Rep: {boutiqueInfo.representative}</span>
              </>
            )}
            {boutiqueInfo.customerId && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-600 font-mono">Cust ID: {boutiqueInfo.customerId}</span>
              </>
            )}
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-950 bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded">
              Formula: (Venduti ÷ Ordinati) × 100
            </span>
          </div>
        </div>

        {/* Action Controls & Exporters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Data Source Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 pr-2 border-r border-stone-200">
            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
            <span>{dataSourceLabel}</span>
          </div>

          {/* Verification Loop Button */}
          <button
            onClick={onOpenVerificationLoop}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-2xs hover:bg-emerald-100 hover:border-emerald-400 transition active:scale-95 cursor-pointer"
            title="Loop di Verifica Capi: 418 Capi Accertati al 100%"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            <span>Loop di Verifica: 418 Capi (100%)</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 hover:border-stone-400 active:scale-95"
            title="Import Excel o CSV files (Ordini, Foto, Sell-Out)"
          >
            <Upload className="h-3.5 w-3.5 text-stone-600" />
            <span>Upload Excel / CSV</span>
          </button>

          <div className="relative group">
            <button
              onClick={() => exportSellOutReportCSV(products)}
              className="inline-flex items-center gap-1.5 rounded border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-95"
              title="Download report_sell_out_finale.csv"
            >
              <Download className="h-3.5 w-3.5 text-stone-300" />
              <span>Export Sell-Out CSV</span>
            </button>
          </div>

          <button
            onClick={() => exportConsolidatedOrdersCSV(orders)}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900"
            title="Export consolidated multi-PO orders CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-stone-500" />
            <span className="hidden sm:inline">Orders CSV</span>
          </button>

          <button
            onClick={() => printReportToPdf(products, boutiqueInfo)}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900"
            title="Stampa o Salva Report in PDF con immagini"
          >
            <Printer className="h-3.5 w-3.5 text-stone-600" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={onOpenConverter}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900"
            title="Convertitore Data Engineer (Python Script Pipeline)"
          >
            <Cpu className="h-3.5 w-3.5 text-amber-800" />
            <span>Data Engineer Converter</span>
          </button>

          <button
            onClick={onResetData}
            className="inline-flex items-center p-1.5 rounded border border-stone-200 text-stone-400 hover:text-stone-700 hover:border-stone-300 transition"
            title="Reset to default boutique dataset"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
