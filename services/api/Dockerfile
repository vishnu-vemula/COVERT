# Build from the repository root:
#   docker build -f services/api/Dockerfile -t covert-api .

FROM node:22-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY services/api/package.json services/api/
COPY apps/mobile/package.json apps/mobile/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @covert/api --include-workspace-root=false
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY services/api services/api
RUN npm run build --workspace @covert/api

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY services/api/package.json services/api/
COPY apps/mobile/package.json apps/mobile/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @covert/api --include-workspace-root=false --omit=dev && npm cache clean --force
COPY --from=build /repo/services/api/dist services/api/dist
USER node
WORKDIR /repo/services/api
EXPOSE 8080
CMD ["node", "dist/server.js"]
