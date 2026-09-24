import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolve } from 'path';
import * as schema from './schema';
import { generateId as generateIdUtil, now } from './utils';
const dbPath = resolve(process.cwd(), 'data/dev.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
export const db = drizzle(sqlite, { schema });
export function generateId(prefix) {
    return generateIdUtil(prefix);
}
export { now };
//# sourceMappingURL=client.js.map