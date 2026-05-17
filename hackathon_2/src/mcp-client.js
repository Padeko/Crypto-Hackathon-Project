// mcp-client.js
const { spawn } = require('child_process');

async function callMcpGetFeePrices() {
  return new Promise((resolve, reject) => {
    // 1. Start the MCP server process
    const server = spawn('node', ['src/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
    });

    let buffer = '';
    let initialized = false;
    let feeprices;

    server.stdout.on('data', (data) => {
      buffer += data.toString();

      // Process complete JSON lines
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line) continue;

        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          return reject(new Error('Invalid JSON from MCP server'));
        }

        if (msg.id === 1 && msg.result && !initialized) {
          // initialize() result received
          initialized = true;

          // 2. After initialize, send callTool(getFeePrices)
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
        } else if (msg.id === 2 && msg.result) {
          // 3. Got the tool result for getFeePrices
          // MCP tool result: { toolName, content: [{ type: 'json', data: ... }] }
          const contentItem =
            Array.isArray(msg.result.content) && msg.result.content[0];
          feeprices = contentItem && contentItem.data;

          server.stdin.end(); // stop sending more input
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

    // 0. Send initialize() request
    const initReq = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    };
    server.stdin.write(JSON.stringify(initReq) + '\n');
  });
}

// Example usage
(async () => {
  try {
    const feeprices = await callMcpGetFeePrices();
    console.log('Fee prices:', feeprices);
    // feeprices now holds the JSON returned by the getFeePrices tool
  } catch (err) {
    console.error('Error calling MCP server:', err);
  }
})();