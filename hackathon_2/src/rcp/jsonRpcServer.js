const readline = require('readline');

/**
 * Creates a JSON-RPC 2.0 server over stdin/stdout.
 * @param {(request: object) => Promise<void>|void} onRequest
 */
function createJsonRpcServer(onRequest) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

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

    // Batch or single
    if (Array.isArray(msg)) {
      for (const item of msg) {
        if (item && item.jsonrpc === '2.0') {
          await onRequest(item);
        } else {
          sendResponse(null, null, {
            code: -32600,
            message: 'Invalid Request',
          });
        }
      }
    } else if (msg && msg.jsonrpc === '2.0') {
      await onRequest(msg);
    } else {
      sendResponse(null, null, {
        code: -32600,
        message: 'Invalid Request',
      });
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

/** Send JSON-RPC response on stdout */
function sendResponse(id, result, error = null) {
  const message = { jsonrpc: '2.0', id };
  if (error) message.error = error;
  else message.result = result;
  process.stdout.write(JSON.stringify(message) + '\n');
}

/** Send JSON-RPC notification (no id) */
function sendNotification(method, params) {
  const message = { jsonrpc: '2.0', method, params };
  process.stdout.write(JSON.stringify(message) + '\n');
}

module.exports = {
  createJsonRpcServer,
  sendResponse,
  sendNotification,
};