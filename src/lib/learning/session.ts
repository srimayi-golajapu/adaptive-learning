import { PrismaClient } from '@prisma/client';
import { ActionType } from '../recommendation/priority-engine';

const prisma = new PrismaClient();

export interface LearningSession {
  skillId: string;
  skillName: string;
  actionType: ActionType;
  resources: {
    id: string;
    title: string;
    url: string;
    type: string;
  }[];
  practiceQuestions?: {
    id: string;
    text: string;
    type: string;
  }[];
}

/**
 * Initializes a targeted learning session based on the recommended action.
 * It selects the minimal optimal set of resources/questions.
 */
export async function startSession(learnerId: string, skillId: string, actionType: ActionType): Promise<LearningSession> {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: {
      resources: {
        include: { resource: true }
      }
    }
  });

  if (!skill) throw new Error('Skill not found');

  let targetRole = 'Primary Learning';
  let includePractice = false;

  switch (actionType) {
    case 'LEARN':
    case 'REPAIR_PREREQUISITE':
      targetRole = 'Primary Learning';
      includePractice = true; // Learn then immediately practice
      break;
    case 'PRACTICE':
      targetRole = 'Practice';
      includePractice = true;
      break;
    case 'REVISE':
      targetRole = 'Revision';
      includePractice = true;
      break;
    case 'ASSESS':
      targetRole = 'Assessment';
      includePractice = true;
      break;
  }

  // Filter resources based on the determined role
  const optimalResources = skill.resources
    .filter(rs => rs.resource.role === targetRole)
    .map(rs => ({
      id: rs.resource.id,
      title: rs.resource.title,
      url: rs.resource.url || '',
      type: rs.resource.type
    }));

  // Fallback to Primary Learning if no specific revision/practice resource exists
  if (optimalResources.length === 0) {
    const fallback = skill.resources
      .filter(rs => rs.resource.role === 'Primary Learning')
      .map(rs => ({
        id: rs.resource.id,
        title: rs.resource.title,
        url: rs.resource.url || '',
        type: rs.resource.type
      }));
    optimalResources.push(...fallback);
  }

  let practiceQuestions = undefined;
  
  if (includePractice) {
    // Fetch a few practice questions for the loop
    const questions = await prisma.question.findMany({
      where: { skillId },
      take: 3
    });
    
    practiceQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type
    }));
  }

  return {
    skillId,
    skillName: skill.name,
    actionType,
    // We only return the smallest sufficient set of resources (take 1 or 2 max)
    resources: optimalResources.slice(0, 2),
    practiceQuestions
  };
}
