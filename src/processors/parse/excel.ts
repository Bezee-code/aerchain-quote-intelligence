import XLSX from 'xlsx';
import type { ParsedDocument, ParsedTable, ParsedMetadata } from '@/domain/types';

export async function parseExcel(filePath: string): Promise<ParsedDocument> {
  const workbook = XLSX.readFile(filePath);
  const textParts: string[] = [];
  const tables: ParsedTable[] = [];
  const sheetNames: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    sheetNames.push(sheetName);
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (json.length > 0) {
      const headers = json[0] as string[];
      const rows = json.slice(1) as string[][];

      textParts.push(`Sheet: ${sheetName}`);
      textParts.push(headers.join('\t'));
      for (const row of rows) {
        textParts.push(row.join('\t'));
      }

      tables.push({
        headers: headers.filter(h => h),
        rows: rows.filter(r => r.some(c => c)),
        pageNumber: 1,
        sheetName,
        rowCount: rows.length,
        colCount: headers.length,
      });
    }
  }

  const metadata: ParsedMetadata = {
    sheetNames,
    pageCount: workbook.SheetNames.length,
  };

  return {
    id: `doc-${Date.now()}`,
    text: textParts.join('\n'),
    tables,
    images: [],
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    metadata,
  };
}