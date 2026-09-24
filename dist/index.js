import Fastify from 'fastify';
import { registerRoutes } from './routes';
import fastifyStatic from '@fastify/static';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const app = Fastify({ logger: true });
await app.register(import('@fastify/cors'), { origin: true });
await app.register(import('@fastify/multipart'), { limits: { fileSize: 50 * 1024 * 1024 } });
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
const port = parseInt(process.env.PORT || '3000', 10);
try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
}
catch (err) {
    app.log.error(err);
    process.exit(1);
}
//# sourceMappingURL=index.js.map