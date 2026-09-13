import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function RevisionPage() {
  const learner = await prisma.learner.findFirst();

  if (!learner) {
    return <div className="p-8 text-gray-500">No learner found. Run the seed script first.</div>;
  }

  const masteryStates = await prisma.masteryState.findMany({
    where: { learnerId: learner.id },
    include: { skill: { include: { domain: true } } },
    orderBy: { retentionScore: 'asc' }
  });

  const revisionDue = masteryStates.filter(m => m.retentionScore < 0.6 && m.conceptualLevel >= 0.4);
  const upcomingSoon = masteryStates.filter(m => m.retentionScore >= 0.6 && m.retentionScore < 0.8 && m.conceptualLevel >= 0.4);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">🔁 Revision Queue</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Spaced-repetition tracking. Retention scores decay over time — revise before you forget.
        </p>
      </div>

      {/* DUE NOW */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-red-600 dark:text-red-400">🔴 Due Now ({revisionDue.length})</h2>
        {revisionDue.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6 text-gray-400 italic text-sm">
            Nothing due for revision right now. Great job staying on top!
          </div>
        ) : (
          <div className="space-y-3">
            {revisionDue.map(item => {
              const retention = Math.round(item.retentionScore * 100);
              const lastDate = item.lastAssessedAt ? new Date(item.lastAssessedAt).toLocaleDateString() : 'Never';
              return (
                <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.skill.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{item.skill.domain.name}</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Retention: <strong className="text-red-500">{retention}%</strong></span>
                      <span>Conceptual: <strong>{Math.round(item.conceptualLevel * 100)}%</strong></span>
                      <span>Last studied: {lastDate}</span>
                    </div>
                    <div className="mt-2 w-full max-w-xs">
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                        <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${retention}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/session?learnerId=${learner.id}&skillId=${item.skillId}&actionType=REVISE`}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-lg transition"
                    >
                      Revise Now
                    </Link>
                    <Link
                      href={`/practice?skillId=${item.skillId}`}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg transition"
                    >
                      Quick Quiz
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* COMING UP SOON */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-yellow-600 dark:text-yellow-400">🟡 Coming Up Soon ({upcomingSoon.length})</h2>
        {upcomingSoon.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6 text-gray-400 italic text-sm">
            Nothing else approaching revision threshold.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSoon.map(item => {
              const retention = Math.round(item.retentionScore * 100);
              return (
                <div key={item.id} className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 p-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{item.skill.name}</span>
                    <span className="text-gray-400 text-xs">{item.skill.domain.name}</span>
                  </div>
                  <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{retention}% retention</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-5 text-sm text-blue-800 dark:text-blue-300">
        <strong>How the retention engine works:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Each skill gets a <strong>retention score</strong> (0–100%) that decays over time like the Ebbinghaus forgetting curve.</li>
          <li>Higher mastery = slower decay. Low mastery skills decay faster.</li>
          <li>When retention drops below <strong>60%</strong>, it appears in this queue.</li>
          <li>Running a revision session resets retention to 100%.</li>
        </ul>
      </section>
    </div>
  );
}
