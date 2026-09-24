import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    OPENAI_API_KEY: z.string().optional(),
});
export const env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map