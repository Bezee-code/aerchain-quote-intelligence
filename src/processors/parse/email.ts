import * as mailparser from 'mailparser';
import { readFile } from 'fs/promises';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ParsedDocument, ParsedMetadata, ParsedImage } from '@/domain/types';
import { SUPPORTED_MIME_TYPES } from '@/domain/constants';
import { parseDocument } from '../pipeline';

export async function parseEmail(filePath: string): Promise<ParsedDocument> {
  const data = await readFile(filePath);
  const parsed = await mailparser.simpleParser(data);

  const textParts: string[] = [];
  textParts.push(`From: ${parsed.from?.text || ''}`);
  textParts.push(`To: ${parsed.to?.text || ''}`);
  textParts.push(`Subject: ${parsed.subject || ''}`);
  textParts.push(`Date: ${parsed.date || ''}`);
  textParts.push('');
  textParts.push(parsed.text || '');

  const images: ParsedImage[] = [];
  let attachmentCount = 0;

  if (parsed.attachments && parsed.attachments.length > 0) {
    const uploadDir = join(process.cwd(), 'uploads', 'email_attachments');
    await mkdir(uploadDir, { recursive: true });

    for (const attachment of parsed.attachments) {
      if (!attachment.content) continue;
      
      const mimeType = attachment.contentType || 'application/octet-stream';
      const parserType = SUPPORTED_MIME_TYPES[mimeType as keyof typeof SUPPORTED_MIME_TYPES];
      
      if (parserType) {
        attachmentCount++;
        const attachmentId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const attachmentPath = join(uploadDir, `${attachmentId}-${attachment.filename || 'attachment'}`);
        
        await writeFile(attachmentPath, attachment.content as Buffer);
        
        try {
          const parsedAttachment = await parseDocument(attachmentPath, mimeType);
          textParts.push(`\n--- ATTACHMENT: ${attachment.filename || 'unnamed'} (${mimeType}) ---`);
          textParts.push(parsedAttachment.text);
          
          for (const table of parsedAttachment.tables) {
            textParts.push(`\n[TABLE from attachment - Sheet: ${table.sheetName || 'default'}]`);
            textParts.push(table.headers.join(' | '));
            for (const row of table.rows.slice(0, 20)) {
              textParts.push(row.join(' | '));
            }
          }
          
          for (const img of parsedAttachment.images) {
            images.push(img);
          }
        } catch (e) {
          console.warn(`Failed to parse attachment ${attachment.filename}:`, e);
          textParts.push(`\n[Attachment ${attachment.filename} could not be parsed]`);
        }
      } else {
        textParts.push(`\n[Unsupported attachment: ${attachment.filename} (${mimeType})]`);
      }
    }
  }

  const metadata: ParsedMetadata = {
    pageCount: 1,
    attachmentCount,
    subject: parsed.subject,
    from: parsed.from?.text,
    date: parsed.date?.toISOString(),
  };

  return {
    id: `doc-${Date.now()}`,
    text: textParts.join('\n'),
    tables: [],
    images,
    mimeType: 'message/rfc822',
    metadata,
  };
}