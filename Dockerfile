FROM node:24-bookworm-slim
ENV NODE_ENV=production DB_DIR=/app/db PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node . .
RUN mkdir -p /app/db && chown node:node /app/db
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["node", "scripts/healthcheck.js"]
CMD ["node", "server.js"]
