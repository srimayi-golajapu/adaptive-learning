import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function ProgressPage() {
  const learner = await prisma.learner.findFirst({
    include: { careerTarget: true }
  });

  if (!learner) {
    return <div className="p-8 text-gray-500">Run the seed script to get started.</div>;
  }

  const masteryStates = await prisma.masteryState.findMany({
    where: { learnerId: learner.id },
    include: { skill: { include: { domain: true } } },
  });

  const attempts = await prisma.attempt.findMany({
    where: { learnerId: learner.id },
    include: { question: { include: { skill: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const totalAttempts = await prisma.attempt.count({ where: { learnerId: learner.id } });
  const correctAttempts = await prisma.attempt.count({ where: { learnerId: learner.id, isCorrect: true } });
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  // Group mastery by domain
  const byDomain: Record<string, typeof masteryStates> = {};
  for (const m of masteryStates) {
    const d = m.skill.domain.name;
    if (!byDomain[d]) byDomain[d] = [];
    byDomain[d].push(m);
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">📈 Progress</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed mastery tracking and attempt history.</p>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Attempts', value: totalAttempts, color: 'text-blue-600' },
          { label: 'Correct Answers', value: correctAttempts, color: 'text-green-600' },
          { label: 'Overall Accuracy', value: `${accuracy.toFixed(0)}%`, color: 'text-purple-600' },
          { label: 'Skills Tracked', value: masteryStates.length, color: 'text-orange-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* MASTERY BY DOMAIN */}
      <section>
        <h2 className="text-lg font-bold mb-4">Mastery by Domain</h2>
        {Object.entries(byDomain).map(([domain, items]) => {
          const avgConceptual = items.reduce((s, m) => s + m.conceptualLevel, 0) / items.length;
          const avgPractical = items.reduce((s, m) => s + m.practicalLevel, 0) / items.length;
          return (
            <div key={domain} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow mb-4">
              <div className="px-5 py-4 border-b dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-base">{domain}</h3>
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Conceptual avg: <strong className="text-gray-800 dark:text-gray-200">{(avgConceptual * 100).toFixed(0)}%</strong></span>
                  <span>Practical avg: <strong className="text-gray-800 dark:text-gray-200">{(avgPractical * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
              <div className="divide-y dark:divide-gray-800">
                {items.map(m => (
                  <div key={m.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <span className="font-medium text-sm">{m.skill.name}</span>
                    <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-400 sm:text-right">
                      <span>💡 Conceptual: <strong className="text-gray-800 dark:text-gray-200">{(m.conceptualLevel * 100).toFixed(0)}%</strong></span>
                      <span>⚙️ Practical: <strong className="text-gray-800 dark:text-gray-200">{(m.practicalLevel * 100).toFixed(0)}%</strong></span>
                      <span>🧠 Retention: <strong className={m.retentionScore < 0.6 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}>{(m.retentionScore * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {masteryStates.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6 text-gray-400 italic text-sm">
            No mastery data yet. Start a session or take a quiz to begin tracking.
          </div>
        )}
      </section>

      {/* RECENT ATTEMPTS */}
      <section>
        <h2 className="text-lg font-bold mb-4">Recent Attempts</h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow divide-y dark:divide-gray-800">
          {attempts.length === 0 && (
            <div className="p-6 text-gray-400 italic text-sm">No attempts yet. Go to Practice to start a quiz.</div>
          )}
          {attempts.map((attempt, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{attempt.question.skill.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{attempt.question.text}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <span className={`font-bold ${attempt.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                  {attempt.isCorrect ? '✓ Correct' : '✗ Wrong'}
                </span>
                {attempt.failureType && (
                  <p className="text-xs text-gray-400">{attempt.failureType.replace(/_/g, ' ')}</p>
                )}
                <p className="text-xs text-gray-400">{new Date(attempt.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
