FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS build
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS static
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080

# Default runtime serves the same frontend plus shared community voting.
FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS production
WORKDIR /app
LABEL org.opencontainers.image.source="https://github.com/Klaus-Gregersen/kglab-academy" \
      org.opencontainers.image.title="KG LAB Academy" \
      org.opencontainers.image.licenses="MIT"
# The runtime uses Node built-ins only. Patch base libraries and omit package managers.
RUN apk add --no-cache --upgrade \
      libcrypto3=3.5.9-r0 libssl3=3.5.9-r0 zlib=1.3.2-r1 \
    && rm -rf /usr/local/lib/node_modules /opt/yarn-* \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 KGLAB_VOTES_DB=/app/data/community.sqlite
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server/app.ts /app/server/http.ts /app/server/voting.ts /app/server/limits.ts /app/server/config.ts /app/server/start.ts ./server/
COPY --from=build --chown=node:node /app/src/community/resources.ts ./src/community/resources.ts
COPY --from=build --chown=node:node /app/src/community/voting.ts ./src/community/voting.ts
RUN mkdir /app/data && chown node:node /app/data
USER node
# Fail during the image build if the entry point or its runtime imports are missing.
RUN node --check server/start.ts && node --input-type=module -e "await import('./server/app.ts'); await import('./server/config.ts')"
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "require('node:http').get('http://127.0.0.1:8080/healthz', {headers:{host:new URL(process.env.KGLAB_PUBLIC_ORIGIN).host}}, r=>{r.resume();process.exitCode=r.statusCode===204?0:1}).on('error',()=>process.exit(1))"
EXPOSE 8080
CMD ["node", "server/start.ts"]
