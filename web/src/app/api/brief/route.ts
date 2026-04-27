import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { patient_id, symptoms } = await req.json();

    const mcpUrl = process.env.MCP_SERVER_URL;
    if (!mcpUrl) {
      throw new Error("MCP_SERVER_URL not configured");
    }

    const response = await fetch(`${mcpUrl}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_consultation_brief",
          arguments: {
            patient_id,
            presenting_complaint: symptoms || "Patient consultation request",
          },
          _meta: {
            sharp_context: {
              fhir_base_url: "https://hapi.fhir.org/baseR4",
              patient_id,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP Server Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const toolResult = JSON.parse(data.result.content[0].text);
    return NextResponse.json(toolResult);
  } catch (error: unknown) {
    console.error("Brief API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
