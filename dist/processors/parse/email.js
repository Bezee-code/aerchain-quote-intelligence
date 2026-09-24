import * as mailparser from 'mailparser';
import { readFile } from 'fs/promises';
export async function parseEmail(filePath) {
    const data = await readFile(filePath);
    const parsed = await mailparser.simpleParser(data);
    const textParts = [];
    textParts.push(`From: ${parsed.from?.text || ''}`);
    textParts.push(`To: ${parsed.to?.text || ''}`);
    textParts.push(`Subject: ${parsed.subject || ''}`);
    textParts.push(`Date: ${parsed.date || ''}`);
    textParts.push('');
    textParts.push(parsed.text || '');
    return {
        id: `doc-${Date.now()}`,
        text: textParts.join('\n'),
        tables: [],
        images: [],
        mimeType: 'message/rfc822',
    };
}
//# sourceMappingURL=email.js.map