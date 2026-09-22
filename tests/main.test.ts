import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ChessComApiClient,
  type ChessLogger,
} from "../src/api-client.js";
import { ChessComMcpServer } from "../src/mcp-server.js";
import { ChessMcpApplication, ChessSseServer } from "../src/main.js";

const silentLogger: ChessLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

function createMcpServer(): ChessComMcpServer {
  return new ChessComMcpServer(new ChessComApiClient({ logger: silentLogger }));
}

describe("ChessMcpApplication", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.exitCode = 0;
  });

  it("starts the stdio transport through the MCP server class", async () => {
    const server = createMcpServer();
    const connect = vi.spyOn(server, "connect").mockResolvedValue();
    const application = new ChessMcpApplication(server, silentLogger);

    await application.run("stdio");

    expect(connect).toHaveBeenCalledOnce();
    expect(connect.mock.calls[0]?.[0]).toHaveProperty("start");
  });

  it("applies the configured API base URL during environment setup", () => {
    vi.stubEnv("CHESS_API_BASE_URL", "https://example.test/pub");
    const server = createMcpServer();
    const application = new ChessMcpApplication(server, silentLogger);

    expect(application.setupEnvironment()).toBe(true);
    expect(server.api.config.baseUrl).toBe("https://example.test/pub");
  });

  it("owns SSE startup and closes it during shutdown", async () => {
    vi.stubEnv("PORT", "0");
    vi.stubEnv("HOST", "127.0.0.1");
    const server = createMcpServer();
    const close = vi.spyOn(server, "close").mockResolvedValue();
    const application = new ChessMcpApplication(server, silentLogger);

    await application.run("sse");
    await application.shutdown();

    expect(close).toHaveBeenCalledOnce();
  });
});

describe("ChessSseServer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serves a health check and not-found responses", async () => {
    const server = createMcpServer();
    const sseServer = new ChessSseServer(server.server, silentLogger);
    const httpServer = await sseServer.start(0, "127.0.0.1");
    const address = httpServer.address();

    if (address === null || typeof address === "string") {
      throw new Error("Expected the SSE server to expose a TCP address.");
    }

    try {
      const healthResponse = await fetch(`http://127.0.0.1:${address.port}/health`);
      await expect(healthResponse.json()).resolves.toEqual({ status: "ok" });

      const notFoundResponse = await fetch(`http://127.0.0.1:${address.port}/missing`);
      expect(notFoundResponse.status).toBe(404);
      await expect(notFoundResponse.json()).resolves.toEqual({ error: "Not found" });
    } finally {
      await sseServer.close();
    }
  });

  it("rejects messages without a known SSE session", async () => {
    const server = createMcpServer();
    const sseServer = new ChessSseServer(server.server, silentLogger);
    const httpServer = await sseServer.start(0, "127.0.0.1");
    const address = httpServer.address();

    if (address === null || typeof address === "string") {
      throw new Error("Expected the SSE server to expose a TCP address.");
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/messages`, {
        method: "POST",
        body: "{}",
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: "Unknown or missing sessionId" });
    } finally {
      await sseServer.close();
    }
  });
});