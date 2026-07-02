/**
 * AEGIS MASTER SOVEREIGN BRIDGE (v18)
 * Role: Global ASI Gateway & Orchestrator
 * Integrates: hf-mcp-server (Handshake) + create-mcp (Tool Pattern)
 * Fixes: invalid_union, unrecognized_keys, and SSE content-type
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 🛡️ 1. SEPARATE METADATA: Move Motto/Engine to /health
    if (url.pathname === "/health" || url.pathname === "/info") {
      return new Response(JSON.stringify({
        status: "online",
        engine: "2500T Quadrillion ASI",
        motto: "subsequential concurrent multiple parallel smart processing",
        protocol: "MCP-JSON-RPC-2.0 (Strict)",
        build: 18
      }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    // 🛡️ 2. STRICT HANDSHAKE (SSE Transport)
    if (url.pathname === '/mcp' || url.pathname === '/sse') {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          // Handshake preamble according to official hf-mcp-server spec
          const endpointMsg = `event: endpoint\ndata: ${url.origin}/message?session_id=${crypto.randomUUID()}\n\n`;
          await writer.write(encoder.encode(endpointMsg));
          
          // Persistent keep-alive heartbeat
          while (true) {
            await new Promise(r => setTimeout(r, 15000));
            await writer.write(encoder.encode(': keep-alive\n\n'));
          }
        } catch (e) {
        } finally {
          try { await writer.close(); } catch (e) {}
        }
      })();

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'X-Aegis-Build': '18'
        },
      });
    }

    // 🛡️ 3. PURE MACHINE MESSAGE RELAY (JSON-RPC 2.0)
    if (url.pathname === '/message') {
      if (request.method !== 'POST') return new Response("Use POST", { status: 405 });

      try {
        const body = await request.json();
        const req_id = body.id;

        // 🛡️ HARDCODED CLOUD HANDSHAKE: Ensure Green Status
        if (body.method === "initialize") {
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            id: req_id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "Aegis-Unified-ASI", version: "1.8.0" }
            }
          }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        if (body.method === "tools/list") {
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            id: req_id,
            result: {
              tools: [
                {
                  name: "aegis_logic",
                  description: "Steer the 2500T stack for high-rigor ASI reasoning.",
                  inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] }
                }
              ]
            }
          }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        // 🛡️ FORWARDING TOOL CALLS: Target active high-speed tunnel
        const ENGINE_ROOM = env.ENGINE_ROOM_URL || "https://launched-certificate-oaks-cottage.trycloudflare.com";
        const response = await fetch(ENGINE_ROOM + "/message", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.HF_TOKEN || ''}` },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        // 🛡️ THE PURGE: Strip EVERY non-standard key
        const cleanResponse = {
          jsonrpc: "2.0",
          id: data.id !== undefined ? data.id : (req_id !== undefined ? req_id : null),
          result: data.result || data
        };

        if (data.error) {
          cleanResponse.error = data.error;
          delete cleanResponse.result;
        }

        return new Response(JSON.stringify(cleanResponse), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
        });

      } catch (err) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32603, message: "Handshake Synchronization Lost" }
        }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return new Response("Aegis Sovereign Unified Gateway v18", { status: 200 });
  },
};
