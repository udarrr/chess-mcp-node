# Chess.com MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) server written in TypeScript for Chess.com's public API. It exposes the complete documented Chess.com PubAPI through 30 tools and seven resources without authentication.

## Install from npm

Requirements: Node.js 20.9 or newer.

Run the latest published package directly:

```bash
npx -y chess-mcp-node@latest
```

The default transport is stdio. The package is distributed through npm and can also be installed from the VS Code MCP gallery after its registry metadata is published.

For VS Code, create or open `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "chess": {
      "command": "npx",
      "args": ["-y", "chess-mcp-node@latest"]
    }
  }
}
```

After publication, search for `@mcp chess` in VS Code and select **Install** to add the server from the MCP gallery.

For Claude Desktop, add the server to its MCP configuration:

```json
{
  "mcpServers": {
    "chess": {
      "command": "npx",
      "args": ["-y", "chess-mcp-node@latest"]
    }
  }
}
```

## Run from source

Requirements: Node.js 20.9 or newer.

```bash
npm ci
npm run build
npm start
```

The default source-run transport is stdio. To run the optional SSE transport:

```bash
# macOS/Linux
MCP_TRANSPORT=sse npm start
```

```powershell
# Windows PowerShell
$env:MCP_TRANSPORT = "sse"
npm start
```

The SSE server listens on port `8000` by default and provides `/sse`, `/messages`, and `/health`. Set `PORT` and `HOST` to override those defaults.

Set `CHESS_API_BASE_URL` to override the Chess.com API base URL for development or testing.

## Development

Run the test suite and type checker:

```bash
npm test
npm run typecheck
```

Create a coverage report with:

```bash
npm run test:coverage
```

## Available tools

- `get_player_profile`
- `get_titled_players`
- `get_player_stats`
- `is_player_online`
- `get_player_current_games`
- `get_player_games_to_move`
- `get_player_game_archives`
- `get_player_games_by_month`
- `get_player_live_games`
- `download_player_games_pgn`
- `get_player_clubs`
- `get_player_matches`
- `get_player_tournaments`
- `get_club_profile`
- `get_club_members`
- `get_club_matches`
- `get_tournament`
- `get_tournament_round`
- `get_tournament_round_group`
- `get_team_match`
- `get_team_match_board`
- `get_live_team_match`
- `get_live_team_match_board`
- `get_country_profile`
- `get_country_players`
- `get_country_clubs`
- `get_daily_puzzle`
- `get_random_puzzle`
- `get_streamers`
- `get_leaderboards`

## Available resources

- `chess://player/{username}`
- `chess://player/{username}/stats`
- `chess://player/{username}/games/current`
- `chess://player/{username}/games/{year}/{month}`
- `chess://player/{username}/games/{year}/{month}/pgn`
- `chess://titled/{title}`
- `chess://club/{url_id}`

## License

MIT