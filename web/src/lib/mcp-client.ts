import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function callMcpTool(toolName: string, args: Record<string, unknown>, _fhirBaseUrl: string, _patientId?: string) {
  const mcpUrl = process.env.MCP_SERVER_URL;
  if (!mcpUrl) throw new Error("MCP_SERVER_URL not configured");

  // If mcpUrl has trailing slash, remove it, ensure we append /mcp
  const endpoint = mcpUrl.endsWith("/mcp") ? mcpUrl : `${mcpUrl}/mcp`;
  
  const transport = new SSEClientTransport(new URL(endpoint));
  const client = new Client(
    { name: "curaiva-web", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });
    
    // Attempt to parse JSON response
    const content = (result as { content?: Array<{ type: string; text?: string }> }).content;
    const textResult = content?.[0]?.type === "text" ? (content[0].text || "{}") : "{}";
    try {
      return JSON.parse(textResult);
    } catch {
      return { result: textResult };
    }
  } finally {
    await client.close();
  }
}
