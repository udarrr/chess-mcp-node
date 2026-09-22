# Chess.com MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) server written in TypeScript for Chess.com's public API. It exposes the complete documented Chess.com PubAPI through 30 tools and seven resources without authentication.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run build
npm start
```

For a Claude Desktop configuration, point the command at the compiled entry point:

```json
{
  "mcpServers": {
    "chess": {
      "command": "node",
      "args": ["C:/path/to/chess-mcp-node/dist/main.js"]
    }
  }
}
```

The SSE server listens on port `8000` by default and provides `/sse`, `/messages`, and `/health`. Configure it with `MCP_TRANSPORT=sse`, `PORT`, and `HOST`.

Set `CHESS_API_BASE_URL` to override the Chess.com API base URL for development or testing.

## Run with npx

After the package is published to npm, run the server without cloning the repository:

```bash
npx -y chess-mcp-node@0.1.0
```

For a VS Code MCP configuration in `.vscode/mcp.json`:

```json
{
  "servers": {
    "chess": {
      "command": "npx",
      "args": ["-y", "chess-mcp-node@0.1.0"]
    }
  }
}
```

To run a tagged GitHub checkout directly instead of the npm registry:

```bash
npx -y github:udarrr/chess-mcp-node#v0.1.0
```

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