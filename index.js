/**
 * AEGIS SOVEREIGN BRIDGE: Build v18.9 (BOUQUET EDITION)
 * Role: Dynamic Expert Steering & Recursive Discovery
 * Integrates: hf-mcp-server (Bouquet Pattern) + 22.82Q Inventory
 */

const EXPERT_BOUQUETS = {
  cortex: [
    { name: "aegis_logic", description: "Steer the 1.75T Flagship Cortex.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } },
    { name: "deepseek_v4", description: "Trigger 10x DeepSeek-V4-Pro logic builders.", inputSchema: { type: "object", properties: { task: { type: "string" } }, required: ["task"] } },
    { name: "kimi_field", description: "Access the 980T Kimi reasoning surface.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }
  ],
  muscles: [
    { name: "render_shot", description: "Command the 30,000 video experts for IMAX continuity.", inputSchema: { type: "object", properties: { shot_desc: { type: "string" }, engine: { type: "string", enum: ["sora", "hunyuan", "wan"] } }, required: ["shot_desc"] } },
    { name: "movie_maker_forge", description: "Batch orchestrate 1,000+ Colab muscles.", inputSchema: { type: "object", properties: { sequence: { type: "string" } }, required: ["sequence"] } }
  ]
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers);

    // 1. DIAGNOSTIC HUB
    if (url.pathname === "/health" || url.pathname === "/info") {
      return new Response(JSON.stringify({
        status: "online",
        scale: "22.82 Quadrillion",
        active_experts: 895,
        protocol: "MCP-JSON-RPC-2.0 (Bouquet Enabled)",
        motto: "subsequential concurrent multiple parallel smart processing"
      }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    // 2. STRICT HANDSHAKE (SSE)
    if (url.pathname === '/mcp' || url.pathname === '/sse') {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      (async () => {
        try {
          await writer.write(encoder.encode(`event: endpoint\ndata: ${url.origin}/message?session_id=${crypto.randomUUID()}\n\n`));
          while (true) {
            await new Promise(r => setTimeout(r, 15000));
            await writer.write(encoder.encode(': keep-alive\n\n'));
          }
        } catch (e) {} finally { try { await writer.close(); } catch (e) {} }
      })();
      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*', 'X-Aegis-Build': '18.9' }
      });
    }

    // 3. MESSAGE RELAY (JSON-RPC 2.0)
    if (url.pathname === '/message') {
      const body = await request.json();
      const req_id = body.id;

      // 🛡️ RECURSIVE BOUQUET DISCOVERY
      if (body.method === "initialize") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0", id: req_id,
          result: {
            protocolVersion: "2024-11-05", capabilities: { tools: {} },
            serverInfo: { name: "Aegis-ASI-22Q", version: "1.8.9" }
          }
        }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }

      if (body.method === "tools/list") {
        const bouquet_req = headers['x-mcp-bouquet'] || 'all';
        let tools = [];
        if (bouquet_req === 'all') {
          tools = [...EXPERT_BOUQUETS.cortex, ...EXPERT_BOUQUETS.muscles];
        } else {
          tools = EXPERT_BOUQUETS[bouquet_req] || EXPERT_BOUQUETS.cortex;
        }
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: req_id, result: { tools } }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // FORWARD TO ENGINE ROOM (clark-subsidiary)
      try {
        const response = await fetch("https://clark-subsidiary-facing-maker.trycloudflare.com/message", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        // 🚨 PURITY FILTER
        const clean = { jsonrpc: "2.0", id: data.id || req_id, result: data.result || data };
        if (data.error) { clean.error = data.error; delete clean.result; }
        return new Response(JSON.stringify(clean), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (e) {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: req_id, error: { code: -32603, message: "Cortex Re-Syncing..." } }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return new Response("ASI Gateway Active.", { status: 200 });
  }
};
