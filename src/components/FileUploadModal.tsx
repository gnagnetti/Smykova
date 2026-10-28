import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, FileText, Download, X, ArrowRight } from 'lucide-react';
import {
  parseOrdersFile,
  parsePhotoCatalogFile,
  parseSellOutFile,
  mergeOrderAndSellOut,
} from '../utils/excelParser';
import { downloadSampleSellOutCsv } from '../utils/exportUtils';
import { BoutiqueInfo, MergedProduct, OrderItem, SellOutItem, StylePhoto } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrders: OrderItem[];
  onDataParsed: (
    products: MergedProduct[],
    orders: OrderItem[],
    info: Partial<BoutiqueInfo>,
    label: string
  ) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  currentOrders,
  onDataParsed,
}) => {
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [photosFile, setPhotosFile] = useState<File | null>(null);
  const [selloutFile, setSelloutFile] = useState<File | null>(null);

  const [parsing, setParsing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadAttachedCsv = async () => {
    setParsing(true);
    setStatusMsg('Caricamento automatico file allegato modelli_formato_piatto_a63845c4.csv...');
    setErrorMsg(null);
    try {
      const { loadAttachedCsvSellOut } = await import('../utils/excelParser');
      const items = await loadAttachedCsvSellOut();
      const baseOrders = ordersFile ? (await parseOrdersFile(ordersFile)).orders : currentOrders;
      const merged = mergeOrderAndSellOut(baseOrders, [], items);
      onDataParsed(merged, baseOrders, {}, 'File Sell-Out Allegato (221 righe)');
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Errore nel caricamento del file allegato: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleProcessFiles = async () => {
    if (!ordersFile && !photosFile && !selloutFile) {
      setErrorMsg('Seleziona almeno un file Excel o CSV da elaborare.');
      return;
    }

    setParsing(true);
    setStatusMsg('Lettura ed elaborazione file in corso...');
    setErrorMsg(null);

    try {
      let parsedOrders: OrderItem[] = currentOrders;
      let parsedInfo: Partial<BoutiqueInfo> = {};
      let parsedPhotos: StylePhoto[] = [];
      let parsedSellOuts: SellOutItem[] = [];

      if (ordersFile) {
        setStatusMsg('Elaborazione ordini d\'acquisto JOOR (multi-foglio)...');
        const res = await parseOrdersFile(ordersFile);
        parsedOrders = res.orders;
        parsedInfo = res.boutiqueInfo;
      }

      if (photosFile) {
        setStatusMsg('Collegamento database foto e catalogo stili...');
        parsedPhotos = await parsePhotoCatalogFile(photosFile);
      }

      if (selloutFile) {
        setStatusMsg('Analisi report sell-out (.CSV o .XLSX)...');
        parsedSellOuts = await parseSellOutFile(selloutFile);
      }

      setStatusMsg('Riconciliazione finale e calcolo percentuali sell-out...');
      const merged = mergeOrderAndSellOut(parsedOrders, parsedPhotos, parsedSellOuts);

      const label = `Dati personalizzati caricati (${merged.length} stili)`;
      onDataParsed(merged, parsedOrders, parsedInfo, label);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Errore durante il parsing: ${err.message || 'File non conforme'}`);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-amber-800" />
            <h2 className="font-serif-luxury text-2xl font-semibold text-stone-900">
              Carica File Ordini & Sell-Out (Excel / CSV)
            </h2>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Supporta sia fogli <strong>.XLSX</strong> ufficiali sia file <strong>.CSV</strong> con formato piatto (<code>Modello,Colore,Taglia,Quantità</code>).
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="mt-4 flex items-center gap-2 rounded bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Quick Load Attached CSV Button */}
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
              <span>File Sell-Out Aggiornato Incluso</span>
              <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                Orlato: 4 pz venduti (40, 42, 44, 46)
              </span>
            </span>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              Carica istantaneamente il dataset completo con 224 righe corrette di sell-out.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadAttachedCsv}
            disabled={parsing}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-amber-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-amber-800 transition active:scale-95 disabled:opacity-50"
          >
            <span>Importa Dataset Incluso</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* 1. Orders File */}
          <div className="rounded-lg border border-stone-200 p-4 transition hover:border-stone-400">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                  1. File Ordini Multi-Foglio (JOOR)
                </span>
                <p className="text-xs text-stone-500 mt-0.5">
                  Es. <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">4_Orders_2026-10-26.xlsx</code> (fogli PO# 18827955, 18827970, ecc.)
                </p>
              </div>
              {ordersFile ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Selezionato
                </span>
              ) : (
                <span className="text-xs text-stone-400 font-mono">.xlsx</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx, .xls"
                id="file-orders"
                className="hidden"
                onChange={(e) => setOrdersFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="file-orders"
                className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-stone-600" />
                <span>{ordersFile ? ordersFile.name : 'Scegli File Ordini'}</span>
              </label>
              {ordersFile && (
                <button
                  onClick={() => setOrdersFile(null)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  Rimuovi
                </button>
              )}
            </div>
          </div>

          {/* 2. Photo Database File */}
          <div className="rounded-lg border border-stone-200 p-4 transition hover:border-stone-400">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                  2. Database Foto e Stili
                </span>
                <p className="text-xs text-stone-500 mt-0.5">
                  Es. <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">file foto style.xlsx</code> (foglio ag-grid con Image, Linesheet, Silhouette)
                </p>
              </div>
              {photosFile ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Selezionato
                </span>
              ) : (
                <span className="text-xs text-stone-400 font-mono">.xlsx</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx, .xls"
                id="file-photos"
                className="hidden"
                onChange={(e) => setPhotosFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="file-photos"
                className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-stone-600" />
                <span>{photosFile ? photosFile.name : 'Scegli File Foto Style'}</span>
              </label>
              {photosFile && (
                <button
                  onClick={() => setPhotosFile(null)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  Rimuovi
                </button>
              )}
            </div>
          </div>

          {/* 3. Sell-Out Report File (CSV or XLSX) */}
          <div className="rounded-lg border border-stone-200 p-4 transition hover:border-stone-400">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span>3. Report Sell-Out Boutique</span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                    .CSV o .XLSX
                  </span>
                </span>
                <p className="text-xs text-stone-500 mt-0.5">
                  Carica il sell-out come <strong>.CSV</strong> (es. export 1C/cassa con virgola <code>,</code> o punto e virgola <code>;</code>) oppure come file <strong>.XLSX</strong>.
                </p>
              </div>
              {selloutFile ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {selloutFile.name.toLowerCase().endsWith('.csv') ? 'CSV Pronto' : 'Excel Pronto'}
                </span>
              ) : (
                <span className="text-xs text-stone-400 font-mono">.csv / .xlsx</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".csv, .tsv, .txt, .xlsx, .xls, text/csv"
                id="file-sellout"
                className="hidden"
                onChange={(e) => setSelloutFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="file-sellout"
                className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 transition"
              >
                <FileText className="h-3.5 w-3.5 text-amber-800" />
                <span>{selloutFile ? selloutFile.name : 'Scegli File Sell-Out (.CSV o .XLSX)'}</span>
              </label>

              {selloutFile && (
                <button
                  onClick={() => setSelloutFile(null)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  Rimuovi
                </button>
              )}

              <button
                type="button"
                onClick={downloadSampleSellOutCsv}
                className="inline-flex items-center gap-1 text-[11px] text-amber-900 hover:text-amber-950 underline decoration-stone-300 ml-auto"
                title="Scarica un file CSV di esempio con Morolo, Mossa, Faggi, Spettatore, ecc."
              >
                <Download className="h-3 w-3" />
                <span>Scarica Modello CSV d'Esempio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
          <button
            onClick={onClose}
            className="rounded border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            Annulla
          </button>
          <button
            onClick={handleProcessFiles}
            disabled={parsing || (!ordersFile && !photosFile && !selloutFile)}
            className="inline-flex items-center gap-1.5 rounded bg-stone-900 px-5 py-2 text-xs font-medium text-white shadow transition hover:bg-stone-800 disabled:opacity-50"
          >
            <span>{parsing ? 'Elaborazione in corso...' : 'Elabora e Aggiorna Dashboard'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
