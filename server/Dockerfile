# syntax = docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

ENV NODE_ENV="production"

EXPOSE 8080

CMD ["node", "src/index.js"]
