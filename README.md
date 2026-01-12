# mcp.tglauner.com

A public Model Context Protocol (MCP) server that exposes a profile tool and
resource for Tim Glauner.

MCP endpoint (Streamable HTTP):

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
npx -y @modelcontextprotocol/inspector http://localhost:3000/mcp
```

### Resources

Once connected, list resources and read:

- `profile.json` → Schema.org Person profile

### Tools

Once connected, invoke:

- `profile` → returns a summary + structured profile JSON

## Deployment notes

- Ensure the service is reachable at `mcp.tglauner.com/mcp`.
- Streamable HTTP is the preferred transport for MCP clients.

## DigitalOcean + Apache (reverse proxy)

This setup runs the Node server on localhost (port 3000) and proxies
`https://mcp.tglauner.com/mcp` through Apache.

### 1) Systemd service for Node

Create `/etc/systemd/system/mcp-tglauner.service`:

```ini
[Unit]
Description=MCP server for mcp.tglauner.com
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/html/mcp.tglauner.com
ExecStart=/usr/bin/node /var/www/html/mcp.tglauner.com/src/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mcp-tglauner
sudo systemctl status mcp-tglauner
```

### 2) Apache proxy config

You already have a `*:443` vhost (`/etc/apache2/sites-enabled/tglauner-ssl.conf`).
Add these lines inside that `<VirtualHost *:443>` block:

```apache
ProxyPreserveHost On
ProxyPass /mcp http://127.0.0.1:3000/mcp flushpackets=on
ProxyPassReverse /mcp http://127.0.0.1:3000/mcp
```

If you want to ensure the repo itself is never served as static files, add:

```apache
<Directory /var/www/html/mcp.tglauner.com>
  Require all denied
</Directory>
```

### 3) Quick smoke check

```bash
curl -s http://127.0.0.1:3000/ | jq .
curl -s http://mcp.tglauner.com/ | jq .
```
