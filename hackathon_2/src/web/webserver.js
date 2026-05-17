// src/web/webServer.js
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// Serve static files (index.html etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Simple MCP client helper that calls getFeePrices
function callMcpGetFeePrices() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [path.join(__dirname, '..', 'mcp', 'server.js')], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    let buffer = '';
    let initialized = false;

    server.stdout.on('data', (data) => {
      buffer += data.toString();

      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;

        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          server.kill();
          return reject(new Error('Invalid JSON from MCP server'));
        }

        // Handle initialize response
        if (msg.id === 1 && msg.result && !initialized) {
          initialized = true;
          const callToolReq = {
            jsonrpc: '2.0',
            id: 2,
            method: 'callTool',
            params: {
              toolName: 'getFeePrices',
              arguments: {},
            },
          };
          server.stdin.write(JSON.stringify(callToolReq) + '\n');
          return;
        }

        // Handle callTool(getFeePrices) response
        if (msg.id === 2 && msg.result) {
          const contentItem =
            Array.isArray(msg.result.content) && msg.result.content[0];
          const feeprices = contentItem && contentItem.data;
          server.stdin.end();
          server.kill();
          return resolve(feeprices);
        }
      }
    });

    server.on('error', (err) => reject(err));
    server.on('exit', (code) => {
      if (!initialized && code !== 0) {
        reject(new Error(`MCP server exited with code ${code}`));
      }
    });

    // Send initialize
    const initReq = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    };
    server.stdin.write(JSON.stringify(initReq) + '\n');
  });
}

// HTTP endpoint that front-end can call
app.get('/api/getFeePrices', async (req, res) => {
  try {
    const feeprices = await callMcpGetFeePrices();
    res.json({ feeprices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

app.listen(PORT, () => {
  console.log(`Web server running at http://localhost:${PORT}`);
});
