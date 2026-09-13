import { PrismaClient, MasteryState, Skill } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculates the current retention score based on the Ebbinghaus forgetting curve.
 * Formula approximation: Retention = e^(-time_elapsed / memory_strength)
 */
export function calculateDecayedRetention(
  state: MasteryState,
  skill: Skill,
  currentTime: Date = new Date()
): number {
  if (!state.lastAssessedAt) return 1.0;

  const daysElapsed = (currentTime.getTime() - state.lastAssessedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysElapsed <= 0) return state.retentionScore;

  // Memory strength (S) is influenced by conceptual level and practical level.
  // Higher mastery = slower decay.
  // We also use skill difficulty; harder skills might decay faster if not practiced.
  const masteryAvg = (state.conceptualLevel + state.practicalLevel) / 2;
  
  // Base memory strength in days (how long until it decays significantly)
  // E.g., mastery 1.0 -> S = 30 days. Mastery 0.5 -> S = 15 days.
  let memoryStrength = Math.max(1, masteryAvg * 30);
  
  // Harder skills decay 10% faster per difficulty point above 1
  const difficultyPenalty = 1 - ((skill.difficulty - 1) * 0.1); 
  memoryStrength *= difficultyPenalty;

  // Calculate new retention based on the curve. 
  // If base retention was already low from a recent RECALL_GAP, use that as the starting point.
  const decayFactor = Math.exp(-daysElapsed / memoryStrength);
  const newRetention = state.retentionScore * decayFactor;

  return Math.max(0.0, Math.min(1.0, newRetention));
}

/**
 * Batch processes all mastery states to apply retention decay.
 * In a production environment, this would run as a daily cron job.
 */
export async function updateAllRetentionScores() {
  const allMasteryStates = await prisma.masteryState.findMany({
    include: { skill: true }
  });

  const updates = [];

  for (const state of allMasteryStates) {
    const newRetention = calculateDecayedRetention(state, state.skill);
    
    // Only update if there is a meaningful change (e.g., > 1%)
    if (Math.abs(state.retentionScore - newRetention) > 0.01) {
      updates.push(
        prisma.masteryState.update({
          where: { id: state.id },
          data: { retentionScore: newRetention }
        })
      );
    }
  }

  // Execute in transactions chunks if large, but single tx is fine for MVP
  await prisma.$transaction(updates);

  return { processed: allMasteryStates.length, updated: updates.length };
}
