# 1. Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY . .
RUN npm run build

# 2. Run Stage
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app .
RUN npm prune --production

# Create data directory for persistent session storage
RUN mkdir -p /app/data/sessions /app/data/backups

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
