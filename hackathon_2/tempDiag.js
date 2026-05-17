const {spawn} = require('child_process');
const path = require('path');
const server = spawn('node', [path.join(__dirname, 'src', 'mcp', 'server.js')], { stdio: ['pipe', 'pipe', 'inherit'] });
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
    } catch (e) {
      console.error('json err', e.message);
      server.kill();
      return;
    }
    console.log('msg', msg);
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
    } else if (msg.id === 2 && msg.result) {
      console.log('result', msg.result);
      server.stdin.end();
      server.kill();
    }
  }
});
server.on('error', (err) => console.error('child error', err));
server.on('exit', (code) => console.log('exit', code));
const initReq = { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} };
server.stdin.write(JSON.stringify(initReq) + '\n');
