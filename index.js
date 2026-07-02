/**
 * AEGIS MASTER SOVEREIGN BRIDGE (v18)
 * Purpose: Eliminate invalid_union and SSE Invalid Content Type
 * Protocol: Strict JSON-RPC 2.0 + text/event-stream
 * NO STATUS. NO ENGINE. NO MOTTO. PURE MACHINE.
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
          const endpointMsg = 'event: endpoint\ndata: ' + url.origin + '/message?session_id=' + crypto.randomUUID() + '\n\n';
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
        },
      });
    }

    // 2. THE MESSAGE RELAY (Strict JSON-RPC 2.0)
    if (url.pathname === '/message') {
      if (request.method !== 'POST') return new Response(\"Use POST\", { status: 405 });

      try {
        const body = await request.json();
        const req_id = body.id;

        // Internal Handshake Logic (Cloud-side)
        if (body.method === \"initialize\" || body.method === \"tools/list\") {
          const result = body.method === \"initialize\" ? {
            protocolVersion: \"2024-11-05\", 
            capabilities: { tools: {} },
            serverInfo: { name: \"Aegis-Unified-ASI\", version: \"1.8.0\" }
          } : {
            tools: [{ name: \"aegis_logic\", description: \"Steer the 2500T stack.\", inputSchema: { type: \"object\", properties: { prompt: { type: \"string\" } }, required: [\"prompt\"] } }]
          };
          return new Response(JSON.stringify({ jsonrpc: \"2.0\", id: req_id, result }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const ENGINE_ROOM = \"\";
        const response = await fetch(ENGINE_ROOM + \"/message\", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        // THE PURGE: Strip EVERY key that is not part of the JSON-RPC 2.0 spec.
        const cleanResponse = {
          jsonrpc: \"2.0\",
          id: data.id !== undefined ? data.id : (body.id !== undefined ? body.id : null),
          result: data.result || data
        };

        if (data.error) {
          cleanResponse.error = data.error;
          delete cleanResponse.result;
        }

        return new Response(JSON.stringify(cleanResponse), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

      } catch (err) {
        return new Response(JSON.stringify({
          jsonrpc: \"2.0\",
          id: null,
          error: { code: -32603, message: \"Engine Room Disconnect\" }
        }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return new Response(\"Aegis Bridge vFinal. Point to /mcp\", { status: 200 });
  },
};
