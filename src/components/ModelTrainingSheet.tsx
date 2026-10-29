import React, { useState, useMemo } from 'react';
import {
  ModelTrainingData,
  TrainingLanguage,
  LANGUAGE_LABELS,
  getModelTrainingData,
  generateTrainingHtmlOutput,
  checkModelStockAndOrderStatus,
  formatAvailabilityLabels,
} from '../data/trainingData';
import { MergedProduct, OrderItem } from '../types';
import {
  Sparkles,
  Globe,
  Printer,
  Copy,
  Check,
  FileCode,
  Upload,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';

interface ModelTrainingSheetProps {
  modelName: string;
  modelNumber?: string;
  image?: string;
  silhouette?: string;
  colorName?: string;
  fabrication?: string;
  products?: MergedProduct[];
  orders?: OrderItem[];
}

export const ModelTrainingSheet: React.FC<ModelTrainingSheetProps> = ({
  modelName,
  modelNumber,
  image,
  silhouette,
  colorName,
  fabrication,
  products = [],
  orders = [],
}) => {
  // Default language is Russian (matching the provided PDF Caprese-B-ru) or Italian
  const [lang, setLang] = useState<TrainingLanguage>('ru');
  const [copied, setCopied] = useState(false);
  const [viewHtmlCode, setViewHtmlCode] = useState(false);
  const [customJson, setCustomJson] = useState<any | null>(null);
  const [showJsonUploader, setShowJsonUploader] = useState(false);

  // Compute base training data
  const trainingData = useMemo<ModelTrainingData>(() => {
    if (customJson && customJson.modelName) {
      // If user uploaded a custom JSON matching Fonte A, C, D, E, 4
      return customJson as ModelTrainingData;
    }
    return getModelTrainingData(
      modelName,
      modelNumber,
      image,
      silhouette,
      colorName,
      fabrication
    );
  }, [modelName, modelNumber, image, silhouette, colorName, fabrication, customJson]);

  const htmlOutput = useMemo(() => {
    return generateTrainingHtmlOutput(trainingData, lang, products, orders);
  }, [trainingData, lang, products, orders]);

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${trainingData.modelName} - Scheda di Formazione Luisa Spagnoli</title>
          <style>
            body { font-family: 'Georgia', serif; margin: 40px; color: #1c1917; }
            img { max-width: 100%; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            th { background-color: #f9fafb; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlOutput}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setCustomJson(parsed);
        setShowJsonUploader(false);
      } catch (err) {
        alert('File JSON non valido.');
      }
    };
    reader.readAsText(file);
  };

  const sectionHeaders = {
    it: {
      analysis: `ANALISI ${trainingData.modelName.toUpperCase()}`,
      desc: 'DESCRIZIONE',
      colors: 'VARIANTI COLORE',
      styling: 'STYLING & VETRINE',
      sales: 'CONSIGLI DI VENDITA',
      objections: 'GESTIONE OBIEZIONI',
      objCol: 'Obiezione della Cliente',
      respCol: 'Risposta Strategica del Training Expert',
    },
    en: {
      analysis: `ANALYSIS ${trainingData.modelName.toUpperCase()}`,
      desc: 'DESCRIPTION',
      colors: 'COLOR VARIANTS',
      styling: 'STYLING & SHOWCASES',
      sales: 'SELLING TIPS',
      objections: 'OBJECTION HANDLING',
      objCol: 'Customer Objection',
      respCol: 'Strategic Sales Response',
    },
    ru: {
      analysis: `АНАЛИЗ ${trainingData.modelName.toUpperCase()}`,
      desc: 'ОПИСАНИЕ',
      colors: 'ВАРИАНТЫ ЦВЕТА',
      styling: 'СТАЙЛИНГ И СОЧЕТАНИЯ',
      sales: 'СОВЕТЫ ПО ПРОДАЖАМ',
      objections: 'УПРАВЛЕНИЕ ВОЗРАЖЕНИЯМИ',
      objCol: 'Возражение клиента',
      respCol: 'Стратегический ответ эксперта',
    },
    pl: {
      analysis: `ANALIZA ${trainingData.modelName.toUpperCase()}`,
      desc: 'OPIS',
      colors: 'WARIANTY KOLORYSTYCZNE',
      styling: 'STYLIZACJA I WITRYNY',
      sales: 'WSKAZÓWKI SPRZEDAŻOWE',
      objections: 'ZARZĄDZANIE OBIEKCJAMI',
      objCol: 'Obiekcja Klientki',
      respCol: 'Strategiczna odpowiedź doradcy',
    },
  }[lang];

  return (
    <div className="mt-8 border-t-2 border-stone-200 pt-8">
      {/* Luxury Editorial Header & Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-900 font-semibold">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Virtual Training Expert · Luisa Spagnoli Haute Couture</span>
          </div>
          <h3 className="mt-1 font-serif-luxury text-2xl font-bold tracking-tight text-stone-900">
            Scheda Formativa del Modello
          </h3>
          <p className="text-xs text-stone-500">
            Formato editoriale ufficiale sincronizzato con il lookbook e il catalogo foto
          </p>
        </div>

        {/* Action Controls & Language Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Switcher */}
          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-1 text-xs">
            {(Object.keys(LANGUAGE_LABELS) as TrainingLanguage[]).map((lKey) => (
              <button
                key={lKey}
                onClick={() => setLang(lKey)}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                  lang === lKey
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>{LANGUAGE_LABELS[lKey].flag}</span>
                <span>{LANGUAGE_LABELS[lKey].label}</span>
              </button>
            ))}
          </div>

          {/* Copy HTML Button */}
          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition shadow-2xs"
            title="Copia codice HTML come da istruzioni"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copiato!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-stone-500" />
                <span>Copia HTML</span>
              </>
            )}
          </button>

          {/* Print PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition shadow-2xs"
            title="Stampa o esporta scheda in PDF"
          >
            <Printer className="h-3.5 w-3.5 text-stone-500" />
            <span>Stampa PDF</span>
          </button>

          {/* Code View Toggle */}
          <button
            onClick={() => setViewHtmlCode(!viewHtmlCode)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition shadow-2xs ${
              viewHtmlCode
                ? 'border-amber-400 bg-amber-50 text-amber-900'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <FileCode className="h-3.5 w-3.5 text-stone-500" />
            <span>{viewHtmlCode ? 'Vista Scheda' : 'Sorgente HTML'}</span>
          </button>

          {/* Upload JSON Button */}
          <button
            onClick={() => setShowJsonUploader(!showJsonUploader)}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition shadow-2xs"
            title="Carica un file JSON con fonti A, C, D, E, 4"
          >
            <Upload className="h-3.5 w-3.5 text-stone-500" />
            <span>Carica JSON</span>
          </button>
        </div>
      </div>

      {/* JSON File Uploader Box (Collapsible) */}
      {showJsonUploader && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Caricamento File JSON di Formazione
              </h4>
              <p className="mt-1 text-xs text-amber-800">
                Puoi caricare un file JSON contenente le fonti (Fonte A: immagini URL, Fonte C: descrizioni,
                Fonte D: lookbook, Fonte E: varianti colore, Fonte 4: vetrine).
              </p>
              <div className="mt-3 flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900 transition">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Seleziona file .json</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonUpload}
                    className="hidden"
                  />
                </label>
                {customJson && (
                  <button
                    onClick={() => setCustomJson(null)}
                    className="text-xs text-stone-500 underline hover:text-stone-800"
                  >
                    Ripristina scheda modello predefinita
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HTML Code Inspection View */}
      {viewHtmlCode ? (
        <div className="mt-6 rounded-xl border border-stone-300 bg-stone-900 p-4 text-stone-100">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
            <span className="font-mono text-stone-400">Codice HTML Generato ({lang.toUpperCase()})</span>
            <button
              onClick={handleCopyHtml}
              className="text-amber-300 hover:text-amber-200 underline font-medium"
            >
              {copied ? 'Copiato!' : 'Copia codice negli appunti'}
            </button>
          </div>
          <pre className="mt-3 max-h-96 overflow-x-auto overflow-y-auto text-[11px] font-mono leading-relaxed text-amber-100/90 whitespace-pre-wrap">
            {htmlOutput}
          </pre>
        </div>
      ) : (
        /* Formatted Editorial Replica of the Attached PDF Caprese-B-ru.pdf */
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 sm:p-10 shadow-sm">
          {/* Header Bar identical to PDF Page 1 */}
          <div className="border-b border-stone-200 pb-5">
            <div className="text-xs font-bold tracking-[0.25em] text-stone-900 uppercase">
              LUISA SPAGNOLI
            </div>
            <div className="mt-1 text-xs text-stone-500 font-sans-clean">
              {trainingData.season[lang]}
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <h1 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                {trainingData.modelName}
              </h1>
              <span className="font-mono text-sm text-stone-400 tracking-wider">
                {trainingData.modelId}
              </span>
            </div>
          </div>

          {/* Hero Garment Image Showcase (Boxed like PDF Page 1) */}
          <div className="mt-8 rounded-lg border border-stone-200 bg-stone-50/50 p-6 flex justify-center">
            <div className="relative max-w-sm overflow-hidden rounded bg-white shadow-2xs">
              <img
                src={trainingData.heroImage}
                alt={trainingData.modelName}
                className="max-h-[380px] w-auto object-contain mx-auto"
              />
            </div>
          </div>

          {/* SECTION 1: DESCRIZIONE / ОПИСАНИЕ */}
          <div className="mt-8">
            <div className="border-b border-stone-200 pb-2">
              <h2 className="text-xs font-bold tracking-[0.18em] text-stone-600 uppercase">
                {sectionHeaders.desc}
              </h2>
            </div>
            <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-stone-800 font-sans-clean text-justify">
              {trainingData.description[lang]}
            </p>
          </div>

          {/* SECTION 2: VARIANTI COLORE / ВАРИАНТЫ ЦВЕТА */}
          <div className="mt-10">
            <div className="border-b border-stone-200 pb-2">
              <h2 className="text-xs font-bold tracking-[0.18em] text-stone-600 uppercase">
                {sectionHeaders.colors}
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trainingData.colors.map((color, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-stone-200 bg-white p-3 text-center shadow-2xs hover:border-amber-700 transition"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded bg-stone-50 flex items-center justify-center">
                    <img
                      src={color.image}
                      alt={color.name[lang]}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <div className="mt-2 text-xs font-medium text-stone-900">
                    {color.name[lang]} ({color.code})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: STYLING & VETRINE / СТАЙЛИНГ И СОЧЕТАНИЯ (PDF Page 2) */}
          <div className="mt-12">
            <div className="border-b border-stone-200 pb-2">
              <h2 className="text-xs font-bold tracking-[0.18em] text-stone-600 uppercase">
                {sectionHeaders.styling}
              </h2>
            </div>

            <div className="mt-5 space-y-8">
              {trainingData.stylingLooks[lang].map((look, lookIdx) => (
                <div
                  key={lookIdx}
                  className="rounded-xl border border-stone-200 bg-stone-50/40 p-5 sm:p-6"
                >
                  <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                    {look.title}
                  </h3>
                  <p className="mt-1 text-xs text-stone-600 font-mono">
                    {look.itemsListText}
                  </p>

                  {/* Real-time Order & Availability breakdown badges for each item mentioned */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {look.items.map((item, i) => {
                      const st = checkModelStockAndOrderStatus(item.name, products, orders);
                      const lb = formatAvailabilityLabels(st, lang);
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] border font-mono ${
                            st.isAvailable
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-semibold'
                              : st.isOrdered
                              ? 'bg-rose-50 text-rose-900 border-rose-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          <span className="font-bold">{item.name}:</span>
                          <span>{lb.shortStatus}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Horizontal Showcase of styled items with required thumbnail and stock/order indicators */}
                  <div className="mt-4 flex flex-wrap gap-3 sm:gap-4">
                    {look.items.map((item, itemIdx) => {
                      const status = checkModelStockAndOrderStatus(item.name, products, orders);
                      const labels = formatAvailabilityLabels(status, lang);

                      return (
                        <div
                          key={itemIdx}
                          className="flex flex-col items-center rounded-xl border border-stone-200 bg-white p-3 shadow-2xs hover:border-amber-400 transition"
                          style={{ width: '160px' }}
                        >
                          <div className="relative">
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: '120px',
                                height: '140px',
                                objectFit: 'contain',
                                borderRadius: '4px',
                                margin: '5px',
                              }}
                            />
                            {/* Visual Stock Dot */}
                            <span
                              className={`absolute top-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                                status.isAvailable
                                  ? 'bg-emerald-600'
                                  : status.isOrdered
                                  ? 'bg-rose-600'
                                  : 'bg-stone-300'
                              }`}
                              title={labels.availabilityBadge}
                            />
                          </div>

                          <span
                            className="mt-1 text-center font-mono text-[11px] font-semibold text-stone-900 truncate w-full"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          {item.role && (
                            <span
                              className="text-[10px] text-stone-400 text-center truncate w-full"
                              title={item.role}
                            >
                              {item.role}
                            </span>
                          )}

                          {/* Order Status & Availability in Boutique Badges */}
                          <div className="mt-2.5 w-full space-y-1 text-center">
                            {/* 1. Was it ordered? */}
                            <div
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                                status.isOrdered
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  : 'bg-stone-50 text-stone-500 border-stone-200'
                              }`}
                            >
                              <span className="flex items-center justify-center gap-1">
                                <span>{status.isOrdered ? '✓' : '✕'}</span>
                                <span>{labels.orderedBadge}</span>
                              </span>
                            </div>

                            {/* 2. Is it available (non venduto / stock rimanente)? */}
                            <div
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                                !status.isOrdered
                                  ? 'bg-stone-100 text-stone-500 border-stone-200 font-normal'
                                  : status.isAvailable
                                  ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {labels.availabilityBadge}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: CONSIGLI DI VENDITA / СОВЕТЫ ПО ПРОДАЖАМ (PDF Page 3) */}
          <div className="mt-12">
            <div className="border-b border-stone-200 pb-2">
              <h2 className="text-xs font-bold tracking-[0.18em] text-stone-600 uppercase">
                {sectionHeaders.sales}
              </h2>
            </div>

            <ol className="mt-4 space-y-3 pl-2 text-sm text-stone-800 leading-relaxed font-sans-clean">
              {trainingData.salesTips[lang].map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-900 text-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* SECTION 5: GESTIONE OBIEZIONI / УПРАВЛЕНИЕ ВОЗРАЖЕНИЯМИ (PDF Page 3) */}
          <div className="mt-12">
            <div className="border-b border-stone-200 pb-2">
              <h2 className="text-xs font-bold tracking-[0.18em] text-stone-600 uppercase">
                {sectionHeaders.objections}
              </h2>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-100/70 text-stone-700">
                    <th className="p-3 sm:p-4 font-semibold w-2/5">
                      {sectionHeaders.objCol}
                    </th>
                    <th className="p-3 sm:p-4 font-semibold w-3/5">
                      {sectionHeaders.respCol}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {trainingData.objections[lang].map((obj, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/30 transition">
                      <td className="p-3 sm:p-4 font-semibold text-stone-900 align-top bg-stone-50/30">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-amber-700 font-bold">
                            {idx + 1}.
                          </span>
                          <span>{obj.objection}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-stone-700 leading-relaxed align-top">
                        <strong className="text-amber-950 font-medium">
                          {lang === 'ru'
                            ? 'Ответ: '
                            : lang === 'it'
                            ? 'Risposta: '
                            : lang === 'en'
                            ? 'Response: '
                            : 'Odpowiedź: '}
                        </strong>
                        {obj.response}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer note & model signature */}
          <div className="mt-10 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span>Luisa Spagnoli Fashion Training Portal</span>
            <span className="font-mono">{trainingData.modelName} · Pagina Ufficiale</span>
          </div>
        </div>
      )}
    </div>
  );
};
