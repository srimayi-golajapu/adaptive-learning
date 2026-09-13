import { NextResponse } from 'next/server';
import { processAttempt, markSkillLearned, AttemptSubmission } from '@/lib/mastery/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Fast track for marking a resource as learned
    if (body.type === 'LEARN' && body.learnerId && body.skillId) {
      const result = await markSkillLearned(body.learnerId, body.skillId);
      return NextResponse.json(result);
    }
    
    // Formal attempt processing
    if (!body.learnerId || !body.questionId || body.isCorrect === undefined) {
      return NextResponse.json({ error: 'Invalid attempt data' }, { status: 400 });
    }

    const result = await processAttempt(body as AttemptSubmission);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
