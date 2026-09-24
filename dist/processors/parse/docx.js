import { extractRawText } from 'mammoth';
import { readFile } from 'fs/promises';
export async function parseDocx(filePath) {
    const data = await readFile(filePath);
    const result = await extractRawText({ buffer: data });
    const text = result.value;
    return {
        id: `doc-${Date.now()}`,
        text,
        tables: [],
        images: [],
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
}
//# sourceMappingURL=docx.js.map