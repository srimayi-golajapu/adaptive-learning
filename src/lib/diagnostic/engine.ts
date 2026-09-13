import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DiagnosticSubmission {
  learnerId: string;
  domainId: string;
  answers: {
    questionId: string;
    isCorrect: boolean;
    skillId: string;
  }[];
}

/**
 * Generates a diagnostic test consisting of questions spanning 
 * the skills in a specific domain.
 */
export async function generateDiagnostic(domainId: string) {
  // Fetch a representative set of questions for the domain.
  // In a real system, you'd pick questions based on difficulty distribution,
  // making sure every high-level skill is covered to gauge baseline mastery.
  const questions = await prisma.question.findMany({
    where: {
      skill: {
        domainId: domainId
      }
    },
    include: {
      skill: true
    },
    take: 10 // Mock limit for now
  });

  return {
    domainId,
    questions: questions.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type,
      skillId: q.skillId,
      skillName: q.skill.name
    }))
  };
}

/**
 * Processes the results of a diagnostic test and initializes the
 * learner's MasteryState for the corresponding skills.
 */
export async function processDiagnostic(submission: DiagnosticSubmission) {
  const { learnerId, domainId, answers } = submission;

  // Group answers by skill to determine mastery
  const skillResults: Record<string, { total: number; correct: number }> = {};
  
  for (const answer of answers) {
    if (!skillResults[answer.skillId]) {
      skillResults[answer.skillId] = { total: 0, correct: 0 };
    }
    skillResults[answer.skillId].total += 1;
    if (answer.isCorrect) {
      skillResults[answer.skillId].correct += 1;
    }
  }

  const updates = [];

  // Update mastery for each evaluated skill
  for (const [skillId, stats] of Object.entries(skillResults)) {
    // Calculate a rough conceptual level based on the diagnostic score.
    // e.g., 2/2 correct = 1.0 (Mastered), 1/2 = 0.5 (Partial), 0/2 = 0.0
    const accuracy = stats.correct / stats.total;

    // Use upsert so we either create a new MasteryState or update an existing one
    const updatePromise = prisma.masteryState.upsert({
      where: {
        learnerId_skillId: {
          learnerId,
          skillId
        }
      },
      update: {
        conceptualLevel: accuracy,
        lastAssessedAt: new Date()
      },
      create: {
        learnerId,
        skillId,
        conceptualLevel: accuracy,
        practicalLevel: accuracy * 0.8, // Estimate practical level slightly lower
        retentionScore: 1.0,
        lastAssessedAt: new Date()
      }
    });

    updates.push(updatePromise);
  }

  // Also record this as a formal AssessmentResult
  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const overallScore = answers.length > 0 ? (totalCorrect / answers.length) : 0;

  updates.push(
    prisma.assessmentResult.create({
      data: {
        learnerId,
        type: 'Diagnostic',
        score: overallScore
      }
    })
  );

  await prisma.$transaction(updates);

  return {
    success: true,
    overallScore,
    skillsEvaluated: Object.keys(skillResults).length
  };
}
