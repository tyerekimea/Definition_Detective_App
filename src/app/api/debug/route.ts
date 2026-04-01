import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const host = req.headers.get('host') || '';
  if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    return NextResponse.json({ error: 'Only accessible from localhost' }, { status: 403 });
  }

  return NextResponse.json({
    status: 'ok',
    nodeEnv: process.env.NODE_ENV || 'unknown',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGoogleGenAIKey: !!process.env.GOOGLE_GENAI_API_KEY,
  });
}
