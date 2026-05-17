#!/usr/bin/env node
const { createJsonRpcServer } = require('./rcp/jsonRpcServer');
const { handleMcpRequest } = require('./rcp/mcpHandler');

createJsonRpcServer(handleMcpRequest);
