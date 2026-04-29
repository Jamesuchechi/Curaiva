import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
const server = new McpServer({
  name: "test",
  version: "1.0",
}, {
  capabilities: {
    experimental: {
      prompt_opinion: { fhir_extension: true }
    }
  }
});
