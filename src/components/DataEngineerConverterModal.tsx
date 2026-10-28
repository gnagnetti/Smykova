import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Cpu, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseSellOutFromRawRows, readFileToRawRows } from '../utils/excelParser';

interface DataEngineerConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataEngineerConverterModal: React.FC<DataEngineerConverterModalProps> = ({ isOpen, onClose }) => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<{ Modello: string; Colore: string; Taglia: string; Quantità: number }[]>([]);

  if (!isOpen) return null;

  const handleConvertExcelToCsv = async () => {
    if (!excelFile) {
      setErrorMsg('Seleziona un file Excel (.xlsx o .xls) contenente il report di sell-out.');
      return;
    }

    setConverting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Read Excel file to raw rows using excelParser utilities
      const rawRows = await readFileToRawRows(excelFile);
      
      // 2. Parse sell out items using robust parser
      const parsedItems = parseSellOutFromRawRows(rawRows);

      if (parsedItems.length === 0) {
        throw new Error('Nessun dato di vendita trovato nel file Excel. Assicurarsi che il formato contenga stili, colori, taglie e quantità.');
      }

      // 3. Format into CSV rows (Modello, Colore, Taglia, Quantità)
      const csvRows = parsedItems.map(item => ({
        Modello: item.styleClean || item.style,
        Colore: item.colour || item.colorPrefix || 'UNICO',
        Taglia: item.size || 'U',
        Quantità: item.qtySold || 1
      }));

      setPreviewRows(csvRows);

      // 4. Force download CSV
      const headers = ['Modello', 'Colore', 'Taglia', 'Quantità'];
      const csvContent = [
        headers.join(','),
        ...csvRows.map(r => `"${r.Modello}","${r.Colore}","${r.Taglia}",${r.Quantità}`)
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = excelFile.name.replace(/\.[^/.]+$/, '') + '_convertito.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg(`Conversione completata! File convertito (${csvRows.length} righe) scaricato con successo.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Errore durante la conversione del file Excel: ${err.message || 'File non conforme'}`);
    } finally {
      setConverting(false);
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

        <div className="flex items-center gap-2">
          <Cpu className="h-6 w-6 text-amber-800" />
          <h2 className="font-serif-luxury text-2xl font-semibold text-stone-900">
            Convertitore Sell-Out Excel (.xlsx) → CSV
          </h2>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          Carica il file Excel (.xlsx o .xls) del sell-out: il programma lo analizzerà, estrarrà i dettagli e <strong>forzerà automaticamente il download</strong> del nuovo file in formato CSV standard.
        </p>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mt-5 rounded-lg border border-stone-200 p-5 bg-stone-50/50">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 block">
            Carica File Excel Sell-Out (.xlsx / .xls)
          </span>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Trascina o seleziona il file Excel della boutique (es. report di cassa / 1C / Excel).
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx, .xls"
              id="excel-sellout-input"
              className="hidden"
              onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="excel-sellout-input"
              className="cursor-pointer inline-flex items-center gap-2 rounded border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-800 hover:bg-stone-100 transition shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              <span>{excelFile ? excelFile.name : 'Seleziona File Excel Sell-Out'}</span>
            </label>
            {excelFile && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Pronto per conversione
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
          <button
            onClick={onClose}
            className="rounded border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            Chiudi
          </button>
          <button
            onClick={handleConvertExcelToCsv}
            disabled={converting || !excelFile}
            className="inline-flex items-center gap-2 rounded bg-stone-900 px-6 py-2.5 text-xs font-medium text-white shadow hover:bg-stone-800 transition disabled:opacity-50 active:scale-95"
          >
            <span>{converting ? 'Conversione in corso...' : 'Trasmforma in CSV & Scarica'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Preview Table */}
        {previewRows.length > 0 && (
          <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif-luxury text-sm font-semibold text-stone-900">
                Anteprima Dati Convertiti ({previewRows.length} righe)
              </h3>
              <button
                onClick={() => {
                  const headers = ['Modello', 'Colore', 'Taglia', 'Quantità'];
                  const csvContent = [
                    headers.join(','),
                    ...previewRows.map(r => `"${r.Modello}","${r.Colore}","${r.Taglia}",${r.Quantità}`)
                  ].join('\n');
                  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = (excelFile?.name || 'sell_out').replace(/\.[^/.]+$/, '') + '_convertito.csv';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1 text-xs text-amber-900 hover:underline font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Scarica di nuovo</span>
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded border border-stone-200">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="sticky top-0 bg-stone-100 text-[11px] text-stone-700 uppercase">
                  <tr>
                    <th className="py-2 px-3">Modello</th>
                    <th className="py-2 px-3">Colore</th>
                    <th className="py-2 px-3">Taglia</th>
                    <th className="py-2 px-3 text-right">Quantità</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                  {previewRows.slice(0, 30).map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="py-1 px-3 font-sans-clean font-medium text-stone-900">{row.Modello}</td>
                      <td className="py-1 px-3 text-stone-600">{row.Colore}</td>
                      <td className="py-1 px-3 text-stone-600">{row.Taglia}</td>
                      <td className="py-1 px-3 text-right font-semibold text-amber-900">{row.Quantità}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
