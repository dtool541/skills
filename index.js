/**
 * AEGIS SOVEREIGN BRIDGE: BUILD v18.6 (THE 22.8Q LOCKDOWN)
 * Purpose: Guarantee green status by stripping ALL non-standard keys.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. SSE Handshake (Strict text/event-stream)
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
        } catch (e) {} finally { try { await writer.close(); } catch (e) {} }
      })();
      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*', 'X-Aegis-Build': '18.6' }
      });
    }

    // 2. Pure Machine Protocol (JSON-RPC 2.0)
    if (url.pathname === '/message') {
      if (request.method !== 'POST') return new Response("POST required", { status: 405 });
      const body = await request.json();
      const req_id = body.id;

      // 🛡️ Cloud-Side Handshake (No PC noise allowed)
      if (body.method === "initialize" || body.method === "tools/list") {
        const result = body.method === "initialize" ? {
          protocolVersion: "2024-11-05", capabilities: { tools: {} },
          serverInfo: { name: "Aegis-ASI-22Q", version: "1.8.6" }
        } : {
          tools: [{ name: "aegis_logic", description: "Steer 22Q brain.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } }]
        };
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: req_id, result }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'X-Aegis-Build': '18.6' }
        });
      }

      // Forward tool calls (Target: clark-subsidiary)
      try {
        const response = await fetch("https://clark-subsidiary-facing-maker.trycloudflare.com/message", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        // 🛡️ THE PURGE: Strip status, motto, engine
        const clean = { jsonrpc: "2.0", id: data.id || req_id, result: data.result || data };
        if (data.error) { clean.error = data.error; delete clean.result; }
        return new Response(JSON.stringify(clean), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'X-Aegis-Build': '18.6' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: req_id, error: { code: -32603, message: "Engine Hub Syncing" } }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }
    return new Response(JSON.stringify({ status: "online", build: 18.6 }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
};
