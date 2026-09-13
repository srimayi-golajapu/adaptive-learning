import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type FailureType = 
  | 'CONCEPT_GAP'
  | 'PREREQUISITE_GAP'
  | 'PATTERN_RECOGNITION_GAP'
  | 'IMPLEMENTATION_GAP'
  | 'COMPLEXITY_GAP'
  | 'RECALL_GAP'
  | 'CARELESS_ERROR'
  | 'TIME_PRESSURE';

export interface AttemptSubmission {
  learnerId: string;
  questionId: string;
  isCorrect: boolean;
  timeSpentMs?: number;
  failureType?: FailureType; // Determined by UI, AI, or heuristics
}

/**
 * Processes a single practice/assessment attempt and updates 
 * the learner's mastery state accordingly.
 */
export async function processAttempt(submission: AttemptSubmission) {
  const { learnerId, questionId, isCorrect, timeSpentMs, failureType } = submission;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { skill: true }
  });

  if (!question) throw new Error('Question not found');

  const skillId = question.skillId;

  // 1. Record the attempt
  const attempt = await prisma.attempt.create({
    data: {
      learnerId,
      questionId,
      isCorrect,
      timeSpentMs,
      failureType: isCorrect ? null : failureType
    }
  });

  // 2. Fetch existing MasteryState
  const masteryState = await prisma.masteryState.findUnique({
    where: {
      learnerId_skillId: { learnerId, skillId }
    }
  });

  const currentConceptual = masteryState?.conceptualLevel || 0;
  const currentPractical = masteryState?.practicalLevel || 0;
  
  let newConceptual = currentConceptual;
  let newPractical = currentPractical;

  // 3. Update logic based on correctness and failure type
  if (isCorrect) {
    // Increase mastery slightly. The harder the question, the higher the gain.
    const gain = 0.1 * question.difficulty;
    newConceptual = Math.min(1.0, currentConceptual + gain);
    
    // If it was a coding/implementation question, boost practical level more
    if (question.type === 'Coding') {
      newPractical = Math.min(1.0, currentPractical + gain * 1.5);
    } else {
      newPractical = Math.min(1.0, currentPractical + gain * 0.5);
    }
  } else {
    // Penalize mastery based on failure classification
    const penalty = 0.05 * question.difficulty;
    
    if (failureType === 'CONCEPT_GAP' || failureType === 'PREREQUISITE_GAP') {
      newConceptual = Math.max(0.0, currentConceptual - penalty);
    } else if (failureType === 'IMPLEMENTATION_GAP' || failureType === 'CARELESS_ERROR') {
      newPractical = Math.max(0.0, currentPractical - penalty);
    } else if (failureType === 'RECALL_GAP') {
      // Recall gap heavily impacts retention score rather than conceptual understanding
      // (Retention logic is handled in Milestone 7, but we can dock a bit here)
      newConceptual = Math.max(0.0, currentConceptual - penalty * 0.5);
    }
  }

  // 4. Save updated mastery state
  const updatedState = await prisma.masteryState.upsert({
    where: {
      learnerId_skillId: { learnerId, skillId }
    },
    update: {
      conceptualLevel: newConceptual,
      practicalLevel: newPractical,
      lastAssessedAt: new Date()
    },
    create: {
      learnerId,
      skillId,
      conceptualLevel: newConceptual,
      practicalLevel: newPractical,
      lastAssessedAt: new Date()
    }
  });

  return { attempt, updatedState };
}

/**
 * Direct update for when a learner consumes a primary resource and 
 * marks it as understood without taking a formal test.
 */
export async function markSkillLearned(learnerId: string, skillId: string) {
  const masteryState = await prisma.masteryState.findUnique({
    where: {
      learnerId_skillId: { learnerId, skillId }
    }
  });

  const currentConceptual = masteryState?.conceptualLevel || 0;
  
  // A resource consumption boosts conceptual knowledge, but not practical
  const newConceptual = Math.min(1.0, currentConceptual + 0.3);

  const updatedState = await prisma.masteryState.upsert({
    where: {
      learnerId_skillId: { learnerId, skillId }
    },
    update: {
      conceptualLevel: newConceptual,
      lastAssessedAt: new Date(),
      retentionScore: 1.0
    },
    create: {
      learnerId,
      skillId,
      conceptualLevel: newConceptual,
      practicalLevel: 0.0,
      retentionScore: 1.0,
      lastAssessedAt: new Date()
    }
  });

  return { updatedState };
}
