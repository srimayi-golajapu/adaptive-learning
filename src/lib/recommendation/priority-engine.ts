import { PrismaClient, Skill, MasteryState } from '@prisma/client';
import { checkPrerequisites } from './skill-resolution';

const prisma = new PrismaClient();

export type ActionType = 
  | 'LEARN' 
  | 'PRACTICE' 
  | 'REVISE' 
  | 'ASSESS' 
  | 'REPAIR_PREREQUISITE';

export interface Recommendation {
  skillId: string;
  skillName: string;
  action: ActionType;
  priorityScore: number;
  explanation: string;
}

const MASTERY_THRESHOLD = 0.8;
const RETENTION_THRESHOLD = 0.6; // If retention falls below this, revise

/**
 * The core Priority Engine determining the absolute highest-value next action.
 */
export async function getNextBestAction(learnerId: string, availableTimeMins: number = 60): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // 1. Fetch Learner & Target Context
  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    include: { careerTarget: true }
  });
  
  if (!learner) throw new Error('Learner not found');

  // 2. Fetch all skills and learner's current mastery
  const skills = await prisma.skill.findMany({
    include: {
      dependents: true, // to calculate unlocking value
    }
  });

  const masteryStates = await prisma.masteryState.findMany({
    where: { learnerId }
  });
  
  const masteryMap = new Map<string, MasteryState>();
  masteryStates.forEach(m => masteryMap.set(m.skillId, m));

  // 3. Evaluate each skill
  for (const skill of skills) {
    const mastery = masteryMap.get(skill.id);
    const conceptualLevel = mastery?.conceptualLevel || 0;
    const practicalLevel = mastery?.practicalLevel || 0;
    const retentionScore = mastery?.retentionScore || 1.0;

    let action: ActionType | null = null;
    let explanation = '';
    let priorityBonus = 0;

    // --- CHECK 1: Revision needed? ---
    if (retentionScore < RETENTION_THRESHOLD && conceptualLevel >= MASTERY_THRESHOLD) {
      action = 'REVISE';
      explanation = `Revise ${skill.name} because your retention score has declined over time, despite earlier mastery.`;
      priorityBonus += 15; // Revision of known concepts is high priority
    }
    // --- CHECK 2: Learn or Practice? ---
    else if (conceptualLevel < MASTERY_THRESHOLD) {
      action = 'LEARN';
      explanation = `Study ${skill.name} because your conceptual understanding is currently below the required threshold.`;
    } 
    else if (practicalLevel < MASTERY_THRESHOLD) {
      action = 'PRACTICE';
      explanation = `Practice ${skill.name} because you understand the concept but lack practical implementation readiness.`;
    }

    // Skip if mastered and no revision needed
    if (!action) continue;

    // --- PREREQUISITE CHECK ---
    const prereqStatus = await checkPrerequisites(learnerId, skill.id, MASTERY_THRESHOLD);
    
    if (!prereqStatus.isEligible) {
      // If the skill requires prerequisites we don't have, recommend repairing the prerequisite instead
      const blockingSkill = prereqStatus.missingPrerequisites[0]; // Just take the first one for the explanation
      action = 'REPAIR_PREREQUISITE';
      explanation = `Repair prerequisite '${blockingSkill.skillName}' before studying ${skill.name} because your mastery of it is insufficient.`;
      
      // Override the skill we are pointing the user to
      const actualBlockingSkill = skills.find(s => s.id === blockingSkill.skillId);
      if (!actualBlockingSkill) continue;
      
      recommendations.push({
        skillId: actualBlockingSkill.id,
        skillName: actualBlockingSkill.name,
        action: 'REPAIR_PREREQUISITE',
        priorityScore: calculateScore(actualBlockingSkill, 20), // High priority to unblock
        explanation
      });
      continue;
    }

    // --- SCORING ---
    // Unlocking value: How many other skills depend on this one?
    const unlockingValue = skill.dependents.length * 2;
    
    // Fit to time: If it takes longer than we have, penalize slightly (or strictly filter in strict mode)
    const timePenalty = skill.estimatedEffortMins > availableTimeMins ? 5 : 0;

    priorityBonus += unlockingValue - timePenalty;
    
    const finalScore = calculateScore(skill, priorityBonus);

    // Add to recommendations if it fits the time reasonably or is the absolute highest priority
    recommendations.push({
      skillId: skill.id,
      skillName: skill.name,
      action,
      priorityScore: finalScore,
      explanation
    });
  }

  // 4. Sort by highest priority first
  recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

  // Return the top recommendations (de-duplicated by skillId)
  const uniqueRecommendations = Array.from(new Map(recommendations.map(r => [r.skillId, r])).values());
  return uniqueRecommendations.slice(0, 5); 
}

function calculateScore(skill: Skill, bonus: number): number {
  // Base formula based on spec requirements
  const baseRelevance = skill.careerRelevance * 3; // e.g., 5 * 3 = 15
  const interviewRelevance = skill.interviewRelevance * 2; // e.g., 3 * 2 = 6
  
  // High difficulty slightly reduces immediate priority unless it's a prerequisite (handled by bonus)
  // to favor low-hanging fruit when appropriate.
  const difficultyPenalty = skill.difficulty * 0.5; 

  return baseRelevance + interviewRelevance - difficultyPenalty + bonus;
}
