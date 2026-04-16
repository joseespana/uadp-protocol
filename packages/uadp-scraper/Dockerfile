FROM oven/bun:1-alpine
WORKDIR /app

COPY packages/uadp-scraper/package.json packages/uadp-scraper/
COPY packages/uadp-scraper/src/ packages/uadp-scraper/src/

WORKDIR /app/packages/uadp-scraper
RUN bun install --production

CMD ["bun", "run", "src/index.ts"]
