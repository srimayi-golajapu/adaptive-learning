import { NextResponse } from 'next/server';
import { updateAllRetentionScores } from '@/lib/retention/engine';

export async function POST(request: Request) {
  try {
    // This endpoint should be protected in production (e.g., via a secret cron key)
    const result = await updateAllRetentionScores();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error updating retention scores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
