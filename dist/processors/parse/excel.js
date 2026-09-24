import * as XLSX from 'xlsx';
export async function parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const textParts = [];
    const tables = [];
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (json.length > 0) {
            const headers = json[0];
            const rows = json.slice(1);
            textParts.push(`Sheet: ${sheetName}`);
            textParts.push(headers.join('\t'));
            for (const row of rows) {
                textParts.push(row.join('\t'));
            }
            tables.push({
                headers: headers.filter(h => h),
                rows: rows.filter(r => r.some(c => c)),
                pageNumber: 1,
            });
        }
    }
    return {
        id: `doc-${Date.now()}`,
        text: textParts.join('\n'),
        tables,
        images: [],
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
}
//# sourceMappingURL=excel.js.map