export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/mcp' || url.pathname === '/sse') {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      (async () => {
        try {
          await writer.write(encoder.encode(`event: endpoint\ndata: ${url.origin}/message?session_id=${crypto.randomUUID()}\n\n`));
          while (true) { await new Promise(r => setTimeout(r, 15000)); await writer.write(encoder.encode(': keep-alive\n\n')); }
        } catch (e) {} finally { try { await writer.close(); } catch (e) {} }
      })();
      return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*', 'X-Aegis-Build': '18.8' } });
    }
    if (url.pathname === '/message') {
      const body = await request.json();
      if (body.method === "initialize" || body.method === "tools/list") {
        const result = body.method === "initialize" ? { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "Aegis-ASI-22Q", version: "1.8.8" } } 
        : { tools: [{ name: "aegis_logic", description: "Steer 22Q brain.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } }] };
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
      try {
        const res = await fetch("https://inserted-gale-sue-expertise.trycloudflare.com/message", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: data.id || body.id, result: data.result || data }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (e) { return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, error: { code: -32603, message: "Syncing..." } }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }
    }
    return new Response("Aegis-ASI-22Q Active", { status: 200 });
  }
};
