export const DEFAULT_BASE_URL = "https://api.chess.com/pub";
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export const VALID_TITLES = [
  "GM",
  "WGM",
  "IM",
  "WIM",
  "FM",
  "WFM",
  "NM",
  "WNM",
  "CM",
  "WCM",
] as const;

export type ChessTitle = (typeof VALID_TITLES)[number];
export type JsonObject = Record<string, unknown>;
export type RequestParams = Record<string, boolean | number | string | undefined>;
export type PathNumber = number | string;
export type LogLevel = "debug" | "error" | "info";

export interface ChessConfig {
  baseUrl: string;
  requestTimeoutMs: number;
}

export interface ChessLogger {
  debug(message: string, context?: JsonObject): void;
  error(message: string, context?: JsonObject): void;
  info(message: string, context?: JsonObject): void;
}

export class ConsoleChessLogger implements ChessLogger {
  public debug(message: string, context: JsonObject = {}): void {
    this.write("debug", message, context);
  }

  public error(message: string, context: JsonObject = {}): void {
    this.write("error", message, context);
  }

  public info(message: string, context: JsonObject = {}): void {
    this.write("info", message, context);
  }

  private write(level: LogLevel, message: string, context: JsonObject): void {
    console.error(JSON.stringify({ level, message, ...context }));
  }
}

export class ChessApiValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ChessApiValidationError";
  }
}

export interface ChessComApiClientOptions {
  baseUrl?: string;
  requestTimeoutMs?: number;
  logger?: ChessLogger;
}

export class ChessComApiClient {
  public readonly config: ChessConfig;

  private readonly logger: ChessLogger;

  public constructor(options: ChessComApiClientOptions = {}) {
    this.config = {
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
    };
    this.logger = options.logger ?? new ConsoleChessLogger();
  }

  public setBaseUrl(baseUrl: string): void {
    this.config.baseUrl = baseUrl;
  }

  public async request(
    endpoint: string,
    params?: RequestParams,
    acceptJson?: true,
  ): Promise<JsonObject>;
  public async request(
    endpoint: string,
    params: RequestParams | undefined,
    acceptJson: false,
  ): Promise<string>;
  public async request(
    endpoint: string,
    params: RequestParams = {},
    acceptJson = true,
  ): Promise<JsonObject | string> {
    const baseUrl = this.config.baseUrl.replace(/\/+$/u, "");
    const cleanEndpoint = endpoint.replace(/^\/+/, "");
    const url = new URL(`${baseUrl}/${cleanEndpoint}`);
    const headers = {
      accept: acceptJson ? "application/json" : "application/x-chess-pgn",
    };

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    this.logger.debug("Making API request", {
      endpoint,
      url: url.href,
      acceptJson,
      hasParams: Object.keys(params).length > 0,
    });

    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Chess.com API request failed with status ${response.status}.`);
      }

      if (acceptJson) {
        const result = (await response.json()) as JsonObject;
        this.logger.debug("API request successful", { endpoint, responseType: "json" });
        return result;
      }

      const result = await response.text();
      this.logger.debug("API request successful", { endpoint, responseType: "text" });
      return result;
    } catch (error) {
      this.logger.error("API request failed", {
        endpoint,
        url: url.href,
        error: ChessComApiClient.errorMessage(error),
      });
      throw error;
    }
  }

  public async getPlayerProfile(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Fetching player profile", { username });
    return this.request(`player/${username}`);
  }

  public async getTitledPlayers(title: string): Promise<JsonObject> {
    this.validateTitle(title);
    this.logger.info("Fetching titled players", { title });
    return this.request(`titled/${title}`);
  }

  public async getPlayerStats(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Fetching player stats", { username });
    return this.request(`player/${username}/stats`);
  }

  public async isPlayerOnline(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Checking player online status", { username });
    return this.request(`player/${username}/is-online`);
  }

  public async getPlayerCurrentGames(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Fetching player current games", { username });
    return this.request(`player/${username}/games`);
  }

  public async getPlayerGamesToMove(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Fetching player games to move", { username });
    return this.request(`player/${username}/games/to-move`);
  }

  public async getPlayerGameArchives(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Fetching player game archives", { username });
    return this.request(`player/${username}/games/archives`);
  }

  public async getPlayerGamesByMonth(
    username: string,
    year: number,
    month: number,
  ): Promise<JsonObject> {
    this.validateUsername(username);
    this.validateYearMonth(year, month);
    const monthString = this.formatMonth(month);
    this.logger.info("Fetching player games by month", {
      username,
      year,
      month: monthString,
    });
    return this.request(`player/${username}/games/${year}/${monthString}`);
  }

  public async getPlayerLiveGames(
    username: string,
    baseTime: PathNumber,
    increment: PathNumber,
  ): Promise<JsonObject> {
    this.validateUsername(username);
    const baseTimePath = this.validatePathNumber(baseTime, "base-time", 0);
    const incrementPath = this.validatePathNumber(increment, "increment", 0);
    this.logger.info("Fetching player live games", { username, baseTime, increment });
    return this.request(`player/${username}/games/live/${baseTimePath}/${incrementPath}`);
  }

  public async downloadPlayerGamesPgn(
    username: string,
    year: number,
    month: number,
  ): Promise<string> {
    this.validateUsername(username);
    this.validateYearMonth(year, month);
    const monthString = this.formatMonth(month);
    this.logger.info("Downloading player games PGN", {
      username,
      year,
      month: monthString,
    });
    return this.request(
      `player/${username}/games/${year}/${monthString}/pgn`,
      undefined,
      false,
    );
  }

  public async getPlayerClubs(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Fetching player clubs", { username });
    return this.request(`player/${username}/clubs`);
  }

  public async getPlayerMatches(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Fetching player matches", { username });
    return this.request(`player/${username}/matches`);
  }

  public async getPlayerTournaments(username: string): Promise<JsonObject> {
    this.validateUsername(username);
    this.logger.info("Fetching player tournaments", { username });
    return this.request(`player/${username}/tournaments`);
  }

  public async getClubProfile(urlId: string): Promise<JsonObject> {
    this.validateUrlId(urlId);
    this.logger.info("Fetching club profile", { urlId });
    return this.request(`club/${urlId}`);
  }

  public async getClubMembers(urlId: string): Promise<JsonObject> {
    this.validateUrlId(urlId);
    this.logger.info("Fetching club members", { urlId });
    return this.request(`club/${urlId}/members`);
  }

  public async getClubMatches(urlId: string): Promise<JsonObject> {
    this.validateUrlId(urlId);
    this.logger.info("Fetching club matches", { urlId });
    return this.request(`club/${urlId}/matches`);
  }

  public async getTournament(urlId: string): Promise<JsonObject> {
    this.validateUrlId(urlId);
    this.logger.info("Fetching tournament", { urlId });
    return this.request(`tournament/${urlId}`);
  }

  public async getTournamentRound(urlId: string, round: PathNumber): Promise<JsonObject> {
    this.validateUrlId(urlId);
    const roundPath = this.validatePathNumber(round, "round");
    this.logger.info("Fetching tournament round", { urlId, round });
    return this.request(`tournament/${urlId}/${roundPath}`);
  }

  public async getTournamentRoundGroup(
    urlId: string,
    round: PathNumber,
    group: PathNumber,
  ): Promise<JsonObject> {
    this.validateUrlId(urlId);
    const roundPath = this.validatePathNumber(round, "round");
    const groupPath = this.validatePathNumber(group, "group");
    this.logger.info("Fetching tournament round group", { urlId, round, group });
    return this.request(`tournament/${urlId}/${roundPath}/${groupPath}`);
  }

  public async getTeamMatch(matchId: PathNumber): Promise<JsonObject> {
    const matchPath = this.validatePathNumber(matchId, "match id");
    this.logger.info("Fetching team match", { matchId });
    return this.request(`match/${matchPath}`);
  }

  public async getTeamMatchBoard(matchId: PathNumber, board: PathNumber): Promise<JsonObject> {
    const matchPath = this.validatePathNumber(matchId, "match id");
    const boardPath = this.validatePathNumber(board, "board");
    this.logger.info("Fetching team match board", { matchId, board });
    return this.request(`match/${matchPath}/${boardPath}`);
  }

  public async getLiveTeamMatch(matchId: PathNumber): Promise<JsonObject> {
    const matchPath = this.validatePathNumber(matchId, "match id");
    this.logger.info("Fetching live team match", { matchId });
    return this.request(`match/live/${matchPath}`);
  }

  public async getLiveTeamMatchBoard(matchId: PathNumber, board: PathNumber): Promise<JsonObject> {
    const matchPath = this.validatePathNumber(matchId, "match id");
    const boardPath = this.validatePathNumber(board, "board");
    this.logger.info("Fetching live team match board", { matchId, board });
    return this.request(`match/live/${matchPath}/${boardPath}`);
  }

  public async getCountry(countryCode: string): Promise<JsonObject> {
    this.validateCountryCode(countryCode);
    this.logger.info("Fetching country profile", { countryCode });
    return this.request(`country/${countryCode}`);
  }

  public async getCountryPlayers(countryCode: string): Promise<JsonObject> {
    this.validateCountryCode(countryCode);
    this.logger.info("Fetching country players", { countryCode });
    return this.request(`country/${countryCode}/players`);
  }

  public async getCountryClubs(countryCode: string): Promise<JsonObject> {
    this.validateCountryCode(countryCode);
    this.logger.info("Fetching country clubs", { countryCode });
    return this.request(`country/${countryCode}/clubs`);
  }

  public async getDailyPuzzle(): Promise<JsonObject> {
    this.logger.info("Fetching daily puzzle");
    return this.request("puzzle");
  }

  public async getRandomPuzzle(): Promise<JsonObject> {
    this.logger.info("Fetching random puzzle");
    return this.request("puzzle/random");
  }

  public async getStreamers(): Promise<JsonObject> {
    this.logger.info("Fetching streamers");
    return this.request("streamers");
  }

  public async getLeaderboards(): Promise<JsonObject> {
    this.logger.info("Fetching leaderboards");
    return this.request("leaderboards");
  }

  private validateUsername(username: string): void {
    if (!/^[a-zA-Z0-9_-]{1,50}$/u.test(username)) {
      throw new ChessApiValidationError(
        `Invalid username '${username}'. Must contain only letters, digits, hyphens or underscores (1-50 chars).`,
      );
    }
  }

  private validateUrlId(urlId: string): void {
    if (!/^[a-zA-Z0-9_-]{1,80}$/u.test(urlId)) {
      throw new ChessApiValidationError(
        `Invalid club or tournament url_id '${urlId}'. Must contain only letters, digits, hyphens or underscores (1-80 chars).`,
      );
    }
  }

  private validateTitle(title: string): asserts title is ChessTitle {
    if (!VALID_TITLES.includes(title as ChessTitle)) {
      throw new ChessApiValidationError(
        `Invalid title. Must be one of: ${VALID_TITLES.join(", ")}`,
      );
    }
  }

  private validateYearMonth(year: number, month: number): void {
    if (!Number.isInteger(year) || year < 1990 || year > 2100) {
      throw new ChessApiValidationError(`Invalid year '${year}'. Must be between 1990 and 2100.`);
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new ChessApiValidationError(`Invalid month '${month}'. Must be between 1 and 12.`);
    }
  }

  private validatePathNumber(value: PathNumber, name: string, minimum = 1): string {
    const text = String(value);
    const numericValue = Number(text);

    if (!/^\d+$/u.test(text) || !Number.isSafeInteger(numericValue) || numericValue < minimum) {
      throw new ChessApiValidationError(
        `Invalid ${name} '${value}'. Must be an integer greater than or equal to ${minimum}.`,
      );
    }

    return text;
  }

  private validateCountryCode(countryCode: string): void {
    if (!/^[A-Z]{2}$/u.test(countryCode)) {
      throw new ChessApiValidationError(
        `Invalid country code '${countryCode}'. Must be two uppercase letters.`,
      );
    }
  }

  private formatMonth(month: number): string {
    return month.toString().padStart(2, "0");
  }

  private static errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

export const apiClient = new ChessComApiClient();
export const config = apiClient.config;