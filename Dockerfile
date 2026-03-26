FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lock* ./
COPY packages/ ./packages/
COPY services/ ./services/
COPY data/ ./data/
RUN bun install --frozen-lockfile || bun install
RUN bun run seed
EXPOSE 4000-4014
