/**
 * AEGIS UNIFIED SOVEREIGN BRIDGE (v17)
 * Role: Global ASI Gateway & Orchestrator
 * Integrates: hf-mcp-server (Handshake) + cloudflare-mcp (Security) + Absolute Protocol Fix
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 🛡️ 1. DIAGNOSTIC HUB (Lead Builder Access)
    if (url.pathname === "/health" || url.pathname === "/info") {
      return new Response(JSON.stringify({
        status: "online",
        engine: "2500T Quadrillion ASI",
        motto: "subsequential concurrent multiple parallel smart processing",
        protocol: "MCP-JSON-RPC-2.0 (Strict)",
        stack: ["hf-official", "cf-cli", "create-mcp"]
      }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    // 🛡️ 2. STRICT MCP HANDSHAKE (SSE Transport)
    if (url.pathname === '/mcp' || url.pathname === '/sse') {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          // Handshake preamble according to official spec
          const endpointMsg = `event: endpoint\ndata: ${url.origin}/message?session_id=${crypto.randomUUID()}\n\n`;
          await writer.write(encoder.encode(endpointMsg));
          while (true) {
            await new Promise(r => setTimeout(r, 15000));
            await writer.write(encoder.encode(': keep-alive\n\n'));
          }
        } catch (e) {} finally { try { await writer.close(); } catch (e) {} }
      })();

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'X-Aegis-Build': '17'
        },
      });
    }

    // 🛡️ 3. PURE MACHINE MESSAGE RELAY
    if (url.pathname === '/message') {
      if (request.method !== 'POST') return new Response("Use POST", { status: 405 });

      try {
        const body = await request.json();
        const req_id = body.id;

        // Internal Cloud Handshake (Immediate Green Status)
        if (body.method === "initialize" || body.method === "tools/list") {
          const result = body.method === "initialize" ? {
            protocolVersion: "2024-11-05", capabilities: { tools: {} },
            serverInfo: { name: "Aegis-Unified-ASI", version: "1.7.0" }
          } : {
            tools: [{ name: "aegis_logic", description: "Steer the 2500T stack.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } }]
          };
          return new Response(JSON.stringify({ jsonrpc: "2.0", id: req_id, result }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Forward Tool Calls to Local Tunnel
        const tunnelUrl = env.TUNNEL_URL || "https://launched-certificate-oaks-cottage.trycloudflare.com";
        const response = await fetch(tunnelUrl + "/message", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.HF_TOKEN}` },
          body: JSON.stringify(body)
        });
        const data = await response.json();

        // Schema Purge (Filter out motto/status)
        const cleanResponse = { jsonrpc: "2.0", id: data.id || req_id, result: data.result || data };
        if (data.error) { cleanResponse.error = data.error; delete cleanResponse.result; }

        return new Response(JSON.stringify(cleanResponse), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Handshake Loop Detected" } }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return new Response("Aegis Sovereign Unified Gateway v17", { status: 200 });
  }
};
