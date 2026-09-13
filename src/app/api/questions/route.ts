import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get('skillId');

  const questions = await prisma.question.findMany({
    where: skillId ? { skillId } : undefined,
    include: { skill: true },
    take: 5,
  });

  return NextResponse.json(questions);
}
