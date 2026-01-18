// frontend/app/api/demo/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function bad(msg: string, code = 400) {
  return jsonResponse({ error: msg }, code);
}

export async function POST(req: Request) {
  const KEY = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.DEMO_OPENAI_API_KEY;
  if (!KEY) return bad('Demo disabled: missing DEMO_OPENAI_API_KEY', 403);

  let body: any;
  try { body = await req.json(); } catch { return bad('Invalid JSON body'); }

  const { messages, model = 'gpt-3.5-turbo-0125', temperature = 0.2 } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) return bad('messages required');

  const headers: Record<string,string> = {
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, temperature }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      const msg = data?.error?.message || 'Upstream error';
      return bad(msg, 500);
    }
    return jsonResponse(data);
  } catch (e: any) {
    return bad('Fetch failed', 500);
  }
}

export async function GET() {
  return bad('Method Not Allowed', 405);
}
