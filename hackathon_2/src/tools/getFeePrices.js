// If you're on Node < 18, install node-fetch and `const fetch = require('node-fetch');`

async function getFeePrices() {
  const res = await fetch('https://blockstream.info/api/fee-estimates');
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const feeprices = await res.json();
  return feeprices;
}

/**
 * Tool metadata for listTools
 */
const getFeePricesDescriptor = {
  name: 'getFeePrices',
  description:
    'Fetches current Bitcoin transaction fee estimates from Blockstream and returns them as JSON.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
};

/**
 * MCP-style call wrapper
 */
async function callGetFeePrices(_args) {
  const feeprices = await getFeePrices();
  return {
    toolName: 'getFeePrices',
    content: [
      {
        type: 'json',
        data: feeprices,
      },
    ],
  };
}

module.exports = {
  getFeePricesDescriptor,
  callGetFeePrices,
};