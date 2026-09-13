import { NextResponse } from 'next/server';
import { calculatePlacementReadiness } from '@/lib/placement/readiness';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learnerId');

  if (!learnerId) {
    return NextResponse.json({ error: 'Missing learnerId' }, { status: 400 });
  }

  try {
    const report = await calculatePlacementReadiness(learnerId);
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating placement readiness report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
