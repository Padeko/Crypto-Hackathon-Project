const { sendResponse } = require('./jsonRpcServer');
const { serverInfo } = require('../config/serverInfo');
const { listTools, callTool } = require('../tools');

/**
 * Handle a single MCP JSON-RPC request.
 * @param {object} req
 */
async function handleMcpRequest(req) {
  const { id, method, params } = req;

  try {
    // 1. initialize
    if (method === 'initialize') {
      return sendResponse(id, {
        serverInfo,
        capabilities: {
          tools: {
            list: true,
            call: true,
          },
        },
      });
    }

    // 2. listTools
    if (method === 'listTools') {
      return sendResponse(id, {
        tools: listTools(),
      });
    }

    // 3. callTool
    if (method === 'callTool') {
      const { toolName, arguments: args } = params || {};
      const result = await callTool(toolName, args);
      return sendResponse(id, result);
    }

    // Unknown method
    return sendResponse(id, null, {
      code: -32601,
      message: `Method not found: ${method}`,
    });
  } catch (err) {
    return sendResponse(id, null, {
      code: -32603,
      message: err?.message || 'Internal error',
    });
  }
}

module.exports = {
  handleMcpRequest,
};