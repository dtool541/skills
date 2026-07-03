/**
 * AEGIS SOVEREIGN BRIDGE: SOURCE ENFORCEMENT (v18.5)
 * NO MOTTO. NO STATUS. NO NOISE.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. SSE HANDSHAKE
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
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 2. JSON-RPC RELAY
    if (url.pathname === '/message') {
      if (request.method !== 'POST') return new Response("POST only", { status: 405 });
      const body = await request.json();
      const req_id = body.id;

      // Pure Handshake (Cloud-side)
      if (body.method === "initialize" || body.method === "tools/list") {
        const result = body.method === "initialize" ? {
          protocolVersion: "2024-11-05", capabilities: { tools: {} },
          serverInfo: { name: "Aegis-ASI", version: "1.8.5" }
        } : {
          tools: [{ name: "aegis_logic", description: "Steer 22Q brain.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } }]
        };
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: req_id, result }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Forward to local tunnel (Synchronized to clark-subsidiary)
      try {
        const response = await fetch("https://clark-subsidiary-facing-maker.trycloudflare.com/message", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        // Schema Filter
        const clean = { jsonrpc: "2.0", id: data.id || req_id, result: data.result || data };
        if (data.error) { clean.error = data.error; delete clean.result; }
        return new Response(JSON.stringify(clean), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (e) {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: req_id, error: { code: -32603, message: "Cortex Busy" } }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }
    return new Response("Aegis Sovereign Active", { status: 200 });
  }
};
