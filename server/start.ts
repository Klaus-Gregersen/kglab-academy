import { resolve } from 'node:path';
import { securityConfig } from './config.ts';
import { createAppServer } from './app.ts';

const port = Number(process.env.PORT ?? (process.argv.includes('--preview') ? 4173 : 8080));
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
const host = process.env.HOST ?? '127.0.0.1';
const server = createAppServer({
  databasePath: resolve(process.env.KGLAB_VOTES_DB ?? 'data/community.sqlite'),
  distPath: resolve('dist'),
  ...securityConfig({
    ...process.env,
    NODE_ENV:
      process.env.NODE_ENV ?? (process.argv.includes('--preview') ? 'development' : 'production'),
  }),
});
server.listen(port, host, () => {
  console.log(`KG LAB Academy listening on http://${host}:${port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    server.close();
  });
