import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data in correct order
  await prisma.prerequisite.deleteMany({});
  await prisma.resourceSkill.deleteMany({});
  await prisma.masteryState.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.assessmentResult.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.learner.deleteMany({});

  console.log('Seeding domains...');

  const domainDSA = await prisma.domain.create({ data: { name: 'DSA', description: 'Data Structures and Algorithms — the backbone of coding interviews.' } });
  const domainPythonSQL = await prisma.domain.create({ data: { name: 'Python + SQL', description: 'Core programming and database skills.' } });
  const domainDataAnalytics = await prisma.domain.create({ data: { name: 'Data Analytics / Data Science', description: 'Analytics, statistics, visualization, and ML.' } });
  const domainSystemDesign = await prisma.domain.create({ data: { name: 'System Design', description: 'High-level architecture, scalability, and distributed systems.' } });
  await prisma.domain.create({ data: { name: 'Placement', description: 'Readiness layer for campus/off-campus placements.' } });
  const domainAptitude = await prisma.domain.create({ data: { name: 'Aptitude', description: 'Quantitative, logical reasoning, and data interpretation.' } });

  console.log('Seeding skills...');

  // DSA
  const dsaArrays   = await prisma.skill.create({ data: { name: 'Arrays & Strings',              domainId: domainDSA.id,          difficulty: 1, careerRelevance: 5, interviewRelevance: 5, estimatedEffortMins: 90 } });
  const dsaLinkedList= await prisma.skill.create({ data: { name: 'Linked Lists',                  domainId: domainDSA.id,          difficulty: 2, careerRelevance: 4, interviewRelevance: 4, estimatedEffortMins: 90 } });
  const dsaRecursion = await prisma.skill.create({ data: { name: 'Recursion & Backtracking',      domainId: domainDSA.id,          difficulty: 3, careerRelevance: 4, interviewRelevance: 5, estimatedEffortMins: 120 } });
  const dsaSorting   = await prisma.skill.create({ data: { name: 'Sorting & Searching',           domainId: domainDSA.id,          difficulty: 2, careerRelevance: 4, interviewRelevance: 4, estimatedEffortMins: 90 } });
  const dsaTrees     = await prisma.skill.create({ data: { name: 'Trees & Binary Search Trees',   domainId: domainDSA.id,          difficulty: 3, careerRelevance: 5, interviewRelevance: 5, estimatedEffortMins: 150 } });
  const dsaGraphs    = await prisma.skill.create({ data: { name: 'Graphs (BFS/DFS)',              domainId: domainDSA.id,          difficulty: 4, careerRelevance: 5, interviewRelevance: 5, estimatedEffortMins: 180 } });
  const dsaDP        = await prisma.skill.create({ data: { name: 'Dynamic Programming',           domainId: domainDSA.id,          difficulty: 5, careerRelevance: 5, interviewRelevance: 5, estimatedEffortMins: 240 } });

  // Python + SQL
  const pyBasics     = await prisma.skill.create({ data: { name: 'Python Fundamentals',           domainId: domainPythonSQL.id,    difficulty: 1, careerRelevance: 5, interviewRelevance: 4, estimatedEffortMins: 120 } });
  const pyFunctions  = await prisma.skill.create({ data: { name: 'Python Functions & Scope',      domainId: domainPythonSQL.id,    difficulty: 2, careerRelevance: 5, interviewRelevance: 4, estimatedEffortMins: 90 } });
  const pyOOP        = await prisma.skill.create({ data: { name: 'Python OOP',                    domainId: domainPythonSQL.id,    difficulty: 3, careerRelevance: 4, interviewRelevance: 4, estimatedEffortMins: 120 } });
  const sqlBasics    = await prisma.skill.create({ data: { name: 'SQL Fundamentals',              domainId: domainPythonSQL.id,    difficulty: 1, careerRelevance: 5, interviewRelevance: 5, estimatedEffortMins: 90 } });
  const sqlAgg       = await prisma.skill.create({ data: { name: 'SQL Aggregation (GROUP BY)',    domainId: domainPythonSQL.id,    difficulty: 2, careerRelevance: 5, interviewRelevance: 4, estimatedEffortMins: 90 } });
  const sqlJoins     = await prisma.skill.create({ data: { name: 'SQL JOINs',                     domainId: domainPythonSQL.id,    difficulty: 3, careerRelevance: 5, interviewRelevance: 5, estimatedEffortMins: 120 } });
  const sqlWindow    = await prisma.skill.create({ data: { name: 'SQL Window Functions',          domainId: domainPythonSQL.id,    difficulty: 4, careerRelevance: 4, interviewRelevance: 5, estimatedEffortMins: 120 } });
  const sqlCTE       = await prisma.skill.create({ data: { name: 'SQL CTEs & Subqueries',         domainId: domainPythonSQL.id,    difficulty: 3, careerRelevance: 4, interviewRelevance: 4, estimatedEffortMins: 90 } });

  // Data Analytics
  const statBasics   = await prisma.skill.create({ data: { name: 'Statistics & Probability',     domainId: domainDataAnalytics.id,difficulty: 2, careerRelevance: 5, interviewRelevance: 4, estimatedEffortMins: 120 } });
  const pandas       = await prisma.skill.create({ data: { name: 'Pandas & Data Manipulation',   domainId: domainDataAnalytics.id,difficulty: 2, careerRelevance: 5, interviewRelevance: 4, estimatedEffortMins: 120 } });
  const eda          = await prisma.skill.create({ data: { name: 'Exploratory Data Analysis',    domainId: domainDataAnalytics.id,difficulty: 3, careerRelevance: 5, interviewRelevance: 4, estimatedEffortMins: 120 } });
  const mlBasics     = await prisma.skill.create({ data: { name: 'Machine Learning Fundamentals',domainId: domainDataAnalytics.id,difficulty: 3, careerRelevance: 4, interviewRelevance: 4, estimatedEffortMins: 150 } });

  // System Design
  await prisma.skill.create({ data: { name: 'System Design Fundamentals',  domainId: domainSystemDesign.id, difficulty: 3, careerRelevance: 4, interviewRelevance: 5, estimatedEffortMins: 120 } });
  await prisma.skill.create({ data: { name: 'Database Design & Indexing',  domainId: domainSystemDesign.id, difficulty: 3, careerRelevance: 4, interviewRelevance: 4, estimatedEffortMins: 120 } });

  // Aptitude
  const aptQuant     = await prisma.skill.create({ data: { name: 'Quantitative Aptitude',        domainId: domainAptitude.id,     difficulty: 2, careerRelevance: 4, interviewRelevance: 3, estimatedEffortMins: 90 } });
  const aptLR        = await prisma.skill.create({ data: { name: 'Logical Reasoning',             domainId: domainAptitude.id,     difficulty: 2, careerRelevance: 4, interviewRelevance: 3, estimatedEffortMins: 90 } });

  console.log('Seeding prerequisites...');

  await prisma.prerequisite.createMany({ data: [
    { dependentSkillId: dsaRecursion.id,  prerequisiteSkillId: dsaArrays.id },
    { dependentSkillId: dsaTrees.id,      prerequisiteSkillId: dsaLinkedList.id },
    { dependentSkillId: dsaGraphs.id,     prerequisiteSkillId: dsaTrees.id },
    { dependentSkillId: dsaDP.id,         prerequisiteSkillId: dsaRecursion.id },
    { dependentSkillId: pyFunctions.id,   prerequisiteSkillId: pyBasics.id },
    { dependentSkillId: pyOOP.id,         prerequisiteSkillId: pyFunctions.id },
    { dependentSkillId: sqlAgg.id,        prerequisiteSkillId: sqlBasics.id },
    { dependentSkillId: sqlJoins.id,      prerequisiteSkillId: sqlBasics.id },
    { dependentSkillId: sqlWindow.id,     prerequisiteSkillId: sqlJoins.id },
    { dependentSkillId: sqlWindow.id,     prerequisiteSkillId: sqlAgg.id },
    { dependentSkillId: sqlCTE.id,        prerequisiteSkillId: sqlJoins.id },
    { dependentSkillId: pandas.id,        prerequisiteSkillId: pyBasics.id },
    { dependentSkillId: eda.id,           prerequisiteSkillId: pandas.id },
    { dependentSkillId: mlBasics.id,      prerequisiteSkillId: statBasics.id },
    { dependentSkillId: mlBasics.id,      prerequisiteSkillId: pandas.id },
  ]});

  console.log('Seeding questions...');

  await prisma.question.createMany({ data: [
    // Python Fundamentals
    { skillId: pyBasics.id, text: 'What is the output of: print(type([]))?', type: 'MultipleChoice', difficulty: 1 },
    { skillId: pyBasics.id, text: 'What is the difference between a list and a tuple in Python?', type: 'OpenEnded', difficulty: 1 },
    { skillId: pyBasics.id, text: 'Write a Python loop to print all even numbers from 1 to 20.', type: 'Coding', difficulty: 1 },
    { skillId: pyBasics.id, text: 'What does the "is" operator check? How does it differ from "=="?', type: 'OpenEnded', difficulty: 2 },
    { skillId: pyBasics.id, text: 'Write a dictionary comprehension that squares each value.', type: 'Coding', difficulty: 2 },
    // Python Functions
    { skillId: pyFunctions.id, text: 'What is the difference between *args and **kwargs?', type: 'OpenEnded', difficulty: 2 },
    { skillId: pyFunctions.id, text: 'Write a decorator that logs the execution time of any function.', type: 'Coding', difficulty: 3 },
    { skillId: pyFunctions.id, text: 'What is a lambda function? When would you use one?', type: 'OpenEnded', difficulty: 1 },
    { skillId: pyFunctions.id, text: 'Explain closures in Python with an example.', type: 'OpenEnded', difficulty: 3 },
    // SQL Basics
    { skillId: sqlBasics.id, text: 'Write a query to get all employees with salary > 50000 ordered by name.', type: 'Coding', difficulty: 1 },
    { skillId: sqlBasics.id, text: 'What is the difference between WHERE and HAVING?', type: 'OpenEnded', difficulty: 2 },
    { skillId: sqlBasics.id, text: 'What does SELECT DISTINCT do? Give an example.', type: 'OpenEnded', difficulty: 1 },
    { skillId: sqlBasics.id, text: 'Write a query using LIKE to find all names starting with "A".', type: 'Coding', difficulty: 1 },
    // SQL JOINs
    { skillId: sqlJoins.id, text: 'What is the difference between INNER JOIN and LEFT JOIN?', type: 'OpenEnded', difficulty: 2 },
    { skillId: sqlJoins.id, text: 'Write a query to find customers who have NOT placed any orders.', type: 'Coding', difficulty: 3 },
    { skillId: sqlJoins.id, text: 'When would you use a SELF JOIN? Give a practical example.', type: 'OpenEnded', difficulty: 3 },
    { skillId: sqlJoins.id, text: 'Write a query to get department name with each employee using JOIN.', type: 'Coding', difficulty: 2 },
    // DSA Arrays
    { skillId: dsaArrays.id, text: 'Given an array, find two numbers that add up to a target sum.', type: 'Coding', difficulty: 2 },
    { skillId: dsaArrays.id, text: 'What is the time complexity of accessing an array element by index?', type: 'MultipleChoice', difficulty: 1 },
    { skillId: dsaArrays.id, text: 'Reverse an array in-place without extra space.', type: 'Coding', difficulty: 1 },
    { skillId: dsaArrays.id, text: 'Find the maximum subarray sum (Kadane Algorithm). Explain your approach.', type: 'Coding', difficulty: 3 },
    { skillId: dsaArrays.id, text: 'What is the sliding window technique? Give an example problem.', type: 'OpenEnded', difficulty: 2 },
    // Statistics
    { skillId: statBasics.id, text: 'What is the difference between mean, median and mode?', type: 'OpenEnded', difficulty: 1 },
    { skillId: statBasics.id, text: 'What is standard deviation and why does it matter?', type: 'OpenEnded', difficulty: 2 },
    { skillId: statBasics.id, text: 'What is the Central Limit Theorem and why does it matter?', type: 'OpenEnded', difficulty: 3 },
    // Aptitude
    { skillId: aptQuant.id, text: 'A train travels 60km/h. How long to travel 150km?', type: 'MultipleChoice', difficulty: 1 },
    { skillId: aptQuant.id, text: 'A can do a job in 10 days, B in 15 days. Together, how long?', type: 'MultipleChoice', difficulty: 2 },
    { skillId: aptLR.id, text: 'All cats are animals. Some animals are dogs. Some cats are dogs — True or False?', type: 'MultipleChoice', difficulty: 2 },
  ]});

  console.log('Seeding learner...');
  await prisma.learner.create({ data: { name: 'You', email: 'learner@adaptivecareer.app' } });

  console.log('✅ Seeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
