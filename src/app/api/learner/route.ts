import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const learner = await prisma.learner.findFirst();
  if (!learner) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(learner);
}
