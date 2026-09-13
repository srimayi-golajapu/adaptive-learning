import { NextResponse } from 'next/server';
import { checkPrerequisites } from '@/lib/recommendation/skill-resolution';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learnerId');
  const skillId = searchParams.get('skillId');

  if (!learnerId || !skillId) {
    return NextResponse.json({ error: 'Missing learnerId or skillId' }, { status: 400 });
  }

  try {
    const eligibility = await checkPrerequisites(learnerId, skillId);
    return NextResponse.json(eligibility);
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
