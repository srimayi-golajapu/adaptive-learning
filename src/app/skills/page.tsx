import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

function MasteryBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.min(100, Math.round(value * 100));
  const color = pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1 text-gray-500 dark:text-gray-400"><span>{label}</span><span>{pct}%</span></div>}
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function SkillsPage() {
  const learner = await prisma.learner.findFirst();
  
  const domains = await prisma.domain.findMany({
    include: {
      skills: {
        include: {
          prerequisites: { include: { prerequisiteSkill: true } },
          dependents: { include: { dependentSkill: true } },
        }
      }
    }
  });

  const masteryStates = learner ? await prisma.masteryState.findMany({
    where: { learnerId: learner.id }
  }) : [];
  
  const masteryMap = new Map(masteryStates.map(m => [m.skillId, m]));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">🗺️ Skill Graph</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your complete curriculum map — mastery by skill and domain.</p>
      </div>

      {domains.map(domain => (
        <section key={domain.id} className="bg-white dark:bg-gray-900 rounded-xl shadow border dark:border-gray-800">
          <div className="px-6 py-4 border-b dark:border-gray-800">
            <h2 className="text-xl font-bold">{domain.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{domain.description}</p>
          </div>
          <div className="divide-y dark:divide-gray-800">
            {domain.skills.map(skill => {
              const mastery = masteryMap.get(skill.id);
              const conceptual = mastery?.conceptualLevel || 0;
              const practical = mastery?.practicalLevel || 0;
              const retention = mastery?.retentionScore || 1;
              const status = conceptual >= 0.8 ? 'Mastered' : conceptual > 0 ? 'In Progress' : 'Not Started';
              const statusColor = {
                'Mastered': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                'Not Started': 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
              }[status];

              return (
                <div key={skill.id} className="px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{skill.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{status}</span>
                        <span className="text-xs text-gray-400">Difficulty: {'⭐'.repeat(skill.difficulty)}</span>
                      </div>
                      {skill.prerequisites.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Requires: {skill.prerequisites.map(p => p.prerequisiteSkill.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="sm:w-48 space-y-1.5">
                      <MasteryBar value={conceptual} label="Conceptual" />
                      <MasteryBar value={practical} label="Practical" />
                      {mastery && <MasteryBar value={retention} label="Retention" />}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {learner && (
                        <>
                          <Link
                            href={`/session?learnerId=${learner.id}&skillId=${skill.id}&actionType=LEARN`}
                            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                          >
                            Study
                          </Link>
                          <Link
                            href={`/practice?skillId=${skill.id}`}
                            className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition"
                          >
                            Quiz
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
