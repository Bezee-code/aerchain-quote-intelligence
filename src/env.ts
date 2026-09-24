import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  // .env not present or already loaded - fall back to process.env
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-flash-lite-latest'),
  OPENAI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);