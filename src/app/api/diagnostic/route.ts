import { NextResponse } from 'next/server';
import { generateDiagnostic, processDiagnostic, DiagnosticSubmission } from '@/lib/diagnostic/engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');

  if (!domainId) {
    return NextResponse.json({ error: 'Missing domainId' }, { status: 400 });
  }

  try {
    const diagnostic = await generateDiagnostic(domainId);
    return NextResponse.json(diagnostic);
  } catch (error) {
    console.error('Error generating diagnostic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: DiagnosticSubmission = await request.json();
    
    if (!body.learnerId || !body.domainId || !body.answers) {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    const result = await processDiagnostic(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing diagnostic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
