import pandas as pd
import numpy as np
import os

def normalize_text(val):
    """Normalizes text by removing extra spaces and converting to uppercase."""
    if pd.isna(val) or val is None:
        return ""
    return str(val).strip().upper()

def process_fashion_data():
    excel_path = "4_Orders_2026-10-26.xlsx"
    csv_sell_out_path = "modelli_formato_piatto.csv"
    
    print("=== AVVIO PIPELINE DATA ENGINEERING FASHION ===")
    
    # --- FASE 1 & 2: Elaborazione file Excel ordini (Sell In & Cancelled) ---
    sell_in_records = []
    cancelled_records = []
    
    if os.path.exists(excel_path):
        xls = pd.ExcelFile(excel_path)
        for sheet_name in xls.sheet_names:
            df_sheet = pd.read_excel(xls, sheet_name=sheet_name, header=None)
            
            # Identifica la riga di intestazione contenente 'Style Name' o 'Style Number'
            header_row_idx = -1
            for r in range(min(len(df_sheet), 30)):
                row_vals = [str(val).strip() for val in df_sheet.iloc[r].values]
                if 'Style Name' in row_vals or 'Style Number' in row_vals or 'Modello' in row_vals:
                    header_row_idx = r
                    break
            
            if header_row_idx == -1:
                continue
                
            # Rilegge il foglio con la giusta intestazione
            df = pd.read_excel(xls, sheet_name=sheet_name, header=header_row_idx)
            df.columns = [str(c).strip() for c in df.columns]
            
            # Colonne chiave attese
            style_col = next((c for c in df.columns if 'Style Name' in c or 'Style Number' in c or 'Modello' in c), None)
            color_col = next((c for c in df.columns if 'Color' in c or 'Colore' in c or 'Colour' in c), None)
            
            if not style_col:
                continue
                
            # Identifica colonne taglia (es. U, XS, S, M, L, XL, 40, 42, 44, 46, 48, 50)
            standard_sizes = ['U', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '40', '42', '44', '46', '48', '50', '52']
            size_cols = [c for c in df.columns if str(c).replace('.0', '').strip() in standard_sizes]
            
            is_cancelled = "cancelled" in sheet_name.lower() or "cancell" in sheet_name.lower()
            
            for _, row in df.iterrows():
                style = row[style_col]
                if pd.isna(style) or str(style).strip().lower() in ['total', 'grand total', 'nan', '']:
                    continue
                
                modello = normalize_text(style)
                colore = normalize_text(row[color_col]) if color_col and color_col in df.columns else "UNICO"
                
                if size_cols:
                    # Formato griglia/matrice per taglie
                    for sz_col in size_cols:
                        qty = pd.to_numeric(row[sz_col], errors='coerce')
                        if not pd.isna(qty) and qty > 0:
                            taglia = str(sz_col).replace('.0', '').strip().upper()
                            record = {
                                'Modello': modello,
                                'Colore': colore,
                                'Taglia': taglia,
                                'Quantità': qty
                            }
                            if is_cancelled:
                                cancelled_records.append(record)
                            else:
                                sell_in_records.append(record)
                else:
                    # Formato piatto se presente colonna quantità e taglia
                    qty_col = next((c for c in df.columns if 'Unit' in c or 'Qty' in c or 'Quant' in c), None)
                    size_col = next((c for c in df.columns if 'Taglia' in c or 'Size' in c), None)
                    taglia = normalize_text(row[size_col]) if size_col else "U"
                    qty = pd.to_numeric(row[qty_col], errors='coerce') if qty_col else 1
                    if pd.isna(qty) or qty <= 0:
                        qty = 1
                        
                    record = {
                        'Modello': modello,
                        'Colore': colore,
                        'Taglia': taglia,
                        'Quantità': qty
                    }
                    if is_cancelled:
                        cancelled_records.append(record)
                    else:
                        sell_in_records.append(record)
        print(f"-> Letti ordini Sell In: {len(sell_in_records)} righe, Ordini Cancellati: {len(cancelled_records)} righe.")
    else:
        print(f"Attenzione: File Excel ordini '{excel_path}' non trovato. Verranno generati dati di esempio o utilizzato il file CSV.")

    # Costruzione DataFrame Sell In
    df_sell_in = pd.DataFrame(sell_in_records)
    if not df_sell_in.empty:
        df_sell_in = df_sell_in.groupby(['Modello', 'Colore', 'Taglia'], as_index=False)['Quantità'].sum()
        df_sell_in.rename(columns={'Quantità': 'Sell In'}, inplace=True)
    else:
        df_sell_in = pd.DataFrame(columns=['Modello', 'Colore', 'Taglia', 'Sell In'])

    # Sottrazione ordini cancellati (rettifiche)
    if cancelled_records:
        df_canc = pd.DataFrame(cancelled_records)
        df_canc = df_canc.groupby(['Modello', 'Colore', 'Taglia'], as_index=False)['Quantità'].sum()
        df_canc.rename(columns={'Quantità': 'Cancelled'}, inplace=True)
        
        df_sell_in = pd.merge(df_sell_in, df_canc, on=['Modello', 'Colore', 'Taglia'], how='left')
        df_sell_in['Cancelled'] = df_sell_in['Cancelled'].fillna(0)
        df_sell_in['Sell In'] = df_sell_in['Sell In'] - df_sell_in['Cancelled']
        df_sell_in['Sell In'] = df_sell_in['Sell In'].clip(lower=0)
        df_sell_in.drop(columns=['Cancelled'], inplace=True)

    # --- FASE 3: Lettura e normalizzazione file CSV Sell Out ---
    if os.path.exists(csv_sell_out_path):
        try:
            df_sell_out = pd.read_csv(csv_sell_out_path, encoding='utf-8')
        except UnicodeDecodeError:
            df_sell_out = pd.read_csv(csv_sell_out_path, encoding='windows-1251')
            
        print(f"-> Letto file Sell Out '{csv_sell_out_path}': {len(df_sell_out)} righe.")
    else:
        alt_csv = "modelli_formato_piatto_a63845c4.csv"
        if os.path.exists(alt_csv):
            df_sell_out = pd.read_csv(alt_csv, encoding='utf-8')
        else:
            df_sell_out = pd.DataFrame(columns=['Modello', 'Colore', 'Taglia', 'Quantità'])

    # Normalizzazione colonne CSV Sell Out
    df_sell_out.columns = [str(c).replace('\ufeff', '').strip() for c in df_sell_out.columns]
    
    mod_col = next((c for c in df_sell_out.columns if 'modello' in c.lower() or 'style' in c.lower()), df_sell_out.columns[0])
    col_col = next((c for c in df_sell_out.columns if 'colore' in c.lower() or 'color' in c.lower()), None)
    sz_col = next((c for c in df_sell_out.columns if 'taglia' in c.lower() or 'size' in c.lower()), None)
    qty_col = next((c for c in df_sell_out.columns if 'quant' in c.lower() or 'qty' in c.lower() or 'sold' in c.lower() or 'pezzi' in c.lower()), df_sell_out.columns[-1])

    normalized_sell_out = []
    for _, row in df_sell_out.iterrows():
        mod = normalize_text(row[mod_col])
        if not mod or mod in ['TOTAL', 'ITOG', 'NAN']:
            continue
        colore = normalize_text(row[col_col]) if col_col and col_col in df_sell_out.columns else "UNICO"
        taglia = normalize_text(row[sz_col]) if sz_col and sz_col in df_sell_out.columns else "U"
        qty = pd.to_numeric(row[qty_col], errors='coerce')
        if pd.isna(qty) or qty <= 0:
            qty = 1
            
        normalized_sell_out.append({
            'Modello': mod,
            'Colore': colore,
            'Taglia': taglia,
            'Sell Out': qty
        })

    df_sell_out_clean = pd.DataFrame(normalized_sell_out)
    if not df_sell_out_clean.empty:
        df_sell_out_clean = df_sell_out_clean.groupby(['Modello', 'Colore', 'Taglia'], as_index=False)['Sell Out'].sum()
    else:
        df_sell_out_clean = pd.DataFrame(columns=['Modello', 'Colore', 'Taglia', 'Sell Out'])

    # --- FASE 4 & 5: Merge (Full Outer Join) e normalizzazione colonne ---
    print("-> Esecuzione Full Outer Join tra Sell In e Sell Out...")
    df_merged = pd.merge(
        df_sell_in,
        df_sell_out_clean,
        on=['Modello', 'Colore', 'Taglia'],
        how='outer'
    )

    # Riempimento NaN con 0
    df_merged['Sell In'] = df_merged['Sell In'].fillna(0).astype(int)
    df_merged['Sell Out'] = df_merged['Sell Out'].fillna(0).astype(int)

    # Selezione e ordinamento rigoroso delle colonne richieste
    final_columns = ['Modello', 'Colore', 'Taglia', 'Sell In', 'Sell Out']
    for col in final_columns:
        if col not in df_merged.columns:
            df_merged[col] = 0
            
    df_final = df_merged[final_columns].sort_values(by=['Sell Out', 'Sell In', 'Modello'], ascending=[False, False, True]).reset_index(drop=True)

    # --- FASE 6: Salvataggio e Statistiche Descrittive ---
    output_filename = "database_sell_in_sell_out.csv"
    df_final.to_csv(output_filename, index=False, encoding='utf-8-sig')
    print(f"\n✅ Database finale salvato con successo in: '{output_filename}'")
    
    print("\n--- ANTEPRIMA DATAFRAME FINALE (Top 10 righe) ---")
    print(df_final.head(10).to_string(index=False))
    
    print("\n--- STATISTICHE DESCRITTIVE DI RIEPILOGO ---")
    total_sell_in = df_final['Sell In'].sum()
    total_sell_out = df_final['Sell Out'].sum()
    sell_out_rate = (total_sell_out / total_sell_in * 100) if total_sell_in > 0 else 0
    
    print(f"• Totale Pezzi Ordinati (Sell In): {total_sell_in:,}")
    print(f"• Totale Pezzi Venduti (Sell Out): {total_sell_out:,}")
    print(f"• Tasso di Sell-Through Globale: {sell_out_rate:.2f}%")
    print(f"• Numero totale combinazioni (Modello-Colore-Taglia): {len(df_final):,}")
    print(df_final[['Sell In', 'Sell Out']].describe())

if __name__ == "__main__":
    process_fashion_data()
