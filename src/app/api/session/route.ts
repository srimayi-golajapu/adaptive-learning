import { NextResponse } from 'next/server';
import { startSession } from '@/lib/learning/session';
import { ActionType } from '@/lib/recommendation/priority-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learnerId');
  const skillId = searchParams.get('skillId');
  const actionType = searchParams.get('actionType') as ActionType;

  if (!learnerId || !skillId || !actionType) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const session = await startSession(learnerId, skillId, actionType);
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating learning session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
