
FROM node:18-alpine AS build
WORKDIR /app


COPY package*.json tsconfig*.json ./
RUN npm ci


COPY . .


RUN npm run build

FROM node:18-alpine AS prod
WORKDIR /app


COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist

COPY --from=build /app/uploads ./uploads


ENV NODE_ENV=production
EXPOSE 9999


CMD ["node", "dist/server.js"]
