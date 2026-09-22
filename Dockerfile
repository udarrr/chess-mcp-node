ARG VERSION=0.1.0

FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src/

RUN npm ci && \
  npm run build && \
  npm prune --omit=dev

FROM node:20-bookworm-slim

ARG VERSION=0.1.0

WORKDIR /app

RUN groupadd -r app && useradd -r -g app app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
COPY package.json /app/

ENV NODE_ENV=production

USER app

EXPOSE 8000

CMD ["node", "/app/dist/main.js"]

# OCI Image Labels
LABEL org.opencontainers.image.title="Chess.com API MCP Server" \
      org.opencontainers.image.description="Model Context Protocol server for Chess.com API integration" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.authors="Pavel Shklovsky" \
      org.opencontainers.image.source="https://github.com/udarrr/chess-mcp-node" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://github.com/udarrr/chess-mcp-node" \
      org.opencontainers.image.documentation="https://github.com/udarrr/chess-mcp-node#readme" \
      org.opencontainers.image.vendor="Pavel Shklovsky" \
      io.modelcontextprotocol.server.name="io.github.udarrr/chess-mcp-node" \
      mcp.server.transport.stdio="true" \
      mcp.server.category="data-retrieval" \
      mcp.server.tags="chess,chess.com,games,api,player-stats"
