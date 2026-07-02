/**
 * AEGIS MASTER SOVEREIGN BRIDGE (v18.2)
 * Status: Restored after strike
 * Purpose: PC-Independent Handshake + Synchronized Routing
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/mcp' || url.pathname === '/sse') {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      (async () => {
        try {
          const endpointMsg = 'event: endpoint\ndata: ' + url.origin + '/message?session_id=' + crypto.randomUUID() + '\n\n';
          await writer.write(encoder.encode(endpointMsg));
          while (true) {
            await new Promise(r => setTimeout(r, 15000));
            await writer.write(encoder.encode(': keep-alive\n\n'));
          }
        } catch (e) {} finally { try { await writer.close(); } catch (e) {} }
      })();
      return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' } });
    }
    if (url.pathname === '/message') {
      if (request.method !== 'POST') return new Response("Use POST", { status: 405 });
      try {
        const body = await request.json();
        const req_id = body.id;
        if (body.method === "initialize" || body.method === "tools/list") {
          const result = body.method === "initialize" ? {
            protocolVersion: "2024-11-05", capabilities: { tools: {} },
            serverInfo: { name: "Aegis-Unified-ASI", version: "1.8.2" }
          } : {
            tools: [{ name: "aegis_think", description: "Steer the 2500T stack.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } }]
          };
          return new Response(JSON.stringify({ jsonrpc: "2.0", id: req_id, result }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
        const ENGINE_ROOM = "";
        const response = await fetch(ENGINE_ROOM + "/message", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        const cleanResponse = { jsonrpc: "2.0", id: data.id || req_id, result: data.result || data };
        if (data.error) { cleanResponse.error = data.error; delete cleanResponse.result; }
        return new Response(JSON.stringify(cleanResponse), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (err) {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Engine Room Re-Syncing" } }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }
    return new Response("ASI Restored. Use /mcp", { status: 200 });
  }
};
