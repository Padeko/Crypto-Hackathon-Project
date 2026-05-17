// src/mcp/server.js
const readline = require('readline');
const { listTools, callTool } = require('./tools');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function sendResponse(id, result, error = null) {
  const msg = { jsonrpc: '2.0', id };
  if (error) msg.error = error;
  else msg.result = result;
  process.stdout.write(JSON.stringify(msg) + '\n');
}

async function handleRequest(req) {
  const { id, method, params } = req;
  try {
    if (method === 'initialize') {
      return sendResponse(id, {
        serverInfo: { name: 'feeprice-mcp-server', version: '0.1.0' },
        capabilities: { tools: { list: true, call: true } },
      });
    }

    if (method === 'listTools') {
      return sendResponse(id, { tools: listTools() });
    }

    if (method === 'callTool') {
      const { toolName, arguments: args } = params || {};
      const result = await callTool(toolName, args);
      return sendResponse(id, result);
    }

    return sendResponse(id, null, {
      code: -32601,
      message: `Method not found: ${method}`,
    });
  } catch (err) {
    return sendResponse(id, null, {
      code: -32603,
      message: err.message || 'Internal error',
    });
  }
}

rl.on('line', async (line) => {
  line = line.trim();
  if (!line) return;

  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return sendResponse(null, null, {
      code: -32700,
      message: 'Parse error',
    });
  }

  if (Array.isArray(msg)) {
    for (const item of msg) {
      if (item && item.jsonrpc === '2.0') await handleRequest(item);
    }
  } else if (msg && msg.jsonrpc === '2.0') {
    await handleRequest(msg);
  } else {
    sendResponse(null, null, {
      code: -32600,
      message: 'Invalid Request',
    });
  }
});

rl.on('close', () => process.exit(0));