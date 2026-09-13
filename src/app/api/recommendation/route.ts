import { NextResponse } from 'next/server';
import { getNextBestAction } from '@/lib/recommendation/priority-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learnerId');
  const availableTimeStr = searchParams.get('timeMins');

  if (!learnerId) {
    return NextResponse.json({ error: 'Missing learnerId' }, { status: 400 });
  }

  const availableTimeMins = availableTimeStr ? parseInt(availableTimeStr) : 60;

  try {
    const recommendations = await getNextBestAction(learnerId, availableTimeMins);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
