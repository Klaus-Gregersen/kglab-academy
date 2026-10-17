import type { Plugin } from 'vite';
import { resolve } from 'node:path';
import { createVotingService } from './voting.ts';
import { securityConfig } from './config.ts';
import { serveApi } from './http.ts';

export function communityVoting(): Plugin {
  return {
    name: 'kglab-community-voting',
    apply: (_, environment) => environment.command === 'serve' && environment.mode !== 'test',
    configureServer(server) {
      const voting = createVotingService({
        ...securityConfig(),
        databasePath:
          process.env.KGLAB_VOTES_DB === ':memory:'
            ? ':memory:'
            : resolve(process.env.KGLAB_VOTES_DB ?? 'data/community.sqlite'),
      });
      server.httpServer?.once('close', () => voting.close());
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/api/')) {
          next();
          return;
        }
        void serveApi(request, response, voting.handle);
      });
    },
  };
}
