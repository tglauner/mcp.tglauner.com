# mcp.tglauner.com

A public Model Context Protocol (MCP) server that exposes two tools:

- `owner` → returns **Tim Glauner**
- `hometown` → returns **New York**

The MCP endpoint is available at:

```
https://mcp.tglauner.com/mcp
```

## Running locally

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
npm start
```

The server will listen on:

```
http://localhost:3000/mcp
```

You can also hit the root endpoint to confirm the server is running:

```
http://localhost:3000/
```

## Connecting with MCP tools

### MCP Inspector

The MCP Inspector is a quick way to test the server:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

### Example tool calls

Once connected, invoke:

- `owner` → `Tim Glauner`
- `hometown` → `New York`

## Deployment notes

- Ensure the service is reachable at `mcp.tglauner.com/mcp`.
- The server expects MCP clients to open an SSE connection at `/mcp` and send POST
  messages to the same path using the `sessionId` query parameter provided by the
  SSE handshake.
