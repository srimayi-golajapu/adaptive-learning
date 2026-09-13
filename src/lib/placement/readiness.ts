import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ReadinessReport {
  overallPlacementReadiness: number; // 0.0 to 1.0
  knowledgeReadiness: number;
  codingAssessmentReadiness: number;
  technicalInterviewReadiness: number;
  gapAnalysis: {
    skillId: string;
    skillName: string;
    gap: number;
    reason: string;
  }[];
}

/**
 * Calculates the learner's readiness for their target career 
 * by aggregating mastery states against the career target requirements.
 */
export async function calculatePlacementReadiness(learnerId: string): Promise<ReadinessReport> {
  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    include: { careerTarget: true }
  });

  if (!learner) throw new Error('Learner not found');

  // If no specific career target is set, we still evaluate baseline against highly relevant skills
  // In a full implementation, CareerTarget would map explicitly to required skills.
  
  // Fetch all relevant skills (e.g., careerRelevance >= 3)
  const requiredSkills = await prisma.skill.findMany({
    where: { careerRelevance: { gte: 3 } },
    include: { domain: true }
  });

  const masteryStates = await prisma.masteryState.findMany({
    where: { learnerId }
  });
  
  const masteryMap = new Map(masteryStates.map(m => [m.skillId, m]));

  let totalKnowledgeRequired = 0;
  let earnedKnowledge = 0;

  let totalCodingRequired = 0;
  let earnedCoding = 0;

  let totalInterviewRequired = 0;
  let earnedInterview = 0;

  const gapAnalysis = [];

  for (const skill of requiredSkills) {
    const mastery = masteryMap.get(skill.id);
    const conceptualLevel = mastery?.conceptualLevel || 0;
    const practicalLevel = mastery?.practicalLevel || 0;
    
    // Knowledge Readiness (Conceptual focus weighted by career relevance)
    const knowledgeWeight = skill.careerRelevance;
    totalKnowledgeRequired += knowledgeWeight;
    earnedKnowledge += (conceptualLevel * knowledgeWeight);

    // Coding Assessment Readiness (Practical focus, heavy on DSA / Programming)
    if (skill.domain.name === 'DSA' || skill.domain.name === 'Python + SQL') {
      const codingWeight = skill.careerRelevance;
      totalCodingRequired += codingWeight;
      earnedCoding += (practicalLevel * codingWeight);
    }

    // Interview Readiness (Conceptual + Practical weighted by interviewRelevance)
    if (skill.interviewRelevance >= 3) {
      const interviewWeight = skill.interviewRelevance;
      totalInterviewRequired += interviewWeight;
      // Interviews require both conceptual understanding and practical communication
      const blendedLevel = (conceptualLevel * 0.4) + (practicalLevel * 0.6);
      earnedInterview += (blendedLevel * interviewWeight);
    }

    // Calculate critical gaps (e.g., high relevance, low mastery)
    if (skill.careerRelevance >= 4 && (conceptualLevel < 0.6 || practicalLevel < 0.6)) {
      gapAnalysis.push({
        skillId: skill.id,
        skillName: skill.name,
        gap: 1.0 - Math.max(conceptualLevel, practicalLevel),
        reason: `Critical requirement for target role (Relevance: ${skill.careerRelevance}/5) but mastery is low.`
      });
    }
  }

  // Calculate final ratios (default to 0 if no requirements found)
  const knowledgeReadiness = totalKnowledgeRequired > 0 ? (earnedKnowledge / totalKnowledgeRequired) : 0;
  const codingAssessmentReadiness = totalCodingRequired > 0 ? (earnedCoding / totalCodingRequired) : 0;
  const technicalInterviewReadiness = totalInterviewRequired > 0 ? (earnedInterview / totalInterviewRequired) : 0;

  // Overall Readiness is a weighted average
  const overallPlacementReadiness = 
    (knowledgeReadiness * 0.3) + 
    (codingAssessmentReadiness * 0.3) + 
    (technicalInterviewReadiness * 0.4);

  // Sort gaps by severity
  gapAnalysis.sort((a, b) => b.gap - a.gap);

  return {
    overallPlacementReadiness,
    knowledgeReadiness,
    codingAssessmentReadiness,
    technicalInterviewReadiness,
    // Return top 5 most critical gaps holding the user back
    gapAnalysis: gapAnalysis.slice(0, 5) 
  };
}
