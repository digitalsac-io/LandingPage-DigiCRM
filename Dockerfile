FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
# Use npm install (not ci) to handle lock file format differences across npm versions
RUN npm install

FROM node:22-slim AS build
WORKDIR /app
# Prisma needs OpenSSL to detect the query-engine libssl at build (migrate/generate)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./data/landing.db"
# Create data dir so prisma can write the build-time DB (needed for sitemap prerender)
RUN mkdir -p data && npx prisma generate && npx prisma migrate deploy && npm run build

FROM node:22-slim
WORKDIR /app
# Prisma's schema/migrate engine needs OpenSSL at runtime (entrypoint runs `prisma migrate deploy`)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3005 HOSTNAME=0.0.0.0
# standalone Next output
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# prisma migrations + schema (needed for migrate deploy at runtime)
COPY --from=build /app/prisma ./prisma
# prisma.config.ts holds the datasource url (schema.prisma has no `url`); the Prisma CLI
# needs it at runtime or `migrate deploy` fails with "datasource.url property is required".
COPY --from=build /app/prisma.config.ts ./
# Copy ALL node_modules needed by the entrypoint (prisma CLI + adapter + bcryptjs + their deep deps).
# Copying the full node_modules is the safest approach here because prisma CLI has
# deep transitive deps (effect, c12, deepmerge-ts, empathic, …) that are hard to enumerate.
COPY --from=build /app/node_modules ./node_modules
# messages (i18n) must be accessible at runtime
COPY --from=build /app/messages ./messages
# seed script
COPY --from=build /app/scripts ./scripts
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:3005/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
