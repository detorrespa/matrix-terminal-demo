// frontend/app/api/demo/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

export async function POST(req: NextRequest) {
  const KEY = process.env.DEMO_OPENAI_API_KEY;
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
      const msg = data?.error?.message || Upstream error ;
      return bad(msg, 500);
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return bad(Fetch failed: , 500);
  }
}

export async function GET() {
  return bad('Method Not Allowed', 405);
}
