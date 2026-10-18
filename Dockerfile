# Build the Next.js standalone server.
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci
COPY . .
RUN npm run build

# Run Next.js and Nginx together under Supervisor.
FROM node:22-alpine AS runner
RUN apk add --no-cache nginx supervisor gettext
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=127.0.0.1 \
    API_RATE_LIMIT=10r/s \
    LOGIN_RATE_LIMIT=2r/s \
    CONNECTIONS_PER_IP=20 \
    CLIENT_MAX_BODY_SIZE=10m \
    SERVER_NAME=_ \
    TLS_CERT_FILE=/etc/nginx/tls/origin.pem \
    TLS_KEY_FILE=/etc/nginx/tls/origin.key
WORKDIR /app
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf.template docker/tls.conf.template docker/proxy-common.conf /app/docker/
COPY docker/supervisord.conf /app/docker/supervisord.conf
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod 755 /app/docker/entrypoint.sh \
    && mkdir -p /etc/nginx/conf.d /etc/nginx/tls \
    && chown -R nginx:nginx /var/lib/nginx /var/log/nginx
EXPOSE 8080 8443
ENTRYPOINT ["/app/docker/entrypoint.sh"]
