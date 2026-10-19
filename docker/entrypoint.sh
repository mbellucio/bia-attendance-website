#!/bin/sh
set -eu

: "${API_RATE_LIMIT:=10r/s}"
: "${LOGIN_RATE_LIMIT:=2r/s}"
: "${CONNECTIONS_PER_IP:=20}"
: "${CLIENT_MAX_BODY_SIZE:=10m}"
: "${SERVER_NAME:=_}"
: "${TLS_CERT_FILE:=/etc/nginx/tls/origin.pem}"
: "${TLS_KEY_FILE:=/etc/nginx/tls/origin.key}"
export API_RATE_LIMIT LOGIN_RATE_LIMIT CONNECTIONS_PER_IP CLIENT_MAX_BODY_SIZE
export SERVER_NAME TLS_CERT_FILE TLS_KEY_FILE

# Apply pending database migrations before serving traffic.
cd /app
npx prisma migrate deploy

envsubst '${API_RATE_LIMIT} ${LOGIN_RATE_LIMIT} ${CONNECTIONS_PER_IP} ${CLIENT_MAX_BODY_SIZE}' \
  < /app/docker/default.conf.template \
  > /etc/nginx/conf.d/default.conf
mkdir -p /etc/nginx/snippets
cp /app/docker/proxy-common.conf /etc/nginx/snippets/proxy-common.conf

if [ -s "$TLS_CERT_FILE" ] && [ -s "$TLS_KEY_FILE" ]; then
  envsubst '${SERVER_NAME} ${TLS_CERT_FILE} ${TLS_KEY_FILE} ${CLIENT_MAX_BODY_SIZE} ${CONNECTIONS_PER_IP}' \
    < /app/docker/tls.conf.template \
    > /etc/nginx/conf.d/tls.conf
fi

nginx -t
exec /usr/bin/supervisord -n -c /app/docker/supervisord.conf


