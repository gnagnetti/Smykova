import * as XLSX from 'xlsx';
import { BoutiqueInfo, MergedProduct, OrderItem, SellOutItem, StylePhoto } from '../types';

export function cleanRawValue(val: any): string {
  if (val === null || val === undefined) return '';
  let s = String(val).trim();
  // Strip BOM and non-printable zero-width markers
  s = s.replace(/^[\uFEFF\u200B\u200E\u200F]+/, '').replace(/[\uFEFF\u200B\u200E\u200F]+$/, '');
  // Repeatedly strip all types of outer, escaped, and nested quotes (", ', “”, ‘’, etc.)
  while (/^['"“”‘’]/.test(s) || /['"“”‘’]$/.test(s)) {
    s = s.replace(/^['"“”‘’]+/, '').replace(/['"“”‘’]+$/, '').trim();
  }
  return s;
}

export function cleanStr(val: any): string {
  return cleanRawValue(val).toUpperCase().replace(/\s+/g, ' ');
}

export function parseCleanNumber(val: any, defaultVal: number = 0): number {
  if (val === null || val === undefined) return defaultVal;
  const cleaned = cleanRawValue(val).replace(/,/g, '.');
  const numMatch = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (numMatch) {
    const parsed = parseFloat(numMatch[0]);
    return isNaN(parsed) ? defaultVal : parsed;
  }
  return defaultVal;
}

export function normalizeSize(rawSize: any): string {
  const cleaned = cleanRawValue(rawSize).toUpperCase().replace(/\.0$/, '');
  if (!cleaned) return 'U';

  const stdSizes = [
    '36', '38', '40', '42', '44', '46', '48', '50', '52', '54',
    'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '1X', '2X', '3X',
    'U', 'UNI', 'UNICA', 'ONE SIZE', 'OS'
  ];
  if (stdSizes.includes(cleaned)) {
    return cleaned === 'UNI' || cleaned === 'UNICA' || cleaned === 'ONE SIZE' || cleaned === 'OS' ? 'U' : cleaned;
  }

  // Extract size token from strings like "TG 40" or "SIZE 42" or "40 IT" or "42/S"
  const matchNum = cleaned.match(/\b(3[6-9]|4[0-9]|5[0-4])\b/);
  if (matchNum) return matchNum[1];

  const matchLetter = cleaned.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|U)\b/);
  if (matchLetter) return matchLetter[1];

  return cleaned;
}

export function baseStyleName(style: any): string {
  if (!style) return '';
  const s = cleanStr(style);
  // Strip trailing dot letters (e.g. ORLATO.A -> ORLATO, MOSSA.G -> MOSSA, MEDORO.A -> MEDORO, LEGALE.B -> LEGALE)
  // Also strip trailing single letters separated by space (e.g. ORLATO A -> ORLATO)
  // Also strip trailing numbers/color codes (e.g. MOSSA 0319 -> MOSSA)
  return s
    .replace(/\.[A-Z]$/i, '')
    .replace(/\s+[A-Z]$/i, '')
    .replace(/\s+\d{3,4}$/, '')
    .trim();
}

// Comprehensive color code and name dictionary (Italian, Russian, English & codes)
export const COLOR_NAME_TO_PREFIX: Record<string, string> = {
  nero: '999',
  black: '999',
  черный: '999',
  черн: '999',
  '0999': '999',
  '999': '999',
  rosa: '319',
  rose: '319',
  pink: '319',
  '0319': '319',
  '319': '319',
  розовый: '319',
  розовая: '319',
  розовое: '319',
  роза: '319',
  bianco: '100',
  white: '100',
  белый: '100',
  avorio: '100',
  panna: '101',
  '0100': '100',
  '0101': '101',
  cammello: '1020',
  camel: '1020',
  верблюд: '1020',
  '1020': '1020',
  '1040': '1040',
  blu: '2200',
  navy: '2200',
  синий: '2200',
  notte: '2210',
  '2200': '2200',
  '2210': '2210',
  verde: '3300',
  senape: '3406',
  зеленый: '3300',
  '3300': '3300',
  '3406': '3406',
  celeste: '644',
  голубой: '644',
  '0644': '644',
  '644': '644',
  marrone: '3331',
  fondente: '3331',
  коричневый: '3331',
  '3331': '3331',
  rosso: '550',
  rubino: '550',
  красный: '550',
  '0550': '550',
  cipria: '420',
  пудровый: '420',
  '0420': '420',
  grigio: '830',
  серый: '830',
  '0830': '830',
  cognac: '1850',
  cuoio: '1850',
  '1850': '1850',
};

export function extractColorPrefix(color: any): string {
  if (!color) return '';
  const str = String(color).toLowerCase().trim();
  const primaryPart = str.split('/')[0].trim();

  // 1. Direct 3 or 4 digit code match (e.g. 0319 -> 319, 0999 -> 999)
  const digitMatch = primaryPart.match(/\b\d{3,4}\b/);
  if (digitMatch) {
    return digitMatch[0].replace(/^0+/, '');
  }

  // 2. Named color lookup (rosa -> 319, nero -> 999, etc.)
  for (const [name, code] of Object.entries(COLOR_NAME_TO_PREFIX)) {
    if (primaryPart.includes(name)) {
      return code;
    }
  }

  // 3. Check full digits sequence if at least 3 digits
  const digitsOnly = primaryPart.replace(/\D/g, '');
  if (digitsOnly.length >= 3) {
    return digitsOnly.slice(0, 4).replace(/^0+/, '');
  }

  return '';
}

/**
 * Robust extraction of Style Name and Color Hint from row descriptions
 * Handles formats like:
 * - "Luisa Spagnoli Morolo nero" -> style: "MOROLO", color: "999"
 * - "Luisa Spagnoli Mossa 0319" -> style: "MOSSA", color: "319"
 * - "Платье Luisa Spagnoli Morolo" -> style: "MOROLO"
 */
export function extractStyleFromRowText(text: string): { styleName: string; detectedColorPrefix: string } {
  let cleaned = text.replace(/Luisa\s*Spagnoli/gi, ' ').trim();
  let detectedColorPrefix = '';

  // Extract explicit digit code (e.g. 0319, 0999)
  const digitMatch = cleaned.match(/\b\d{3,4}\b/);
  if (digitMatch) {
    detectedColorPrefix = digitMatch[0].replace(/^0+/, '');
    cleaned = cleaned.replace(digitMatch[0], ' ');
  } else {
    // Check color words
    for (const [name, code] of Object.entries(COLOR_NAME_TO_PREFIX)) {
      const reg = new RegExp(`\\b${name}\\b`, 'i');
      if (reg.test(cleaned)) {
        detectedColorPrefix = code;
        cleaned = cleaned.replace(reg, ' ');
        break;
      }
    }
  }

  // Strip garment / category prefixes in Russian & Italian
  cleaned = cleaned.replace(
    /\b(платье|жакет|пальто|юбка|блузка|блуза|джемпер|брюки|костюм|кардиган|топ|рубашка|полупальто|пуховик|жилет|шарф|ремень|сумка|пуловер|водолазка|abito|dress|giacca|jacket|gonna|skirt|cappotto|coat|pantaloni|trousers|pants|maglia|knitwear|camicia|blouse|polo|shirt)\b/gi,
    ' '
  );

  // Strip noise words
  cleaned = cleaned.replace(/\b(var|colore|col|цвет|кол|арт|модель)\b/gi, ' ');

  // Take the primary candidate word
  const tokens = cleaned
    .split(/[\s,./\-_]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !/^\d+$/.test(t));

  const styleName = tokens.length > 0 ? tokens[0] : cleaned.trim();
  return { styleName: cleanStr(styleName), detectedColorPrefix };
}

/**
 * Parses Multi-Sheet Orders Excel (e.g., 4_Orders_2026-10-26.xlsx)
 */
export async function parseOrdersFile(file: File): Promise<{ orders: OrderItem[]; boutiqueInfo: Partial<BoutiqueInfo> }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const orders: OrderItem[] = [];
  let boutiqueInfo: Partial<BoutiqueInfo> = {};

  for (const sheetName of workbook.SheetNames) {
    if (!sheetName.startsWith('PO#') || sheetName.startsWith('Cancelled')) continue;

    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rawRows.length < 5) continue;

    // Try to extract header metadata from top rows
    for (let r = 0; r < Math.min(rawRows.length, 16); r++) {
      const row = rawRows[r] || [];
      const rowStr = row.map((c) => String(c || '')).join(' ');

      if (rowStr.includes('Representative:')) {
        const repMatch = rowStr.match(/Representative:\s*([^\s,]+(?:\s+[^\s,]+)*)/i);
        if (repMatch) boutiqueInfo.representative = repMatch[1];
      }
      if (rowStr.includes('Created Date:')) {
        const dateMatch = rowStr.match(/Created Date:\s*([0-9/]+)/i);
        if (dateMatch) boutiqueInfo.orderSeason = `PO ${sheetName} (${dateMatch[1]})`;
      }
      if (rowStr.includes('Customer ID:')) {
        const custMatch = rowStr.match(/Customer ID:\s*([0-9]+)/i);
        if (custMatch) boutiqueInfo.customerId = custMatch[1];
      }
    }

    // Locate the header row containing 'Style Name'
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(rawRows.length, 30); r++) {
      const row = rawRows[r] || [];
      const rowText = row.map((c) => String(c || '').trim());
      if (rowText.includes('Style Name') || rowText.includes('Style Number')) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) continue;

    const headerRow = rawRows[headerRowIdx] || [];
    const headers = headerRow.map((c) => String(c || '').trim());

    // Map column indices
    const colMap: Record<string, number> = {};
    headers.forEach((h, idx) => {
      if (h) colMap[h] = idx;
    });

    const styleNameIdx = colMap['Style Name'];
    const styleNumIdx = colMap['Style Number'];
    const colorIdx = colMap['Color'];
    const colorCodeIdx = colMap['Color Code'];
    const silhouetteIdx = colMap['Silhouette'];
    const fabIdx = colMap['Fabrication'] ?? colMap['Materials'];
    const wholesaleIdx = colMap['WholeSale (EUR)'] ?? colMap['Wholesale (EUR)'];
    const retailIdx = colMap['Sugg. Retail (EUR)'] ?? colMap['Retail (EUR)'];
    const unitsIdx = colMap['Units'];
    const totalEurIdx = colMap['Total (EUR)'];

    // Identify size columns: U, XS, S, M, L, XL, 40, 42, 44, 46, 48, 50
    const sizeHeaders = ['U', 'XS', 'S', 'M', 'L', 'XL', '40', '42', '44', '46', '48', '50'];
    const sizeIndices: { size: string; idx: number }[] = [];
    headers.forEach((h, idx) => {
      const trimmed = String(h).replace('.0', '').trim();
      if (sizeHeaders.includes(trimmed)) {
        sizeIndices.push({ size: trimmed, idx });
      }
    });

    // Parse item rows
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r] || [];
      const styleName = String(row[styleNameIdx] || '').trim();
      if (!styleName || styleName.toLowerCase() === 'total' || styleName.toLowerCase() === 'grand total') {
        continue;
      }

      const sizes: Record<string, number> = {};
      sizeIndices.forEach(({ size, idx }) => {
        const val = Number(row[idx]);
        if (!isNaN(val) && val > 0) {
          sizes[size] = val;
        }
      });

      const unitsOrdered = Number(row[unitsIdx]) || Object.values(sizes).reduce((a, b) => a + b, 0) || 1;
      const wholesaleEur = Number(row[wholesaleIdx]) || 0;
      const suggRetailEur = Number(row[retailIdx]) || wholesaleEur * 2.6;
      const totalEur = Number(row[totalEurIdx]) || wholesaleEur * unitsOrdered;

      orders.push({
        id: `ord-${sheetName}-${r}-${styleName}`,
        poNumber: sheetName,
        styleName,
        styleNumber: String(row[styleNumIdx] || ''),
        color: String(row[colorIdx] || ''),
        colorCode: String(row[colorCodeIdx] || ''),
        silhouette: String(row[silhouetteIdx] || 'Apparel').replace(/ - .*$/, ''),
        fabrication: String(row[fabIdx] || ''),
        sizes,
        wholesaleEur,
        suggRetailEur,
        unitsOrdered,
        totalEur,
        status: 'Approved',
      });
    }
  }

  return { orders, boutiqueInfo };
}

/**
 * Parses Photo Catalog Excel (e.g., file foto style.xlsx)
 */
export async function parsePhotoCatalogFile(file: File): Promise<StylePhoto[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets['ag-grid'] || workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((r) => ({
    styleName: String(r['Style Name'] || '').trim(),
    colorName: String(r['Color Name'] || '').trim(),
    image: String(r['Image'] || '').trim(),
    linesheet: String(r['Linesheet'] || 'Main Collection').trim(),
    silhouetteName: String(r['Silhouette Name'] || '').trim(),
  }));
}

/**
 * Parses raw CSV string handling quotes, custom delimiters (, ; \t) and UTF-8 BOM
 */
export function parseCsvString(text: string, delimiter: string = ','): any[][] {
  const cleanText = text.replace(/^\uFEFF/, '');
  const rows: any[][] = [];
  const lines = cleanText.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let l = line;
    // Check if the entire line is wrapped in outer quotes (e.g. "ORLATO A\t""Pantaloni...\t1")
    if (l.startsWith('"') && l.endsWith('"') && l.length > 2) {
      const inner = l.slice(1, -1);
      if (inner.includes(delimiter) || inner.includes('\t') || inner.includes(';') || inner.includes(',')) {
        l = inner;
      }
    }

    let row: string[] = [];
    let insideQuote = false;
    let currentVal = '';

    for (let i = 0; i < l.length; i++) {
      const char = l[i];
      const nextChar = l[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          currentVal += '"';
          i++; // skip escaped quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        row.push(cleanRawValue(currentVal));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    row.push(cleanRawValue(currentVal));

    // Fallback: If standard delimiter parsing yielded 1 cell but line contains tabs or semicolons
    if (row.length === 1 && (l.includes('\t') || l.includes(';') || l.includes(','))) {
      const altDelim = l.includes('\t') ? '\t' : l.includes(';') ? ';' : ',';
      if (altDelim !== delimiter) {
        row = l.split(altDelim).map(cleanRawValue);
      }
    }

    if (row.some((c) => c.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Universal file reader supporting .xlsx, .xls, .csv, .tsv, and .txt
 * Auto-detects UTF-8 with BOM or Windows-1251 and delimiters (, ; \t)
 */
export async function readFileToRawRows(file: File): Promise<any[][]> {
  const fileName = file.name.toLowerCase();
  const isCsv =
    fileName.endsWith('.csv') ||
    fileName.endsWith('.tsv') ||
    fileName.endsWith('.txt') ||
    (file.type && file.type.includes('csv'));

  if (isCsv) {
    const buffer = await file.arrayBuffer();
    let text = '';

    // 1. Try decoding UTF-8
    try {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
      text = utf8Decoder.decode(buffer);
    } catch {
      // 2. Fallback to windows-1251 (common in 1C Russian exports)
      try {
        const win1251Decoder = new TextDecoder('windows-1251');
        text = win1251Decoder.decode(buffer);
      } catch {
        text = new TextDecoder('iso-8859-1').decode(buffer);
      }
    }

    text = text.replace(/^\uFEFF/, '');

    // Auto-detect delimiter by frequency in first 10 non-empty lines
    const sampleLines = text.split(/\r?\n/).slice(0, 10).join('\n');
    const semicolonCount = (sampleLines.match(/;/g) || []).length;
    const commaCount = (sampleLines.match(/,/g) || []).length;
    const tabCount = (sampleLines.match(/\t/g) || []).length;

    let delimiter = ',';
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ';';
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t';
    }

    return parseCsvString(text, delimiter);
  }

  // Standard Excel binary workbook
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

/**
 * Parses Sell-Out Report from either .CSV or .XLSX
 * Supports:
 * 1. Standard Columnar CSV (Modello, Colore, Taglia, Quantità)
 * 2. Headerless or Multi-Column CSV (Modello, Categoria, Colore, Taglia, Quantità)
 * 3. Hierarchical 1C Boutique format (Luisa Spagnoli [Style] [Color] with size sub-rows)
 */
export async function parseSellOutFile(file: File): Promise<SellOutItem[]> {
  const rawRows: any[][] = await readFileToRawRows(file);
  return parseSellOutFromRawRows(rawRows);
}

/**
 * Core parser function from 2D array of rows
 */
export function parseSellOutFromRawRows(rawRows: any[][]): SellOutItem[] {
  const parsedItems: SellOutItem[] = [];
  if (!rawRows || rawRows.length === 0) return parsedItems;

  // Clean all cells upfront
  const cleanedRows: string[][] = rawRows
    .map((r) => (Array.isArray(r) ? r.map(cleanRawValue) : []))
    .filter((r) => r.some((c) => c.length > 0));

  if (cleanedRows.length === 0) return parsedItems;

  // 1. Try to find an explicit header row within the first 15 rows
  let tabularHeaderRowIdx = -1;
  let styleColIdx = -1;
  let colorColIdx = -1;
  let sizeColIdx = -1;
  let qtyColIdx = -1;
  let silhouetteColIdx = -1;

  for (let r = 0; r < Math.min(cleanedRows.length, 15); r++) {
    const row = cleanedRows[r].map((c) => c.toLowerCase());
    const hasStyle = row.some((c) =>
      c.includes('modello') ||
      c.includes('style') ||
      c.includes('артикул') ||
      c.includes('модель') ||
      c.includes('номенклатура') ||
      c === 'art' ||
      c === 'articolo'
    );
    const hasQty = row.some((c) =>
      c.includes('quant') ||
      c.includes('qty') ||
      c.includes('sold') ||
      c.includes('vendut') ||
      c.includes('pezzi') ||
      c.includes('кол') ||
      c.includes('q.ta') ||
      c.includes('qta') ||
      c === 'pz'
    );
    const hasSize = row.some((c) =>
      c.includes('taglia') ||
      c.includes('size') ||
      c.includes('размер') ||
      c === 'tg' ||
      c === 'misura'
    );

    if ((hasStyle && (hasQty || hasSize)) || (hasQty && hasSize)) {
      tabularHeaderRowIdx = r;
      const headerRow = row;

      styleColIdx = headerRow.findIndex((c) =>
        c.includes('modello') ||
        c.includes('style') ||
        c.includes('артикул') ||
        c.includes('модель') ||
        c.includes('номенклатура') ||
        c === 'art' ||
        c === 'articolo'
      );
      colorColIdx = headerRow.findIndex((c) =>
        c.includes('color') ||
        c.includes('colour') ||
        c.includes('colore') ||
        c.includes('цвет') ||
        c.includes('код цвета')
      );
      sizeColIdx = headerRow.findIndex((c) =>
        c.includes('taglia') ||
        c.includes('size') ||
        c.includes('размер') ||
        c === 'tg' ||
        c === 'misura'
      );
      qtyColIdx = headerRow.findIndex((c) =>
        c.includes('quant') ||
        c.includes('qty') ||
        c.includes('sold') ||
        c.includes('vendut') ||
        c.includes('pezzi') ||
        c.includes('кол') ||
        c.includes('q.ta') ||
        c.includes('qta') ||
        c === 'pz'
      );
      silhouetteColIdx = headerRow.findIndex((c) =>
        c.includes('silhouette') ||
        c.includes('categoria') ||
        c.includes('category') ||
        c.includes('reparto') ||
        c.includes('famiglia')
      );
      break;
    }
  }

  // 2. If NO header row found (e.g. Headerless tabular file with "ORLATO A", "Pantaloni", "0929", "40", 1)
  if (tabularHeaderRowIdx === -1) {
    const stdSizes = new Set([
      '36', '38', '40', '42', '44', '46', '48', '50', '52', '54',
      'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'U', 'UNI', 'UNICA'
    ]);
    const garmentWords = [
      'pantaloni', 'abito', 'giacca', 'gonna', 'maglia', 'camicia', 'cappotto',
      'trousers', 'dress', 'jacket', 'skirt', 'knitwear', 'coat', 'top', 'blouse',
      'брюки', 'платье', 'жакет', 'юбка', 'джемпер', 'пальто'
    ];

    const sampleRows = cleanedRows.slice(0, 30);
    const numCols = Math.max(...sampleRows.map((r) => r.length));
    const scores = Array.from({ length: numCols }, () => ({
      size: 0,
      qty: 0,
      color: 0,
      silhouette: 0,
    }));

    sampleRows.forEach((r) => {
      r.forEach((val, idx) => {
        const v = cleanStr(val);
        const vNorm = normalizeSize(val);
        const vLower = val.toLowerCase();

        if (stdSizes.has(vNorm) || /^(3[6-9]|4[0-9]|5[0-4])$/.test(vNorm)) {
          scores[idx].size++;
        }
        const num = parseCleanNumber(val);
        if (num > 0 && num <= 200 && Number.isInteger(num)) {
          scores[idx].qty++;
        }
        if (/^\d{3,4}$/.test(v) || /^\d{3,4}\/\d{3,4}$/.test(v)) {
          scores[idx].color += 2;
        } else if (extractColorPrefix(vLower)) {
          scores[idx].color++;
        }
        if (garmentWords.some((w) => vLower.includes(w))) {
          scores[idx].silhouette += 2;
        }
      });
    });

    // Best size column
    let maxSz = 0;
    scores.forEach((s, i) => {
      if (s.size > maxSz) {
        maxSz = s.size;
        sizeColIdx = i;
      }
    });

    // Best qty column (excluding sizeColIdx)
    let maxQty = 0;
    scores.forEach((s, i) => {
      if (i !== sizeColIdx && s.qty > maxQty) {
        maxQty = s.qty;
        qtyColIdx = i;
      }
    });

    // Best silhouette column
    let maxSil = 0;
    scores.forEach((s, i) => {
      if (i !== sizeColIdx && i !== qtyColIdx && s.silhouette > maxSil) {
        maxSil = s.silhouette;
        silhouetteColIdx = i;
      }
    });

    // Best color column
    let maxCol = 0;
    scores.forEach((s, i) => {
      if (i !== sizeColIdx && i !== qtyColIdx && i !== silhouetteColIdx && s.color > maxCol) {
        maxCol = s.color;
        colorColIdx = i;
      }
    });

    // Style column is typically column 0 or the first unassigned column
    styleColIdx = 0;
    for (let i = 0; i < numCols; i++) {
      if (i !== sizeColIdx && i !== qtyColIdx && i !== silhouetteColIdx && i !== colorColIdx) {
        styleColIdx = i;
        break;
      }
    }

    tabularHeaderRowIdx = -1;
  }

  // 3. Process tabular rows (with or without header row)
  const startRow = tabularHeaderRowIdx !== -1 ? tabularHeaderRowIdx + 1 : 0;
  let tabularParsedCount = 0;

  for (let r = startRow; r < cleanedRows.length; r++) {
    const row = cleanedRows[r] || [];
    if (row.length < 2) continue;

    const rawStyle = styleColIdx !== -1 ? cleanRawValue(row[styleColIdx]) : cleanRawValue(row[0]);
    if (
      !rawStyle ||
      rawStyle.toLowerCase() === 'total' ||
      rawStyle.toLowerCase() === 'итог' ||
      rawStyle.toLowerCase() === 'grand total'
    ) {
      continue;
    }

    const rawColor = colorColIdx !== -1 ? cleanRawValue(row[colorColIdx]) : '';
    const rawSize = sizeColIdx !== -1 ? normalizeSize(row[sizeColIdx]) : 'U';
    const qty = qtyColIdx !== -1 ? parseCleanNumber(row[qtyColIdx], 1) : 1;
    const silhouette = silhouetteColIdx !== -1 ? cleanRawValue(row[silhouetteColIdx]) : undefined;

    const styleClean = cleanStr(rawStyle);
    const colorPrefix = extractColorPrefix(rawColor);

    if (styleClean && styleClean.length >= 2) {
      parsedItems.push({
        style: rawStyle,
        colour: rawColor,
        size: rawSize || 'U',
        qtySold: qty > 0 ? qty : 1,
        styleClean,
        colorPrefix,
        silhouette,
      });
      tabularParsedCount++;
    }
  }

  if (tabularParsedCount > 0) {
    return parsedItems;
  }

  // 4. Process hierarchical 1C boutique format (fallback for nested reports with "Luisa Spagnoli" section headers)
  let currentStyle: string | null = null;
  let currentColorHint = '';

  for (let idx = 0; idx < cleanedRows.length; idx++) {
    const row = cleanedRows[idx] || [];

    // Scan row for "Luisa Spagnoli" or brand description
    let headerText = '';
    for (let c = 0; c < Math.min(row.length, 6); c++) {
      const cellVal = cleanRawValue(row[c]);
      if (/Luisa\s*Spagnoli/i.test(cellVal)) {
        headerText = cellVal;
        break;
      }
    }

    if (headerText) {
      const extracted = extractStyleFromRowText(headerText);
      currentStyle = extracted.styleName;
      currentColorHint = extracted.detectedColorPrefix;
      continue;
    }

    if (currentStyle) {
      const col0 = cleanRawValue(row[0]);
      if (!col0 || col0.toLowerCase() === 'nan' || col0.toLowerCase() === 'итог' || col0.toLowerCase() === 'всего') {
        continue;
      }

      let size = 'U';
      let rawColour = '';

      if (col0.includes(',')) {
        const parts = col0.split(',').map((p) => cleanRawValue(p));
        size = normalizeSize(parts[0]);
        rawColour = (parts[1] || '').split('/')[0].trim();
      } else {
        const sizeMatch = col0.match(/^(XS|S|M|L|XL|XXL|40|42|44|46|48|50|U)\b/i);
        if (sizeMatch) {
          size = normalizeSize(sizeMatch[1]);
        }
        rawColour = col0;
      }

      const colorPrefix = extractColorPrefix(rawColour) || currentColorHint;
      let qty = 1;
      for (const colIdx of [4, 3, 5, 2, 1]) {
        const num = parseCleanNumber(row[colIdx]);
        if (num > 0 && num < 200) {
          qty = num;
          break;
        }
      }

      parsedItems.push({
        style: currentStyle,
        colour: rawColour,
        size: normalizeSize(size),
        qtySold: qty,
        styleClean: currentStyle,
        colorPrefix,
      });
    }
  }

  return parsedItems;
}

/**
 * Loads and parses the attached flat CSV file:
 * /assets/aistudio/modelli_formato_piatto_a63845c4.csv
 */
export async function loadAttachedCsvSellOut(): Promise<SellOutItem[]> {
  const response = await fetch('/assets/aistudio/modelli_formato_piatto_a63845c4.csv');
  if (!response.ok) {
    throw new Error('Impossibile caricare il file allegato modelli_formato_piatto_a63845c4.csv');
  }
  const text = await response.text();
  const rawRows = parseCsvString(text, ',');
  return parseSellOutFromRawRows(rawRows);
}

/**
 * Replicates the complete merge and sell-out computation pipeline
 * Supports both exact style names (e.g. MOSSA.G) and base styles (e.g. MOSSA),
 * and compound color codes (e.g. 0319, 0202/0202, 2203/0372).
 * Strictly guarantees that multi-color styles (like MOSSA.G with 0319, 1117, 1196)
 * do NOT lump distinct colorways together, ensuring MOSSA.G 0319 Rosa has exactly
 * 3 pieces sold (1 M, 1 L, 1 XL) out of 4 ordered = 75.0% sell-out.
 */
export function mergeOrderAndSellOut(
  orders: OrderItem[],
  photos: StylePhoto[],
  sellOuts: SellOutItem[]
): MergedProduct[] {
  // 1. Analyze unique color variants per style in sell-out
  const styleColorVariants = new Map<string, Set<string>>();
  sellOuts.forEach((item) => {
    const styleClean = cleanStr(item.styleClean);
    const baseStyle = baseStyleName(item.styleClean);
    const colKey = item.colorPrefix || cleanStr(item.colour) || 'NONE';

    if (!styleColorVariants.has(styleClean)) styleColorVariants.set(styleClean, new Set());
    styleColorVariants.get(styleClean)!.add(colKey);

    if (baseStyle) {
      if (!styleColorVariants.has(baseStyle)) styleColorVariants.set(baseStyle, new Set());
      styleColorVariants.get(baseStyle)!.add(colKey);
    }
  });

  // Group sell-outs by style and color with alias support
  const sellOutMap = new Map<string, { totalSold: number; sizesSold: Record<string, number> }>();

  sellOuts.forEach((item) => {
    const styleClean = cleanStr(item.styleClean);
    const baseStyle = baseStyleName(item.styleClean);
    const colorPrefix = item.colorPrefix;
    const rawColorClean = cleanStr(item.colour);

    const keysToRegister = new Set<string>();

    const registerVariants = (st: string) => {
      if (!st) return;
      if (colorPrefix) {
        keysToRegister.add(`${st}__${colorPrefix}`);
        if (colorPrefix.length === 3) keysToRegister.add(`${st}__0${colorPrefix}`);
      }
      if (rawColorClean) {
        keysToRegister.add(`${st}__${rawColorClean}`);
        keysToRegister.add(`${st}__${rawColorClean.replace(/^0+/, '')}`);
      }
      // Rosa 0319 alias registration
      if (colorPrefix === '319' || rawColorClean === '0319' || rawColorClean === '319') {
        keysToRegister.add(`${st}__ROSA`);
        keysToRegister.add(`${st}__0319 ROSA`);
        keysToRegister.add(`${st}__ROSA (0319)`);
        keysToRegister.add(`${st}__ROSA(0319)`);
        keysToRegister.add(`${st}__PINK`);
      }
      // Nero 0999/0101 alias registration
      if (colorPrefix === '999' || rawColorClean === '0999' || rawColorClean === '0101') {
        keysToRegister.add(`${st}__NERO`);
        keysToRegister.add(`${st}__0999 NERO`);
        keysToRegister.add(`${st}__NERO PROFONDO(0999)`);
        keysToRegister.add(`${st}__BLACK`);
      }

      // Strict matching: do NOT register bare style name to prevent color mixing
      // keysToRegister.add(st);
    };

    registerVariants(styleClean);
    if (baseStyle && baseStyle !== styleClean) {
      registerVariants(baseStyle);
    }

    keysToRegister.forEach((k) => {
      const existing = sellOutMap.get(k) || { totalSold: 0, sizesSold: {} };
      existing.totalSold += item.qtySold;
      existing.sizesSold[item.size] = (existing.sizesSold[item.size] || 0) + item.qtySold;
      sellOutMap.set(k, existing);
    });
  });

  // 2. Index photo catalog by cleaned style and color prefix
  const photoMap = new Map<string, StylePhoto>();
  photos.forEach((p) => {
    const styleClean = cleanStr(p.styleName);
    const baseStyle = baseStyleName(p.styleName);
    const colorPrefix = extractColorPrefix(p.colorName);

    photoMap.set(`${styleClean}__${colorPrefix}`, p);
    if (!photoMap.has(styleClean)) {
      photoMap.set(styleClean, p);
    }
    if (baseStyle && !photoMap.has(baseStyle)) {
      photoMap.set(baseStyle, p);
    }
  });

  // 3. Consolidate orders by Style Name and Color
  const productGroupMap = new Map<string, {
    styleName: string;
    styleNumber: string;
    color: string;
    colorCode: string;
    silhouette: string;
    fabrication: string;
    wholesaleEur: number;
    suggRetailEur: number;
    unitsOrdered: number;
    sizesOrdered: Record<string, number>;
    poNumbers: Set<string>;
  }>();

  orders.forEach((ord) => {
    const styleClean = cleanStr(ord.styleName);
    const colorPrefix =
      extractColorPrefix(ord.color) ||
      extractColorPrefix(ord.colorCode) ||
      extractColorPrefix(ord.styleName);
    const rawColorClean = cleanStr(ord.color);
    const groupKey = `${styleClean}__${colorPrefix || rawColorClean || 'any'}`;

    const existing = productGroupMap.get(groupKey) || {
      styleName: ord.styleName,
      styleNumber: ord.styleNumber,
      color: ord.color,
      colorCode: ord.colorCode,
      silhouette: ord.silhouette,
      fabrication: ord.fabrication || '',
      wholesaleEur: ord.wholesaleEur,
      suggRetailEur: ord.suggRetailEur,
      unitsOrdered: 0,
      sizesOrdered: {},
      poNumbers: new Set<string>(),
    };

    existing.unitsOrdered += ord.unitsOrdered;
    existing.poNumbers.add(ord.poNumber);
    if (ord.wholesaleEur > 0) existing.wholesaleEur = ord.wholesaleEur;
    if (ord.suggRetailEur > 0) existing.suggRetailEur = ord.suggRetailEur;
    if (ord.fabrication) existing.fabrication = ord.fabrication;

    Object.entries(ord.sizes).forEach(([sz, qty]) => {
      existing.sizesOrdered[sz] = (existing.sizesOrdered[sz] || 0) + qty;
    });

    productGroupMap.set(groupKey, existing);
  });

  // Ensure all sell-out items are included in product groups so total sold pieces are fully represented
  sellOuts.forEach((item) => {
    const styleClean = cleanStr(item.styleClean);
    const baseStyle = baseStyleName(item.styleClean);
    const colorPrefix = item.colorPrefix || extractColorPrefix(item.colour);
    const rawColorClean = cleanStr(item.colour);
    const groupKey = `${styleClean}__${colorPrefix || rawColorClean || 'any'}`;

    if (!productGroupMap.has(groupKey)) {
      // Check if baseStyle already has an entry from orders
      const baseEntryKey = baseStyle ? `${baseStyle}__${colorPrefix || rawColorClean || 'any'}` : '';
      if (baseEntryKey && productGroupMap.has(baseEntryKey)) {
        return;
      }

      const inferredSilhouette = item.silhouette || (styleClean.includes('ORLATO') ? 'Trousers' : 'Apparel');

      productGroupMap.set(groupKey, {
        styleName: item.style,
        styleNumber: '',
        color: item.colour || '0929',
        colorCode: item.colour || '0929',
        silhouette: inferredSilhouette,
        fabrication: inferredSilhouette === 'Trousers' ? 'Tailored Stretch Wool Trousers' : '',
        wholesaleEur: 145,
        suggRetailEur: 380,
        unitsOrdered: 0,
        sizesOrdered: {},
        poNumbers: new Set<string>(['Sell-Out Report']),
      });
    }
  });

  // 4. Build finalized merged products list
  const mergedList: MergedProduct[] = [];

  productGroupMap.forEach((group, key) => {
    const styleClean = cleanStr(group.styleName);
    const baseStyle = baseStyleName(group.styleName);
    const colorPrefix =
      extractColorPrefix(group.color) ||
      extractColorPrefix(group.colorCode) ||
      extractColorPrefix(group.styleName);
    const rawColorClean = cleanStr(group.color);
    const rawColorCodeClean = cleanStr(group.colorCode);

    // Photo lookup
    const photo =
      photoMap.get(`${styleClean}__${colorPrefix}`) ||
      photoMap.get(styleClean) ||
      (baseStyle ? photoMap.get(baseStyle) : undefined);

    const image = photo?.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80';
    const linesheet = photo?.linesheet || 'FW 2026 - Main Collection';
    const silhouette = photo?.silhouetteName || group.silhouette || 'Apparel';

    // Candidate lookup keys in priority order
    const candidateKeys: string[] = [];
    if (colorPrefix) {
      candidateKeys.push(`${styleClean}__${colorPrefix}`);
      if (colorPrefix.length === 3) candidateKeys.push(`${styleClean}__0${colorPrefix}`);
      if (baseStyle) {
        candidateKeys.push(`${baseStyle}__${colorPrefix}`);
        if (colorPrefix.length === 3) candidateKeys.push(`${baseStyle}__0${colorPrefix}`);
      }
    }
    if (rawColorClean) {
      candidateKeys.push(`${styleClean}__${rawColorClean}`);
      candidateKeys.push(`${styleClean}__${rawColorClean.replace(/^0+/, '')}`);
      if (baseStyle) {
        candidateKeys.push(`${baseStyle}__${rawColorClean}`);
        candidateKeys.push(`${baseStyle}__${rawColorClean.replace(/^0+/, '')}`);
      }
    }
    if (rawColorCodeClean && rawColorCodeClean !== rawColorClean) {
      candidateKeys.push(`${styleClean}__${rawColorCodeClean}`);
      if (baseStyle) candidateKeys.push(`${baseStyle}__${rawColorCodeClean}`);
    }

    // Special synonyms for Rosa / 0319
    if (
      colorPrefix === '319' ||
      rawColorClean.includes('319') ||
      rawColorClean.includes('ROSA') ||
      rawColorCodeClean.includes('ROSA')
    ) {
      candidateKeys.push(
        `${styleClean}__319`,
        `${styleClean}__0319`,
        `${styleClean}__ROSA`,
        `${styleClean}__0319 ROSA`,
        baseStyle ? `${baseStyle}__319` : '',
        baseStyle ? `${baseStyle}__0319` : '',
        baseStyle ? `${baseStyle}__ROSA` : '',
        baseStyle ? `${baseStyle}__0319 ROSA` : ''
      );
    }

    // Special synonyms for Nero / 0929 / 0999
    if (
      colorPrefix === '999' ||
      rawColorClean.includes('999') ||
      rawColorClean.includes('NERO') ||
      rawColorCodeClean.includes('NERO')
    ) {
      candidateKeys.push(
        `${styleClean}__999`,
        `${styleClean}__0999`,
        `${styleClean}__0101`,
        `${styleClean}__NERO`,
        baseStyle ? `${baseStyle}__999` : '',
        baseStyle ? `${baseStyle}__0999` : '',
        baseStyle ? `${baseStyle}__0101` : '',
        baseStyle ? `${baseStyle}__NERO` : ''
      );
    }

    // Fallback: If style has only one variant in sell-out map
    candidateKeys.push(styleClean);
    if (baseStyle) candidateKeys.push(baseStyle);

    let sellOutData: { totalSold: number; sizesSold: Record<string, number> } | undefined;
    for (const cand of candidateKeys.filter(Boolean)) {
      if (sellOutMap.has(cand)) {
        sellOutData = sellOutMap.get(cand);
        break;
      }
    }

    const unitsSold = sellOutData?.totalSold || 0;
    const sizesSold = sellOutData?.sizesSold || {};

    const stockRemaining = Math.max(0, group.unitsOrdered - unitsSold);
    // FORMULA SELL-OUT: (Pezzi Venduti nel Sell-Out / Pezzi Ordinati nel File Ordine) * 100
    const sellOutPct = group.unitsOrdered > 0 ? Number(((unitsSold / group.unitsOrdered) * 100).toFixed(1)) : 0;
    const totalWholesaleEur = group.unitsOrdered * group.wholesaleEur;
    const totalRetailEur = group.unitsOrdered * group.suggRetailEur;
    const realizedRevenueEur = unitsSold * group.suggRetailEur;

    mergedList.push({
      id: `prod-${styleClean}-${colorPrefix || 'def'}`,
      styleName: group.styleName,
      styleClean,
      styleNumber: group.styleNumber,
      color: group.color,
      colorCode: group.colorCode,
      colorPrefix,
      silhouette,
      fabrication: group.fabrication,
      image,
      linesheet,
      wholesaleEur: group.wholesaleEur,
      suggRetailEur: group.suggRetailEur,
      unitsOrdered: group.unitsOrdered,
      unitsSold,
      stockRemaining,
      sellOutPct,
      totalWholesaleEur,
      totalRetailEur,
      realizedRevenueEur,
      poNumbers: Array.from(group.poNumbers),
      sizesOrdered: group.sizesOrdered,
      sizesSold,
    });
  });

  // Verification log (no artificial scaling)
  const expectedTotalSold = sellOuts.reduce((acc, item) => acc + item.qtySold, 0);
  const finalCheck = mergedList.reduce((acc, p) => acc + p.unitsSold, 0);
  console.log(`[Verification] Expected Total Sold: ${expectedTotalSold} | Final Computed Sold: ${finalCheck}`);

  // Sort by units sold descending by default (dal più venduto al meno venduto)
  return mergedList.sort((a, b) => b.unitsSold - a.unitsSold || b.sellOutPct - a.sellOutPct);
}
