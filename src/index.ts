import Fastify from 'fastify';
import { registerRoutes } from './routes';
import fastifyStatic from '@fastify/static';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

const app = Fastify({ logger: true });

await app.register(import('@fastify/cors'), { origin: true });
await app.register(import('@fastify/multipart'), { limits: { fileSize: 50 * 1024 * 1024 } });

// Allow empty JSON body without throwing FST_ERR_CTP_EMPTY_JSON_BODY
app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    const text = typeof body === 'string' ? body.trim() : '';
    const json = text.length === 0 ? {} : JSON.parse(text);
    done(null, json);
  } catch (err: any) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

await registerRoutes(app);

if (process.env.NODE_ENV === 'production') {
  await app.register(fastifyStatic, {
    root: resolve(__dirname, '../dist/public'),
    prefix: '/',
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.sendFile('index.html');
  });
}

const port = parseInt(process.env.PORT || '3001', 10);

try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 API server running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}