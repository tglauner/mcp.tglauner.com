import express from "express";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Server,
} from "@modelcontextprotocol/sdk/server/index.js";
import { SseServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const PORT = process.env.PORT || 3000;
const MCP_PATH = "/mcp";

const server = new Server(
  {
    name: "mcp.tglauner.com",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "owner",
        description: "Returns the owner of the MCP server.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "hometown",
        description: "Returns the hometown of the owner.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "owner":
      return {
        content: [{ type: "text", text: "Tim Glauner" }],
      };
    case "hometown":
      return {
        content: [{ type: "text", text: "New York" }],
      };
    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${request.params.name}`,
          },
        ],
        isError: true,
      };
  }
});

const app = express();
app.use(express.json({ limit: "1mb" }));

const transports = new Map();

app.get(MCP_PATH, async (req, res) => {
  const transport = new SseServerTransport(MCP_PATH, res);
  transports.set(transport.sessionId, transport);

  res.on("close", () => {
    transports.delete(transport.sessionId);
  });

  await server.connect(transport);
});

app.post(MCP_PATH, async (req, res) => {
  const sessionId = req.query.sessionId;
  if (typeof sessionId !== "string") {
    res.status(400).json({ error: "Missing sessionId query parameter." });
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  await transport.handlePostMessage(req, res);
});

app.delete(MCP_PATH, (req, res) => {
  const sessionId = req.query.sessionId;
  if (typeof sessionId === "string") {
    const transport = transports.get(sessionId);
    if (transport) {
      transport.close();
      transports.delete(sessionId);
    }
  }

  res.status(204).end();
});

app.get("/", (req, res) => {
  res.json({
    name: "mcp.tglauner.com",
    mcpEndpoint: MCP_PATH,
    tools: ["owner", "hometown"],
  });
});

app.listen(PORT, () => {
  console.log(`MCP server listening on http://localhost:${PORT}${MCP_PATH}`);
});
