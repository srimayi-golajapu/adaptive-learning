import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PrerequisiteStatus {
  isEligible: boolean;
  missingPrerequisites: {
    skillId: string;
    skillName: string;
    currentConceptualLevel: number;
    requiredLevel: number; // e.g., 0.8
  }[];
}

/**
 * Checks if a learner has fulfilled the prerequisites for a specific skill.
 * For a prerequisite to be fulfilled, the learner's mastery level must be 
 * above a certain threshold (e.g. 0.8).
 */
export async function checkPrerequisites(
  learnerId: string,
  targetSkillId: string,
  threshold: number = 0.8
): Promise<PrerequisiteStatus> {
  // Fetch the prerequisites for the target skill
  const prerequisites = await prisma.prerequisite.findMany({
    where: { dependentSkillId: targetSkillId },
    include: {
      prerequisiteSkill: true
    }
  });

  if (prerequisites.length === 0) {
    return { isEligible: true, missingPrerequisites: [] };
  }

  // Fetch the learner's mastery states for the prerequisite skills
  const prereqSkillIds = prerequisites.map(p => p.prerequisiteSkillId);
  
  const masteryStates = await prisma.masteryState.findMany({
    where: {
      learnerId: learnerId,
      skillId: { in: prereqSkillIds }
    }
  });

  const masteryMap = new Map<string, number>();
  for (const state of masteryStates) {
    // For simplicity, we'll check conceptualLevel here, but we can combine practical too
    masteryMap.set(state.skillId, state.conceptualLevel);
  }

  const missingPrerequisites = [];

  for (const prereq of prerequisites) {
    if (!prereq.isHardRequirement) continue;
    
    const currentLevel = masteryMap.get(prereq.prerequisiteSkillId) || 0;
    
    if (currentLevel < threshold) {
      missingPrerequisites.push({
        skillId: prereq.prerequisiteSkillId,
        skillName: prereq.prerequisiteSkill.name,
        currentConceptualLevel: currentLevel,
        requiredLevel: threshold
      });
    }
  }

  return {
    isEligible: missingPrerequisites.length === 0,
    missingPrerequisites
  };
}
