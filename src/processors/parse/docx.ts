import { extractRawText, convertToHtml } from 'mammoth';
import { readFile } from 'fs/promises';
import type { ParsedDocument, ParsedTable, ParsedMetadata } from '@/domain/types';

export async function parseDocx(filePath: string): Promise<ParsedDocument> {
  const data = await readFile(filePath);
  
  const textResult = await extractRawText({ buffer: data });
  const text = textResult.value;

  const htmlResult = await convertToHtml({ buffer: data });
  const html = htmlResult.value;

  const tables: ParsedTable[] = extractTablesFromHtml(html);

  const metadata: ParsedMetadata = {
    pageCount: 1,
    tableCount: tables.length,
  };

  return {
    id: `doc-${Date.now()}`,
    text,
    tables,
    images: [],
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    metadata,
  };
}

function extractTablesFromHtml(html: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match;
  
  while ((match = tableRegex.exec(html)) !== null) {
    const tableHtml = match[1];
    const table = parseHtmlTable(tableHtml);
    if (table.headers.length > 0 || table.rows.length > 0) {
      tables.push(table);
    }
  }
  
  return tables;
}

function parseHtmlTable(tableHtml: string): ParsedTable {
  const headers: string[] = [];
  const rows: string[][] = [];
  
  const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(tableHtml)) !== null) {
    headers.push(stripHtml(headerMatch[1]).trim());
  }
  
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(stripHtml(cellMatch[1]).trim());
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return {
    headers: headers.filter(h => h),
    rows: rows.filter(r => r.some(c => c)),
    pageNumber: 1,
    rowCount: rows.length,
    colCount: headers.length || (rows[0]?.length || 0),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .trim();
}