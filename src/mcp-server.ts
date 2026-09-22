import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod/v4";

import {
  apiClient,
  type ChessComApiClient,
  type JsonObject,
  VALID_TITLES,
} from "./api-client.js";

const pathNumberSchema = z.union([
  z.number().int().nonnegative(),
  z.string().regex(/^\d+$/u),
]);
const positivePathNumberSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/u),
]);
const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/u);

export class ChessComMcpServer {
  public readonly server: McpServer;

  public constructor(public readonly api: ChessComApiClient = apiClient) {
    this.server = new McpServer({
      name: "Chess.com API MCP",
      version: "0.1.0",
    });
    this.registerTools();
    this.registerResources();
  }

  public async connect(transport: Parameters<McpServer["connect"]>[0]): Promise<void> {
    await this.server.connect(transport);
  }

  public async close(): Promise<void> {
    await this.server.close();
  }

  private registerTools(): void {
    this.server.registerTool(
      "get_player_profile",
      {
        description: "Get a player's profile from Chess.com",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.getPlayerProfile(username)),
    );

    this.server.registerTool(
      "get_titled_players",
      {
        description: "Get a list of titled players from Chess.com",
        inputSchema: { title: z.enum(VALID_TITLES) },
      },
      async ({ title }) => this.toToolResult(await this.api.getTitledPlayers(title)),
    );

    this.server.registerTool(
      "get_player_stats",
      {
        description: "Get a player's stats from Chess.com",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.getPlayerStats(username)),
    );

    this.server.registerTool(
      "is_player_online",
      {
        description: "Check if a player is currently online on Chess.com",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.isPlayerOnline(username)),
    );

    this.server.registerTool(
      "get_player_current_games",
      {
        description: "Get a player's ongoing games on Chess.com",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.getPlayerCurrentGames(username)),
    );

    this.server.registerTool(
      "get_player_games_to_move",
      {
        description: "Get a player's daily games where they must act",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.getPlayerGamesToMove(username)),
    );

    this.server.registerTool(
      "get_player_game_archives",
      {
        description: "Get a list of available monthly game archives for a player on Chess.com",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.getPlayerGameArchives(username)),
    );

    this.server.registerTool(
      "get_player_games_by_month",
      {
        description: "Get a player's games for a specific month from Chess.com",
        inputSchema: {
          username: z.string(),
          year: z.number().int(),
          month: z.number().int(),
        },
      },
      async ({ username, year, month }) =>
        this.toToolResult(await this.api.getPlayerGamesByMonth(username, year, month)),
    );

    this.server.registerTool(
      "get_player_live_games",
      {
        description: "Get a player's live games for a time control from Chess.com",
        inputSchema: {
          username: z.string(),
          base_time: pathNumberSchema,
          increment: pathNumberSchema,
        },
      },
      async ({ username, base_time: baseTime, increment }) =>
        this.toToolResult(await this.api.getPlayerLiveGames(username, baseTime, increment)),
    );

    this.server.registerTool(
      "download_player_games_pgn",
      {
        description: "Download PGN files for all games in a specific month from Chess.com",
        inputSchema: {
          username: z.string(),
          year: z.number().int(),
          month: z.number().int(),
        },
      },
      async ({ username, year, month }) =>
        this.toToolResult(await this.api.downloadPlayerGamesPgn(username, year, month)),
    );

    this.server.registerTool(
      "get_player_clubs",
      {
        description: "Get the clubs a player belongs to on Chess.com",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.getPlayerClubs(username)),
    );

    this.server.registerTool(
      "get_player_matches",
      {
        description: "Get team matches involving a player on Chess.com",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.getPlayerMatches(username)),
    );

    this.server.registerTool(
      "get_player_tournaments",
      {
        description: "Get tournaments involving a player on Chess.com",
        inputSchema: { username: z.string() },
      },
      async ({ username }) => this.toToolResult(await this.api.getPlayerTournaments(username)),
    );

    this.server.registerTool(
      "get_club_profile",
      {
        description: "Get information about a club on Chess.com",
        inputSchema: { url_id: z.string() },
      },
      async ({ url_id: urlId }) => this.toToolResult(await this.api.getClubProfile(urlId)),
    );

    this.server.registerTool(
      "get_club_members",
      {
        description: "Get members of a club on Chess.com",
        inputSchema: { url_id: z.string() },
      },
      async ({ url_id: urlId }) => this.toToolResult(await this.api.getClubMembers(urlId)),
    );

    this.server.registerTool(
      "get_club_matches",
      {
        description: "Get team matches for a club on Chess.com",
        inputSchema: { url_id: z.string() },
      },
      async ({ url_id: urlId }) => this.toToolResult(await this.api.getClubMatches(urlId)),
    );

    this.server.registerTool(
      "get_tournament",
      {
        description: "Get information about a tournament on Chess.com",
        inputSchema: { url_id: z.string() },
      },
      async ({ url_id: urlId }) => this.toToolResult(await this.api.getTournament(urlId)),
    );

    this.server.registerTool(
      "get_tournament_round",
      {
        description: "Get a tournament round on Chess.com",
        inputSchema: { url_id: z.string(), round: positivePathNumberSchema },
      },
      async ({ url_id: urlId, round }) =>
        this.toToolResult(await this.api.getTournamentRound(urlId, round)),
    );

    this.server.registerTool(
      "get_tournament_round_group",
      {
        description: "Get a tournament round group on Chess.com",
        inputSchema: {
          url_id: z.string(),
          round: positivePathNumberSchema,
          group: positivePathNumberSchema,
        },
      },
      async ({ url_id: urlId, round, group }) =>
        this.toToolResult(await this.api.getTournamentRoundGroup(urlId, round, group)),
    );

    this.server.registerTool(
      "get_team_match",
      {
        description: "Get a daily team match on Chess.com",
        inputSchema: { match_id: positivePathNumberSchema },
      },
      async ({ match_id: matchId }) => this.toToolResult(await this.api.getTeamMatch(matchId)),
    );

    this.server.registerTool(
      "get_team_match_board",
      {
        description: "Get a board from a daily team match on Chess.com",
        inputSchema: {
          match_id: positivePathNumberSchema,
          board: positivePathNumberSchema,
        },
      },
      async ({ match_id: matchId, board }) =>
        this.toToolResult(await this.api.getTeamMatchBoard(matchId, board)),
    );

    this.server.registerTool(
      "get_live_team_match",
      {
        description: "Get a live team match on Chess.com",
        inputSchema: { match_id: positivePathNumberSchema },
      },
      async ({ match_id: matchId }) =>
        this.toToolResult(await this.api.getLiveTeamMatch(matchId)),
    );

    this.server.registerTool(
      "get_live_team_match_board",
      {
        description: "Get a board from a live team match on Chess.com",
        inputSchema: {
          match_id: positivePathNumberSchema,
          board: positivePathNumberSchema,
        },
      },
      async ({ match_id: matchId, board }) =>
        this.toToolResult(await this.api.getLiveTeamMatchBoard(matchId, board)),
    );

    this.server.registerTool(
      "get_country_profile",
      {
        description: "Get a country profile on Chess.com",
        inputSchema: { country: countryCodeSchema },
      },
      async ({ country }) => this.toToolResult(await this.api.getCountry(country)),
    );

    this.server.registerTool(
      "get_country_players",
      {
        description: "Get recently active players associated with a country on Chess.com",
        inputSchema: { country: countryCodeSchema },
      },
      async ({ country }) => this.toToolResult(await this.api.getCountryPlayers(country)),
    );

    this.server.registerTool(
      "get_country_clubs",
      {
        description: "Get clubs associated with a country on Chess.com",
        inputSchema: { country: countryCodeSchema },
      },
      async ({ country }) => this.toToolResult(await this.api.getCountryClubs(country)),
    );

    this.server.registerTool(
      "get_daily_puzzle",
      { description: "Get the current daily puzzle from Chess.com" },
      async () => this.toToolResult(await this.api.getDailyPuzzle()),
    );

    this.server.registerTool(
      "get_random_puzzle",
      { description: "Get a random daily puzzle from Chess.com" },
      async () => this.toToolResult(await this.api.getRandomPuzzle()),
    );

    this.server.registerTool(
      "get_streamers",
      { description: "Get the current Chess.com streamer list" },
      async () => this.toToolResult(await this.api.getStreamers()),
    );

    this.server.registerTool(
      "get_leaderboards",
      { description: "Get Chess.com leaderboards" },
      async () => this.toToolResult(await this.api.getLeaderboards()),
    );
  }

  private registerResources(): void {
    this.server.registerResource(
      "player_profile",
      new ResourceTemplate("chess://player/{username}", { list: undefined }),
      { description: "Player profile data from Chess.com", mimeType: "application/json" },
      async (uri, variables) =>
        this.resourceResult(uri, await this.readPlayerProfile(this.requiredVariable(variables, "username"))),
    );

    this.server.registerResource(
      "player_stats",
      new ResourceTemplate("chess://player/{username}/stats", { list: undefined }),
      { description: "Player statistics from Chess.com", mimeType: "application/json" },
      async (uri, variables) =>
        this.resourceResult(uri, await this.readPlayerStats(this.requiredVariable(variables, "username"))),
    );

    this.server.registerResource(
      "player_current_games",
      new ResourceTemplate("chess://player/{username}/games/current", { list: undefined }),
      { description: "Current player games from Chess.com", mimeType: "application/json" },
      async (uri, variables) =>
        this.resourceResult(
          uri,
          await this.readPlayerCurrentGames(this.requiredVariable(variables, "username")),
        ),
    );

    this.server.registerResource(
      "player_games_by_month",
      new ResourceTemplate("chess://player/{username}/games/{year}/{month}", { list: undefined }),
      { description: "Player games for a specific month", mimeType: "application/json" },
      async (uri, variables) =>
        this.resourceResult(
          uri,
          await this.readPlayerGamesByMonth(
            this.requiredVariable(variables, "username"),
            this.requiredVariable(variables, "year"),
            this.requiredVariable(variables, "month"),
          ),
        ),
    );

    this.server.registerResource(
      "titled_players",
      new ResourceTemplate("chess://titled/{title}", { list: undefined }),
      { description: "Titled players from Chess.com", mimeType: "application/json" },
      async (uri, variables) =>
        this.resourceResult(uri, await this.readTitledPlayers(this.requiredVariable(variables, "title"))),
    );

    this.server.registerResource(
      "club_profile",
      new ResourceTemplate("chess://club/{url_id}", { list: undefined }),
      { description: "Club profile data from Chess.com", mimeType: "application/json" },
      async (uri, variables) =>
        this.resourceResult(uri, await this.readClubProfile(this.requiredVariable(variables, "url_id"))),
    );

    this.server.registerResource(
      "player_games_pgn",
      new ResourceTemplate("chess://player/{username}/games/{year}/{month}/pgn", {
        list: undefined,
      }),
      { description: "Player games in PGN format", mimeType: "application/x-chess-pgn" },
      async (uri, variables) =>
        this.resourceResult(
          uri,
          await this.readPlayerGamesPgn(
            this.requiredVariable(variables, "username"),
            this.requiredVariable(variables, "year"),
            this.requiredVariable(variables, "month"),
          ),
          "application/x-chess-pgn",
        ),
    );
  }

  private async readPlayerProfile(username: string): Promise<string> {
    return this.readJsonResource(
      "retrieving player profile",
      { username },
      () => this.api.getPlayerProfile(username),
    );
  }

  private async readPlayerStats(username: string): Promise<string> {
    return this.readJsonResource(
      "retrieving player stats",
      { username },
      () => this.api.getPlayerStats(username),
    );
  }

  private async readPlayerCurrentGames(username: string): Promise<string> {
    return this.readJsonResource(
      "retrieving current games",
      { username },
      () => this.api.getPlayerCurrentGames(username),
    );
  }

  private async readPlayerGamesByMonth(
    username: string,
    year: string,
    month: string,
  ): Promise<string> {
    return this.readJsonResource(
      "retrieving games by month",
      { username, year, month },
      () => this.api.getPlayerGamesByMonth(username, Number(year), Number(month)),
    );
  }

  private async readTitledPlayers(title: string): Promise<string> {
    return this.readJsonResource(
      "retrieving titled players",
      { title },
      () => this.api.getTitledPlayers(title),
    );
  }

  private async readClubProfile(urlId: string): Promise<string> {
    return this.readJsonResource(
      "retrieving club profile",
      { urlId },
      () => this.api.getClubProfile(urlId),
    );
  }

  private async readPlayerGamesPgn(
    username: string,
    year: string,
    month: string,
  ): Promise<string> {
    try {
      return await this.api.downloadPlayerGamesPgn(username, Number(year), Number(month));
    } catch (error) {
      return `Error downloading PGN data: ${ChessComMcpServer.errorMessage(error)}`;
    }
  }

  private async readJsonResource(
    label: string,
    context: JsonObject,
    request: () => Promise<JsonObject>,
  ): Promise<string> {
    try {
      return JSON.stringify(await request(), null, 2);
    } catch (error) {
      const message = `Error ${label}: ${ChessComMcpServer.errorMessage(error)}`;
      console.error(JSON.stringify({ level: "error", message, ...context }));
      return message;
    }
  }

  private toToolResult(data: JsonObject | string): CallToolResult {
    const result: CallToolResult = {
      content: [
        {
          type: "text",
          text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
        },
      ],
    };

    if (typeof data !== "string") {
      result.structuredContent = data;
    }

    return result;
  }

  private resourceResult(uri: URL, text: string, mimeType = "application/json"): ReadResourceResult {
    return {
      contents: [{ uri: uri.href, mimeType, text }],
    };
  }

  private requiredVariable(variables: Record<string, unknown>, name: string): string {
    const value = variables[name];
    if (typeof value !== "string") {
      throw new Error(`Missing resource variable '${name}'.`);
    }

    return value;
  }

  private static errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

export const chessMcpServer = new ChessComMcpServer();
export const mcp = chessMcpServer.server;