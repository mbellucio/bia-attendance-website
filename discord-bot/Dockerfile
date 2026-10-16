FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-package-lock

COPY src ./src
USER node

CMD ["npm", "start"]
