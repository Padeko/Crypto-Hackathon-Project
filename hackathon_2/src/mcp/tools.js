// src/mcp/tools.js
// Node 18+ has fetch built-in; if older, install node-fetch and require it.

async function getFeePrices() {
  const res = await fetch('https://blockstream.info/api/fee-estimates');
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const feeprices = await res.json();
  return feeprices;
}

function listTools() {
  return [
    {
      name: 'getFeePrices',
      description:
        'Fetches current Bitcoin transaction fee estimates from Blockstream and returns them as JSON.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  ];
}

async function callTool(toolName, args) {
  if (toolName === 'getFeePrices') {
    const data = await getFeePrices();
    return {
      toolName: 'getFeePrices',
      content: [
        {
          type: 'json',
          data,
        },
      ],
    };
  }
  throw new Error(`Unknown tool: ${toolName}`);
}

module.exports = {
  listTools,
  callTool,
};