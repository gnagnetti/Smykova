import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ArrowRight,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  DataEngineerRow,
  convertExcelToDataEngineerRows,
  convertExcelToDataEngineerWithClient,
  generateDataEngineerCsv,
} from '../utils/excelParser';
import { BoutiqueInfo } from '../types';

interface DataEngineerConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyConvertedData?: (rows: DataEngineerRow[], clientInfo?: Partial<BoutiqueInfo>) => void;
  onOpenUploadWithFile?: (file: File, clientInfo?: Partial<BoutiqueInfo>) => void;
}

export const DataEngineerConverterModal: React.FC<DataEngineerConverterModalProps> = ({
  isOpen,
  onClose,
  onApplyConvertedData,
  onOpenUploadWithFile,
}) => {
  const [activeTab, setActiveTab] = useState<'app' | 'script'>('app');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<DataEngineerRow[]>([]);
  const [parsedClientInfo, setParsedClientInfo] = useState<Partial<BoutiqueInfo> | null>(null);
  const [scriptCopied, setScriptCopied] = useState(false);

  if (!isOpen) return null;

  const pythonColabScript = `import pandas as pd
from google.colab import files

print("1. Carica il file Excel:")
uploaded = files.upload()

file_name = list(uploaded.keys())[0]

# 2. Lettura del file Excel senza intestazione predefinita
df = pd.read_excel(file_name, header=None)

# 3. Estrazione e parsing dei dati reali (partendo dalla riga 10 in poi)
parsed_rows = []
for idx in range(10, len(df)):
    row = df.iloc[idx]
    style = str(row[0]).strip()
    
    # Interrompe o salta se incontra righe vuote o la riga finale di totale ("Итого")
    if style == 'Итого' or style == 'nan' or not style:
        continue
        
    desc = str(row[1]).strip()
    units = row[3]
    
    # Salta le intestazioni di categoria
    if desc == 'nan' or ',' not in desc:
        continue
        
    # Scompone la stringa in colonna 1 (es. "Жакет LS, L, 4606 0943")
    parts = [p.strip() for p in desc.split(',')]
    
    name = parts[0] if len(parts) > 0 else ""
    size = parts[1] if len(parts) > 1 else ""
    
    # Mantiene l'intera stringa del colore senza troncarla al primo spazio
    color = parts[2] if len(parts) > 2 else ""
    
    parsed_rows.append({
        'Style': style,
        'Name': name,
        'Color': color,
        'Size': size,
        'Units': units
    })

# Creazione del DataFrame finale con le colonne ordinate esattamente come richiesto
df_final = pd.DataFrame(parsed_rows)
required_columns = ['Style', 'Name', 'Color', 'Size', 'Units']
df_final = df_final[required_columns]

# 4. Salvataggio in formato CSV con codifica utf-8-sig
output_filename = 'export_ordinato.csv'
df_final.to_csv(output_filename, index=False, encoding='utf-8-sig')

print(f"\\nFile CSV generato correttamente con {len(df_final)} righe!")
print("\\nAnteprima delle prime righe:")
print(df_final.head(10))

# 5. Forzatura del download del file da Colab
print("\\nAvvio del download...")
files.download(output_filename)`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(pythonColabScript);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([pythonColabScript], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'convert_sellout_colab.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConvertExcel = async () => {
    if (!excelFile) {
      setErrorMsg('Seleziona un file Excel (.xlsx o .xls) da convertire.');
      return;
    }

    setConverting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Execute 1:1 identical python/colab pipeline with client header extraction (rows 9-12 col 4)
      const { rows, clientInfo } = await convertExcelToDataEngineerWithClient(excelFile);

      if (rows.length === 0) {
        throw new Error(
          'Nessuna riga valida trovata dopo la riga 10 con formato categoria e virgola nella colonna descrizione.'
        );
      }

      setParsedRows(rows);
      if (clientInfo && (clientInfo.name || clientInfo.location)) {
        setParsedClientInfo(clientInfo);
      }

      // Generate CSV with required columns ['Style', 'Name', 'Color', 'Size', 'Units'] and utf-8-sig
      const csvContent = generateDataEngineerCsv(rows);
      const outputFilename = 'export_ordinato.csv';

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = outputFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const totalUnits = rows.reduce((acc, r) => acc + (Number(r.Units) || 0), 0);
      const clientNotice = clientInfo?.name ? ` · Cliente: ${clientInfo.name}` : '';
      setSuccessMsg(
        `File CSV '${outputFilename}' generato e scaricato correttamente! ${rows.length} righe estratte (${totalUnits} capi venduti)${clientNotice}.`
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Errore nella conversione del file: ${err.message || 'File non conforme'}`);
    } finally {
      setConverting(false);
    }
  };

  const totalCalculatedUnits = parsedRows.reduce(
    (acc, r) => acc + (Number(r.Units) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900 text-white">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif-luxury text-2xl font-semibold text-stone-900">
              Data Engineer Converter (Excel → export_ordinato.csv)
            </h2>
            <p className="text-xs text-stone-500">
              Pipeline standard per 1C Boutique: parsing da riga 10, colonne{' '}
              <code className="font-mono bg-stone-100 text-amber-900 px-1 py-0.5 rounded">
                ['Style', 'Name', 'Color', 'Size', 'Units']
              </code>
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="mt-5 flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            onClick={() => setActiveTab('app')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              activeTab === 'app'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Convertitore Esecutivo (Browser)</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              activeTab === 'script'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Script Google Colab / Python</span>
          </button>
        </div>

        {activeTab === 'app' ? (
          <div className="mt-4 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Upload Area */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 block">
                1. Carica il file Excel 1C Boutique (.xlsx / .xls)
              </span>
              <p className="text-[11px] text-stone-500 mt-1">
                Il parser leggerà il file senza header predefinito, partendo dalla riga 10,
                ignorerà i totali ("Итого"), estrarrà nome, taglia e l'intera stringa del colore
                senza troncarla, e genererà <strong>export_ordinato.csv</strong> con codifica UTF-8-sig.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  id="data-engineer-file-input"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setExcelFile(f);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                />
                <label
                  htmlFor="data-engineer-file-input"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-xs font-medium text-stone-800 hover:bg-stone-100 transition shadow-xs"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                  <span>
                    {excelFile ? excelFile.name : 'Seleziona File Excel (.xlsx / .xls)'}
                  </span>
                </label>

                {excelFile && (
                  <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Pronto per la conversione
                  </span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-stone-500 font-sans-clean">
                Output: <strong className="text-stone-800">export_ordinato.csv</strong> (UTF-8-SIG)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleConvertExcel}
                  disabled={converting || !excelFile}
                  className="inline-flex items-center gap-2 rounded bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-stone-800 transition disabled:opacity-40 active:scale-95 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {converting
                      ? 'Conversione in corso...'
                      : 'Esegui Conversione & Scarica CSV'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Results Preview */}
            {parsedRows.length > 0 && (
              <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
                {parsedClientInfo?.name && (
                  <div className="mb-3 rounded-lg bg-amber-50/90 border border-amber-200/80 p-2.5 text-xs text-amber-950 flex flex-wrap items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-200/70 px-1.5 py-0.5 rounded text-amber-900">
                      Cliente Riconosciuto (righe 9-12 col 4):
                    </span>
                    <strong className="font-medium text-stone-900">{parsedClientInfo.name}</strong>
                    {parsedClientInfo.address && (
                      <span className="text-stone-600 font-sans-clean text-[11px]">
                        · {parsedClientInfo.address}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-serif-luxury text-sm font-semibold text-stone-900">
                      Anteprima: {parsedRows.length} Righe Estratte
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Totale Capi Venduti:{' '}
                      <strong className="text-amber-950 font-mono text-xs">
                        {totalCalculatedUnits} pz
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const csvContent = generateDataEngineerCsv(parsedRows);
                        const file = new File(['\uFEFF' + csvContent], 'export_ordinato.csv', {
                          type: 'text/csv;charset=utf-8;',
                        });

                        if (onOpenUploadWithFile) {
                          onOpenUploadWithFile(file, parsedClientInfo || undefined);
                        } else if (onApplyConvertedData) {
                          onApplyConvertedData(parsedRows, parsedClientInfo || undefined);
                          onClose();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded bg-amber-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-amber-800 transition active:scale-95 cursor-pointer"
                      title="Apre la finestra 'Carica File Ordini & Sell-Out' con export_ordinato.csv pre-caricato"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Carica Direttamente nella Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        const csv = generateDataEngineerCsv(parsedRows);
                        const blob = new Blob(['\uFEFF' + csv], {
                          type: 'text/csv;charset=utf-8;',
                        });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'export_ordinato.csv';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-stone-300 px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-100 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Riscarica CSV</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-lg border border-stone-200">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="sticky top-0 bg-stone-100 text-[11px] text-stone-700 uppercase font-medium">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Style</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Color (Completo)</th>
                        <th className="py-2 px-3">Size</th>
                        <th className="py-2 px-3 text-right">Units</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                      {parsedRows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="hover:bg-amber-50/40">
                          <td className="py-1 px-3 text-stone-400">{i + 1}</td>
                          <td className="py-1 px-3 font-semibold text-stone-900 font-sans-clean">
                            {r.Style}
                          </td>
                          <td className="py-1 px-3 text-stone-600 font-sans-clean">
                            {r.Name}
                          </td>
                          <td className="py-1 px-3 text-amber-900 font-semibold bg-amber-50/60 rounded">
                            {r.Color}
                          </td>
                          <td className="py-1 px-3 text-stone-700">{r.Size}</td>
                          <td className="py-1 px-3 text-right font-bold text-stone-900">
                            {r.Units}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 50 && (
                  <p className="mt-2 text-center text-[11px] text-stone-400">
                    Visualizzate prime 50 righe di {parsedRows.length} totali. Il file CSV scaricato contiene tutte le righe.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>Script Python per Google Colab o Jupyter Notebook:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1 rounded bg-stone-800 px-2.5 py-1 text-xs text-white hover:bg-stone-700 transition cursor-pointer"
                >
                  {scriptCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{scriptCopied ? 'Copiato!' : 'Copia Script'}</span>
                </button>
                <button
                  onClick={handleDownloadScript}
                  className="inline-flex items-center gap-1 rounded bg-amber-900 px-2.5 py-1 text-xs text-white hover:bg-amber-800 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Scarica .py</span>
                </button>
              </div>
            </div>

            <pre className="max-h-96 overflow-auto rounded-lg bg-stone-950 p-4 font-mono text-[11px] leading-relaxed text-stone-200 selection:bg-amber-700">
              {pythonColabScript}
            </pre>

            <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600 border border-stone-200">
              <strong>Come usarlo in Google Colab:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-0.5 text-stone-500">
                <li>Apri Google Colab (colab.research.google.com)</li>
                <li>Incolla il codice in una nuova cella</li>
                <li>Esegui la cella e seleziona il tuo file Excel quando richiesto</li>
                <li>Il file <code>export_ordinato.csv</code> verrà generato e scaricato automaticamente sul tuo computer!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end border-t border-stone-200 pt-3">
          <button
            onClick={onClose}
            className="rounded border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
