#!/bin/bash

# Curaiva AI — MCP Local Test Script
# Mocks a Prompt Opinion tool call with SHARP context

PORT=${1:-3001}
TOOL=${2:-"triage_patient"}
PATIENT_ID=${3:-"592903"}

echo "🚀 Testing MCP Tool: $TOOL"
echo "🏥 Target: http://localhost:$PORT/mcp"
echo "👤 Patient ID: $PATIENT_ID"
echo "------------------------------------------------"

curl -X POST http://localhost:$PORT/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "'"$TOOL"'",
      "arguments": {
        "symptoms": "I have a sharp pain in my lower back and a mild fever.",
        "patient_id": "'"$PATIENT_ID"'"
      },
      "sharp_context": {
        "fhir_base_url": "https://hapi.fhir.org/baseR4",
        "patient_id": "'"$PATIENT_ID"'"
      }
    }
  }' | jq .

echo -e "\n------------------------------------------------"
echo "✅ Test complete"
