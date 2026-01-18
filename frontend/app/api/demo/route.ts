// frontend/app/api/demo/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// noop: touch to trigger deploy

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

export async function POST(req: NextRequest) {
  const KEY = process.env.DEMO_OPENAI_API_KEY;
  if (!KEY) return bad('Demo disabled: missing DEMO_OPENAI_API_KEY', 403);

  let body: any;
  try { body = await req.json(); } catch { return bad('Invalid JSON body'); }

  const { messages, model = 'gpt-4o-mini', temperature = 0.2 } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) return bad('messages required');

  // Cabeceras para clave normal `sk-...`
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
      const msg = data?.error?.message || `Upstream error ${resp.status}`;
      return bad(msg, 500);
    }

    // Devuelve el payload de OpenAI tal cual
    return NextResponse.json(data);
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    return bad(`Fetch failed: ${msg}`, 500);
  }
}

export async function GET() {
  return bad('Method Not Allowed', 405);
}
