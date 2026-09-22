import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChessApiValidationError,
  ChessComApiClient,
  type ChessLogger,
  type JsonObject,
} from "../src/api-client.js";
import { ChessComMcpServer } from "../src/mcp-server.js";

const fetchMock = vi.fn<typeof fetch>();

const silentLogger: ChessLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

interface EndpointCase {
  name: string;
  endpoint: string;
  request: (client: ChessComApiClient) => Promise<JsonObject>;
}

const endpointCases: EndpointCase[] = [
  {
    name: "player profile",
    endpoint: "player/testuser",
    request: (client) => client.getPlayerProfile("testuser"),
  },
  {
    name: "titled players",
    endpoint: "titled/GM",
    request: (client) => client.getTitledPlayers("GM"),
  },
  {
    name: "player stats",
    endpoint: "player/testuser/stats",
    request: (client) => client.getPlayerStats("testuser"),
  },
  {
    name: "player online status",
    endpoint: "player/testuser/is-online",
    request: (client) => client.isPlayerOnline("testuser"),
  },
  {
    name: "current player games",
    endpoint: "player/testuser/games",
    request: (client) => client.getPlayerCurrentGames("testuser"),
  },
  {
    name: "player games to move",
    endpoint: "player/testuser/games/to-move",
    request: (client) => client.getPlayerGamesToMove("testuser"),
  },
  {
    name: "player game archives",
    endpoint: "player/testuser/games/archives",
    request: (client) => client.getPlayerGameArchives("testuser"),
  },
  {
    name: "monthly player games",
    endpoint: "player/testuser/games/2023/02",
    request: (client) => client.getPlayerGamesByMonth("testuser", 2023, 2),
  },
  {
    name: "live player games",
    endpoint: "player/testuser/games/live/180/2",
    request: (client) => client.getPlayerLiveGames("testuser", 180, 2),
  },
  {
    name: "player clubs",
    endpoint: "player/testuser/clubs",
    request: (client) => client.getPlayerClubs("testuser"),
  },
  {
    name: "player matches",
    endpoint: "player/testuser/matches",
    request: (client) => client.getPlayerMatches("testuser"),
  },
  {
    name: "player tournaments",
    endpoint: "player/testuser/tournaments",
    request: (client) => client.getPlayerTournaments("testuser"),
  },
  {
    name: "club profile",
    endpoint: "club/test-club",
    request: (client) => client.getClubProfile("test-club"),
  },
  {
    name: "club members",
    endpoint: "club/test-club/members",
    request: (client) => client.getClubMembers("test-club"),
  },
  {
    name: "club matches",
    endpoint: "club/test-club/matches",
    request: (client) => client.getClubMatches("test-club"),
  },
  {
    name: "tournament profile",
    endpoint: "tournament/test-tournament",
    request: (client) => client.getTournament("test-tournament"),
  },
  {
    name: "tournament round",
    endpoint: "tournament/test-tournament/1",
    request: (client) => client.getTournamentRound("test-tournament", 1),
  },
  {
    name: "tournament round group",
    endpoint: "tournament/test-tournament/1/2",
    request: (client) => client.getTournamentRoundGroup("test-tournament", 1, 2),
  },
  {
    name: "team match",
    endpoint: "match/123",
    request: (client) => client.getTeamMatch(123),
  },
  {
    name: "team match board",
    endpoint: "match/123/4",
    request: (client) => client.getTeamMatchBoard(123, 4),
  },
  {
    name: "live team match",
    endpoint: "match/live/123",
    request: (client) => client.getLiveTeamMatch(123),
  },
  {
    name: "live team match board",
    endpoint: "match/live/123/4",
    request: (client) => client.getLiveTeamMatchBoard(123, 4),
  },
  {
    name: "country profile",
    endpoint: "country/US",
    request: (client) => client.getCountry("US"),
  },
  {
    name: "country players",
    endpoint: "country/US/players",
    request: (client) => client.getCountryPlayers("US"),
  },
  {
    name: "country clubs",
    endpoint: "country/US/clubs",
    request: (client) => client.getCountryClubs("US"),
  },
  {
    name: "daily puzzle",
    endpoint: "puzzle",
    request: (client) => client.getDailyPuzzle(),
  },
  {
    name: "random puzzle",
    endpoint: "puzzle/random",
    request: (client) => client.getRandomPuzzle(),
  },
  {
    name: "streamers",
    endpoint: "streamers",
    request: (client) => client.getStreamers(),
  },
  {
    name: "leaderboards",
    endpoint: "leaderboards",
    request: (client) => client.getLeaderboards(),
  },
];

function createClient(): ChessComApiClient {
  return new ChessComApiClient({ logger: silentLogger });
}

describe("ChessComApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("makes JSON requests with query parameters", async () => {
    const client = createClient();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: "test_data" }), { status: 200 }),
    );

    await expect(
      client.request("endpoint/test", { param1: "value1", param2: 2 }),
    ).resolves.toEqual({ data: "test_data" });

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(String(requestUrl)).toBe(
      "https://api.chess.com/pub/endpoint/test?param1=value1&param2=2",
    );
    expect(requestInit?.headers).toEqual({ accept: "application/json" });
  });

  it("returns PGN text with the PGN accept header", async () => {
    const client = createClient();
    const pgn = '[Event "Live Chess"]\n[Site "Chess.com"]\n';
    fetchMock.mockImplementation(() => Promise.resolve(new Response(pgn, { status: 200 })));

    await expect(client.request("endpoint/test", undefined, false)).resolves.toBe(pgn);
    await expect(client.downloadPlayerGamesPgn("testuser", 2023, 2)).resolves.toBe(pgn);

    const [, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestInit?.headers).toEqual({ accept: "application/x-chess-pgn" });
  });

  it("raises an error for unsuccessful API responses", async () => {
    const client = createClient();
    fetchMock.mockResolvedValue(new Response("not found", { status: 404 }));

    await expect(client.request("endpoint/test")).rejects.toThrow(
      "Chess.com API request failed with status 404.",
    );
  });

  it.each(endpointCases)("routes $name to the expected endpoint", async ({ endpoint, request }) => {
    const client = createClient();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await expect(request(client)).resolves.toEqual({ ok: true });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(`https://api.chess.com/pub/${endpoint}`);
  });

  it("validates API path arguments", async () => {
    const client = createClient();

    await expect(client.getPlayerProfile("not valid")).rejects.toBeInstanceOf(ChessApiValidationError);
    await expect(client.getPlayerGamesByMonth("testuser", 1989, 1)).rejects.toThrow("Invalid year");
    await expect(client.getPlayerGamesByMonth("testuser", 2023, 13)).rejects.toThrow("Invalid month");
    await expect(client.getTitledPlayers("INVALID")).rejects.toThrow("Invalid title");
    await expect(client.getCountry("usa")).rejects.toThrow("Invalid country code");
    await expect(client.getTeamMatch(0)).rejects.toThrow("Invalid match id");
  });

  it("supports a custom base URL and timeout", async () => {
    const client = new ChessComApiClient({
      baseUrl: "https://example.test/api/",
      requestTimeoutMs: 1_000,
      logger: silentLogger,
    });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await client.getDailyPuzzle();

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://example.test/api/puzzle");
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeDefined();
    expect(client.config.requestTimeoutMs).toBe(1_000);
  });
});

describe("ChessComMcpServer", () => {
  it("creates an MCP server with the complete class-based API surface", () => {
    const client = createClient();
    const mcpServer = new ChessComMcpServer(client);

    expect(mcpServer.server).toBeDefined();
    expect(mcpServer.api).toBe(client);
  });
});