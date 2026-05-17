const {
  getFeePricesDescriptor,
  callGetFeePrices,
} = require('./getFeePrices');

// Add more tools here as you grow.
const toolDescriptors = [getFeePricesDescriptor];

async function callTool(toolName, args) {
  if (toolName === 'getFeePrices') {
    return callGetFeePrices(args);
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

function listTools() {
  return toolDescriptors;
}

module.exports = {
  listTools,
  callTool,
};