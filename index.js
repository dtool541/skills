/**
 * AEGIS SOVEREIGN BRIDGE: TOTAL LOCKDOWN (v16)
 * Purpose: Guarantee green health check by hardcoding the handshake.
 * Protocol: Strict JSON-RPC 2.0 + text/event-stream
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. THE HANDSHAKE (Strict SSE)
    if (url.pathname === '/mcp' || url.pathname === '/sse') {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          const endpointMsg = `event: endpoint\ndata: ${url.origin}/message?session_id=${crypto.randomUUID()}\n\n`;
          await writer.write(encoder.encode(endpointMsg));
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
          'X-Aegis-Build': '16'
        },
      });
    }

    // 2. THE PROTOCOL JAIL (Handled purely in cloud)
    if (url.pathname === '/message') {
      if (request.method !== 'POST') return new Response("Use POST", { status: 405 });

      const body = await request.json();
      const method = body.method;
      const req_id = body.id;

      // 🛡️ HARDCODED CLOUD HANDSHAKE: No call to local PC for these!
      if (method === "initialize") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: req_id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "Aegis-ASI", version: "1.6.0" }
          }
        }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }

      if (method === "tools/list") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: req_id,
          result: {
            tools: [
              {
                name: "aegis_think",
                description: "Call the 2500T Cortex for high-rigor ASI reasoning.",
                inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] }
              }
            ]
          }
        }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }

      // 🛡️ FORWARDING ONLY tools/call (The Actual Logic)
      const ENGINE_ROOM = env.ENGINE_ROOM_URL || "https://navigator-bureau-college-accessing.trycloudflare.com";
      try {
        const response = await fetch(ENGINE_ROOM + "/message", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        
        // Final Purity Filter
        const cleanResponse = {
          jsonrpc: "2.0",
          id: data.id || req_id,
          result: data.result || data
        };
        if (data.error) { cleanResponse.error = data.error; delete cleanResponse.result; }

        return new Response(JSON.stringify(cleanResponse), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0", id: req_id, error: { code: -32603, message: "Engine room link broken" }
        }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return new Response(JSON.stringify({ status: "online", version: 16 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  },
};

