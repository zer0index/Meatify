# 1. Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# 2. Run Stage
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app ./

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
