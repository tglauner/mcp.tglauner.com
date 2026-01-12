import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = process.env.PORT || 3000;
const MCP_PATH = "/mcp";

const PROFILE = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Tim Glauner",
  url: "https://tglauner.com",
};

const PROFILE_RESOURCE = {
  name: "profile",
  title: "Profile",
  uri: "profile.json",
  description: "Public profile for Tim Glauner.",
  mimeType: "application/json",
};

const PROFILE_SUMMARY = `${PROFILE.name} — ${PROFILE.url}`;

const server = new Server(
  {
    name: "mcp.tglauner.com",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [PROFILE_RESOURCE],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === PROFILE_RESOURCE.uri) {
    return {
      contents: [
        {
          uri: PROFILE_RESOURCE.uri,
          mimeType: PROFILE_RESOURCE.mimeType,
          text: JSON.stringify(PROFILE, null, 2),
        },
      ],
    };
  }

  throw new McpError(
    ErrorCode.InvalidParams,
    `Unknown resource: ${request.params.uri}`
  );
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "profile",
        description: "Returns the public profile for Tim Glauner.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        outputSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            profile: { type: "object" },
          },
          required: ["summary", "profile"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "profile":
      return {
        content: [{ type: "text", text: PROFILE_SUMMARY }],
        structuredContent: {
          summary: PROFILE_SUMMARY,
          profile: PROFILE,
        },
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
const jsonParser = express.json({ limit: "1mb" });
app.use((req, res, next) => {
  if (req.path === MCP_PATH) {
    return next();
  }
  return jsonParser(req, res, next);
});

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

await server.connect(transport);

app.all(MCP_PATH, async (req, res) => {
  await transport.handleRequest(req, res);
});

app.get("/", (req, res) => {
  res.json({
    name: "mcp.tglauner.com",
    mcpEndpoint: MCP_PATH,
    tools: ["profile"],
    resources: [PROFILE_RESOURCE.uri],
  });
});

app.listen(PORT, () => {
  console.log(`MCP server listening on http://localhost:${PORT}${MCP_PATH}`);
});
