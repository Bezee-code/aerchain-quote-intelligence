import Fastify from 'fastify';

const app = Fastify({ logger: true });
app.get('/test', async () => ({ ok: true }));

try {
  await app.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Server started on port 3000');
  console.log('Server address:', app.server.address());
  console.log('Waiting for requests...');
  
  // Keep alive
  setInterval(() => {}, 1000);
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}