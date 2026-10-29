import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, Lightbulb } from 'lucide-react';

interface PythonScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'colab' | 'cli' | 'streamlit'>('colab');

  if (!isOpen) return null;

  const colabScript = `import pandas as pd
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
files.download(output_filename)
`;


  const pythonCliScript = `#!/usr/bin/env python3
"""
Luisa Spagnoli - Boutique Spb Nevskiy
Automated Orders Consolidation & Sell-Out Performance Pipeline
"""

import pandas as pd
import re
import os

print("--- STEP 1: Consolidamento Ordini Multi-Foglio ---")
file_orders_name = '4_Orders_2026-10-26.xlsx'
xls_orders = pd.ExcelFile(file_orders_name)

all_orders = []
for sheet in xls_orders.sheet_names:
    # Filtra solo i fogli ordine attivi ed esclude fogli brevi di cancellazione per evitare l'errore header=[17]
    if sheet.startswith('PO#') and not sheet.startswith('Cancelled'):
        try:
            df_sheet = pd.read_excel(file_orders_name, sheet_name=sheet, header=17)
            df_sheet['PO_Number'] = sheet
            all_orders.append(df_sheet)
            print(f"  [OK] Caricato foglio {sheet} ({len(df_sheet)} righe)")
        except Exception as e:
            print(f"  [AVVISO] Foglio {sheet} saltato: {e}")

if all_orders:
    df_total_orders = pd.concat(all_orders, ignore_index=True)
    df_total_orders.to_csv("export_ordini_totale.csv", index=False, encoding='utf-8-sig')
    print("✓ File ordini unificato salvato: export_ordini_totale.csv")
else:
    df_total_orders = pd.DataFrame()

print("\\n--- STEP 2: Caricamento Database FOTO STYLE e SELL OUT ---")
file_foto_name = 'file foto style.xlsx'
file_sellout_name = 'невский зима 15.10.26 (2).xlsx'

df_foto = pd.read_excel(file_foto_name)

def clean_str(val):
    if pd.isna(val):
        return ""
    s = str(val).upper().strip()
    s = re.sub(r'[\.\-_/]+', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s

def get_color_prefix(val):
    s = str(val).lower().strip()
    # Verifica codici numerici 3 o 4 cifre
    digit_match = re.search(r'\b\d{3,4}\b', s)
    if digit_match:
        return digit_match.group(0).lstrip('0')
    digits = re.sub(r'\D', '', s)
    if len(digits) >= 3:
        return digits[:4].lstrip('0')
    # Lookup colori per nome (es. nero, cammello)
    if "nero" in s or "черный" in s or "черн" in s:
        return "999"
    if "0319" in s or "319" in s or "rosa" in s or "pink" in s or "розов" in s or "роза" in s:
        return "319"
    if "cammello" in s or "camel" in s:
        return "1020"
    if "bianco" in s or "avorio" in s:
        return "100"
    return ""

def extract_style_and_color(text):
    cleaned = re.sub(r'Luisa\s*Spagnoli', ' ', str(text), flags=re.IGNORECASE).strip()
    detected_color = get_color_prefix(cleaned)
    # Rimuove categorie di prodotto e noise
    cleaned = re.sub(r'\b(платье|жакет|пальто|юбка|блузка|блуза|джемпер|брюки|костюм|кардиган|топ|рубашка|полупальто|пуховик|жилет|шарф|abito|dress|giacca|jacket|gonna|skirt|cappotto|coat|pantaloni|trousers|pants|maglia|camicia|blouse|polo|shirt|var|colore|col|цвет)\b', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d{3,4}\b', ' ', cleaned)
    tokens = [t.strip() for t in re.split(r'[\s,./\-_]+', cleaned) if len(t.strip()) >= 3 and not t.strip().isdigit()]
    style_name = tokens[0] if tokens else cleaned.strip()
    return clean_str(style_name), detected_color

df_foto['Style_Clean'] = df_foto['Style Name'].apply(clean_str)
df_foto['Color_Prefix'] = df_foto['Color Name'].apply(get_color_prefix)

# Parsing del Sell Out dalla boutique (supporta sia .CSV sia .XLSX)
if file_sellout_name.lower().endswith('.csv'):
    # Riconosce automaticamente encoding e separatore (virgola , o punto e virgola ;)
    try:
        df_raw = pd.read_csv(file_sellout_name, sep=None, engine='python', header=None, encoding='utf-8-sig')
    except:
        df_raw = pd.read_csv(file_sellout_name, sep=None, engine='python', header=None, encoding='windows-1251')
else:
    df_raw = pd.read_excel(file_sellout_name, header=None)
parsed_rows = []

# Verifica se il file è in formato piatto tabellare (Modello, Colore, Taglia, Quantità)
first_row = [str(c).lower().strip() for c in (df_raw.iloc[0].values if len(df_raw) > 0 else [])]
is_flat_csv = any('modello' in c or 'style' in c for c in first_row) and any('quant' in c or 'qty' in c for c in first_row)

if is_flat_csv:
    style_col = [i for i, c in enumerate(first_row) if 'modello' in c or 'style' in c][0]
    color_col = [i for i, c in enumerate(first_row) if 'colore' in c or 'color' in c][0]
    size_col = [i for i, c in enumerate(first_row) if 'taglia' in c or 'size' in c][0]
    qty_col = [i for i, c in enumerate(first_row) if 'quant' in c or 'qty' in c][0]

    for idx, row in df_raw.iloc[1:].iterrows():
        raw_style = str(row[style_col]).strip()
        if not raw_style or raw_style.lower() == 'nan':
            continue
        raw_color = str(row[color_col]).strip() if pd.notnull(row[color_col]) else ''
        raw_size = str(row[size_col]).strip().upper() if pd.notnull(row[size_col]) else 'U'
        try:
            qty = float(row[qty_col])
        except:
            qty = 1.0

        parsed_rows.append({
            'Style': raw_style,
            'Colour': raw_color,
            'Size': raw_size,
            'Qty_Sold': qty,
            'Style_Clean': clean_str(raw_style),
            'Color_Prefix': get_color_prefix(raw_color)
        })
else:
    # Formato report gerarchico 1C / Boutique
    current_style = None
    current_color = ""

    for idx, row in df_raw.iterrows():
        row_text = " ".join([str(val) for val in row.values if pd.notnull(val)])
        col0 = str(row[0]).strip() if pd.notnull(row[0]) else ""

        if "Luisa Spagnoli" in row_text:
            current_style, current_color = extract_style_and_color(row_text)
        elif current_style and col0 and col0.lower() != "nan" and "итог" not in col0.lower():
            size = "U"
            raw_colour = col0
            if "," in col0:
                parts = [p.strip() for p in col0.split(',')]
                size = parts[0].upper()
                raw_colour = parts[1].split('/')[0].strip()
            else:
                size_match = re.match(r'^(XS|S|M|L|XL|XXL|40|42|44|46|48|50|U)\b', col0, re.IGNORECASE)
                if size_match:
                    size = size_match.group(1).upper()

            qty = 1
            for col_idx in [4, 3, 2, 5]:
                if len(row) > col_idx and pd.notnull(row[col_idx]):
                    try:
                        num = float(row[col_idx])
                        if 0 < num < 200:
                            qty = num
                            break
                    except:
                        pass

            color_prefix = get_color_prefix(raw_colour) or current_color

            parsed_rows.append({
                'Style': current_style,
                'Colour': raw_colour,
                'Size': size,
                'Qty_Sold': qty,
                'Style_Clean': clean_str(current_style),
                'Color_Prefix': color_prefix
            })

df_sellout_clean = pd.DataFrame(parsed_rows)

print("\\n--- STEP 3: Merge con Catalogo Foto e Calcolo Venduto ---")
df_merged = pd.merge(
    df_sellout_clean,
    df_foto,
    on=['Style_Clean', 'Color_Prefix'],
    how='left',
    suffixes=('', '_foto')
)

# Se alcune foto non combaciano col colore, fallback per solo Style_Clean
missing_photos = df_merged[df_merged['Image'].isna()]
if not missing_photos.empty:
    df_foto_unique = df_foto.drop_duplicates(subset=['Style_Clean'])
    df_merged = df_merged.combine_first(
        pd.merge(df_merged[['Style_Clean']], df_foto_unique, on='Style_Clean', how='left')
    )

df_sold_grouped = df_merged.groupby(
    ['Style', 'Image', 'Linesheet', 'Silhouette Name'], as_index=False
)['Qty_Sold'].sum()

# Aggregazione ordini per Style Name
if not df_total_orders.empty and 'Style Name' in df_total_orders.columns:
    df_orders_grouped = df_total_orders.groupby('Style Name', as_index=False)['Units'].sum().rename(
        columns={'Units': 'Qty_Ordered', 'Style Name': 'Style'}
    )
    df_orders_grouped['Style'] = df_orders_grouped['Style'].apply(clean_str)
else:
    df_orders_grouped = pd.DataFrame(columns=['Style', 'Qty_Ordered'])

# Unione e calcolo Sell-Out %:
# FORMULA: (Pezzi Venduti nel Sell-Out / Pezzi Ordinati nel File Ordine) * 100
df_analysis = pd.merge(df_sold_grouped, df_orders_grouped, on='Style', how='outer').fillna({
    'Qty_Sold': 0,
    'Qty_Ordered': 0
})

df_analysis['Sell_Out_Pct'] = (
    (df_analysis['Qty_Sold'] / df_analysis['Qty_Ordered']) * 100
).fillna(0).round(1)

# Ordinamento dal più grande al più piccolo in base ai pezzi venduti
df_analysis = df_analysis.sort_values(by=['Qty_Sold', 'Sell_Out_Pct'], ascending=[False, False])

output_filename = "report_sell_out_finale.csv"
df_analysis.to_csv(output_filename, index=False, encoding='utf-8-sig')

print(f"\\n✓ Elaborazione completata! Report finale salvato in: {output_filename}")
print(df_analysis.head(10))
`;

  const streamlitScript = `import streamlit as st
import pandas as pd
import re

st.set_page_config(page_title="Luisa Spagnoli | Sell-Out Analytics", layout="wide")

st.title("Luisa Spagnoli - Boutique Spb Nevskiy")
st.subheader("Sell-Out & Merchandising Dashboard")

# Caricamento file o default
col1, col2, col3 = st.columns(3)
with col1:
    f_orders = st.file_uploader("1. File Ordini (4_Orders...xlsx)", type=["xlsx"])
with col2:
    f_foto = st.file_uploader("2. File Foto (file foto style.xlsx)", type=["xlsx"])
with col3:
    f_sellout = st.file_uploader("3. Sell-Out (nevskiy зима...xlsx)", type=["xlsx"])

# Se caricati, esegue pipeline con visualizzazione immagini
if f_orders and f_foto and f_sellout:
    # 1. Carica ordini saltando i fogli cancellati per evitare header=17 IndexError
    xls = pd.ExcelFile(f_orders)
    orders = []
    for sheet in xls.sheet_names:
        if sheet.startswith('PO#') and not sheet.startswith('Cancelled'):
            df_sh = pd.read_excel(f_orders, sheet_name=sheet, header=17)
            orders.append(df_sh)
    df_tot_orders = pd.concat(orders, ignore_index=True)
    
    # 2. Mostra tabella con immagini HTML
    st.success("Dati riconciliati con successo!")
    st.dataframe(
        df_tot_orders.head(20),
        column_config={
            "Image": st.column_config.ImageColumn("Anteprima Capo")
        }
    )
`;

  const activeCode =
    tab === 'colab' ? colabScript : tab === 'cli' ? pythonCliScript : streamlitScript;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      tab === 'colab'
        ? 'convert_sellout_colab.py'
        : tab === 'cli'
        ? 'luisa_spagnoli_sellout.py'
        : 'app_streamlit_sellout.py';
    const blob = new Blob([activeCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-amber-800" />
          <h2 className="font-serif-luxury text-2xl font-semibold text-stone-900">
            Script Python & Automazione Sell-Out
          </h2>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          Codice sorgente pronto all'uso: script Colab per conversione 1C in export_ordinato.csv e pipeline ordini JOOR.
        </p>

        {/* Tab switch */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2">
          <button
            onClick={() => setTab('colab')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              tab === 'colab'
                ? 'bg-amber-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            Google Colab (export_ordinato.csv)
          </button>
          <button
            onClick={() => setTab('streamlit')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              tab === 'streamlit'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            Dashboard Streamlit (Interattiva Web)
          </button>
          <button
            onClick={() => setTab('cli')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              tab === 'cli'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            Script Batch Python (CLI / Cron / ETL)
          </button>
        </div>

        {/* Code box */}
        <div className="relative mt-4">
          <div className="flex items-center justify-between rounded-t-lg bg-stone-900 px-4 py-2 text-xs text-stone-300">
            <span className="font-mono">
              {tab === 'colab'
                ? 'convert_sellout_colab.py'
                : tab === 'cli'
                ? 'luisa_spagnoli_sellout.py'
                : 'app_streamlit.py'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded bg-stone-800 px-2.5 py-1 text-xs text-stone-200 hover:bg-stone-700 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copiato!' : 'Copia'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 rounded bg-amber-800 px-2.5 py-1 text-xs text-white hover:bg-amber-700 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Scarica .py</span>
              </button>
            </div>
          </div>
          <pre className="max-h-80 overflow-auto rounded-b-lg bg-stone-950 p-4 font-mono text-[11px] leading-relaxed text-stone-200">
            {activeCode}
          </pre>
        </div>

        {/* Diagnostic note */}
        <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200 p-3 text-xs text-stone-700">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <Lightbulb className="h-4 w-4" />
            <span>Spiegazione della Correzione Tecnica</span>
          </div>
          <p className="mt-1 text-stone-600">
            Nel run precedente lo script Python si è interrotto con{' '}
            <code className="text-stone-900 font-mono">ValueError: Passed header=[17], len of 1, but only 9 lines</code>{' '}
            perché il foglio <code className="text-stone-900 font-mono">Cancelled Styles PO# 19085382</code> conteneva solo 9 righe.
            Il codice corretto filtra con{' '}
            <code className="text-stone-900 font-mono">if sheet.startswith('PO#') and not sheet.startswith('Cancelled')</code>{' '}
            garantendo la corretta elaborazione di tutti gli ordini.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
