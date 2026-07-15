# Multi-stage production build for Same Day Assist
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 5000
ENV NODE_ENV=production
CMD ["npm", "run", "server"]
