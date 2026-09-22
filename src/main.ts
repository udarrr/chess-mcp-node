import { createServer as createHttpServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { config as loadDotenv } from "dotenv";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  ConsoleChessLogger,
  DEFAULT_BASE_URL,
  type ChessLogger,
} from "./api-client.js";
import { chessMcpServer, mcp, ChessComMcpServer } from "./mcp-server.js";

export type Transport = "stdio" | "sse";
type JsonResponse = Record<string, unknown>;

export class ChessSseServer {
  private readonly transports = new Map<string, SSEServerTransport>();
  private httpServer?: HttpServer;

  public constructor(
    private readonly server: McpServer,
    private readonly logger: ChessLogger = new ConsoleChessLogger(),
  ) {}

  public async start(
    port = Number.parseInt(process.env.PORT ?? "8000", 10),
    host = process.env.HOST ?? "0.0.0.0",
  ): Promise<HttpServer> {
    const httpServer = createHttpServer((request, response) => {
      this.handleRequest(request, response);
    });

    await new Promise<void>((resolveServer, rejectServer) => {
      const handleError = (error: Error): void => {
        httpServer.off("listening", handleListening);
        rejectServer(error);
      };
      const handleListening = (): void => {
        httpServer.off("error", handleError);
        resolveServer();
      };

      httpServer.once("error", handleError);
      httpServer.once("listening", handleListening);
      httpServer.listen(port, host);
    });

    this.logger.info("SSE server listening", { host, port });
    this.httpServer = httpServer;
    return httpServer;
  }

  public async close(): Promise<void> {
    await Promise.all([...this.transports.values()].map((transport) => transport.close()));
    this.transports.clear();

    const httpServer = this.httpServer;
    this.httpServer = undefined;
    if (httpServer === undefined) {
      return;
    }

    await new Promise<void>((resolveServer, rejectServer) => {
      httpServer.close((error) => {
        if (error) {
          rejectServer(error);
        } else {
          resolveServer();
        }
      });
    });
  }

  private handleRequest(request: IncomingMessage, response: ServerResponse): void {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      this.respondJson(response, 200, { status: "ok" });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/sse") {
      this.openSseConnection(response);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/messages") {
      void this.handleMessage(request, response, requestUrl.searchParams.get("sessionId"));
      return;
    }

    this.respondJson(response, 404, { error: "Not found" });
  }

  private openSseConnection(response: ServerResponse): void {
    const transport = new SSEServerTransport("/messages", response);
    this.transports.set(transport.sessionId, transport);
    transport.onclose = () => {
      this.transports.delete(transport.sessionId);
    };

    void this.server.connect(transport).catch((error: unknown) => {
      this.transports.delete(transport.sessionId);
      this.reportHttpError(response, error);
    });
  }

  private async handleMessage(
    request: IncomingMessage,
    response: ServerResponse,
    sessionId: string | null,
  ): Promise<void> {
    const transport = sessionId === null ? undefined : this.transports.get(sessionId);

    if (transport === undefined) {
      this.respondJson(response, 404, { error: "Unknown or missing sessionId" });
      return;
    }

    try {
      await transport.handlePostMessage(request, response);
    } catch (error) {
      this.reportHttpError(response, error);
    }
  }

  private respondJson(response: ServerResponse, statusCode: number, body: JsonResponse): void {
    response.writeHead(statusCode, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
  }

  private reportHttpError(response: ServerResponse, error: unknown): void {
    this.logger.error("SSE request failed", { error: ChessSseServer.errorMessage(error) });
    if (!response.headersSent) {
      this.respondJson(response, 500, { error: "Internal server error" });
    } else {
      response.end();
    }
  }

  private static errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

export class ChessMcpApplication {
  private readonly logger: ChessLogger;
  private sseServer?: ChessSseServer;

  public constructor(
    private readonly server: ChessComMcpServer = chessMcpServer,
    logger: ChessLogger = new ConsoleChessLogger(),
  ) {
    this.logger = logger;
  }

  public setupEnvironment(): boolean {
    try {
      loadDotenv();
      this.server.api.setBaseUrl(process.env.CHESS_API_BASE_URL ?? DEFAULT_BASE_URL);
      this.logger.info("Chess.com MCP Server starting");
      return true;
    } catch (error) {
      this.logger.error("Failed to setup environment", {
        error: ChessMcpApplication.errorMessage(error),
      });
      return false;
    }
  }

  public async run(transport: Transport = "stdio"): Promise<void> {
    if (!this.setupEnvironment()) {
      this.logger.error("Environment setup failed, exiting");
      process.exitCode = 1;
      return;
    }

    try {
      this.logger.info("Starting MCP server", { transport });
      if (transport === "stdio") {
        await this.server.connect(new StdioServerTransport());
      } else {
        this.sseServer = new ChessSseServer(this.server.server, this.logger);
        await this.sseServer.start();
      }
    } catch (error) {
      this.logger.error("Server error", { error: ChessMcpApplication.errorMessage(error) });
      process.exitCode = 1;
    }
  }

  public async shutdown(): Promise<void> {
    await this.sseServer?.close();
    this.sseServer = undefined;
    await this.server.close();
  }

  public registerSignalHandlers(): void {
    process.once("SIGINT", () => {
      void this.shutdown().finally(() => {
        this.logger.info("Server stopped by user");
      });
    });
  }

  private static errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

export const application = new ChessMcpApplication();

export function setupEnvironment(): boolean {
  return application.setupEnvironment();
}

export async function startSseServer(
  server: McpServer = mcp,
  port = Number.parseInt(process.env.PORT ?? "8000", 10),
  host = process.env.HOST ?? "0.0.0.0",
): Promise<HttpServer> {
  return new ChessSseServer(server).start(port, host);
}

export async function runServer(transport: Transport = "stdio"): Promise<void> {
  await application.run(transport);
}

export async function main(): Promise<void> {
  application.registerSignalHandlers();
  const transport: Transport = process.env.MCP_TRANSPORT === "sse" ? "sse" : "stdio";
  await application.run(transport);
}

const isMainModule = process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMainModule) {
  void main();
}