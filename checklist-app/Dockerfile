# Task-Flux — build Vite frontend + serve via Node (Express) API
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./
COPY public ./public
COPY src ./src
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY capacitor.config.ts ./

# Build-time frontend API URL (empty = same-origin /api)
ARG VITE_EMAIL_API_URL=
ARG VITE_APP_SEND_TOKEN=
ENV VITE_EMAIL_API_URL=$VITE_EMAIL_API_URL
ENV VITE_APP_SEND_TOKEN=$VITE_APP_SEND_TOKEN

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY --from=build /app/dist ./dist
# APK / iOS zip for /install.apk and /downloads (optional at runtime)
COPY release ./release

EXPOSE 8787
USER node
CMD ["node", "server/index.mjs"]
