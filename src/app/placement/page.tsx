import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { calculatePlacementReadiness } from '@/lib/placement/readiness';

const prisma = new PrismaClient();

function RadialProgress({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-red-400';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-4xl font-extrabold ${color}`}>{pct}%</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{label}</div>
    </div>
  );
}

export default async function PlacementPage() {
  const learner = await prisma.learner.findFirst({ include: { careerTarget: true } });

  if (!learner) {
    return <div className="p-8 text-gray-500">Run the seed script to get started.</div>;
  }

  const readiness = await calculatePlacementReadiness(learner.id);

  const allMastery = await prisma.masteryState.findMany({
    where: { learnerId: learner.id },
    include: { skill: { include: { domain: true } } },
    orderBy: { conceptualLevel: 'desc' }
  });

  const strong = allMastery.filter(m => m.conceptualLevel >= 0.7);
  const weak = allMastery.filter(m => m.conceptualLevel > 0 && m.conceptualLevel < 0.5);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">🎯 Placement & Interview Readiness</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Aggregated readiness score across all domains for your target role.
          {learner.careerTarget && <> Target: <strong>{learner.careerTarget.title}</strong></>}
        </p>
      </div>

      {/* READINESS SCORES */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow p-6">
        <h2 className="font-bold text-lg mb-6 border-b dark:border-gray-800 pb-2">Readiness Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <RadialProgress value={readiness.overallPlacementReadiness} label="Overall Placement" />
          <RadialProgress value={readiness.knowledgeReadiness} label="Conceptual Knowledge" />
          <RadialProgress value={readiness.codingAssessmentReadiness} label="Coding Assessment" />
          <RadialProgress value={readiness.technicalInterviewReadiness} label="Technical Interview" />
        </div>
      </div>

      {/* CRITICAL GAPS */}
      <section>
        <h2 className="font-bold text-lg mb-3">⚠️ Critical Gaps Holding You Back</h2>
        {readiness.gapAnalysis.length > 0 ? (
          <div className="space-y-3">
            {readiness.gapAnalysis.map((gap, i) => (
              <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400">{gap.skillName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{gap.reason}</p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Gap severity: {(gap.gap * 100).toFixed(0)}%</p>
                </div>
                <Link
                  href={`/skills`}
                  className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition"
                >
                  Fix Now →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-xl p-6 text-green-700 dark:text-green-400 text-sm">
            🎉 No critical gaps detected! Keep practicing and revising to maintain your edge.
          </div>
        )}
      </section>

      {/* STRONG AREAS */}
      <section>
        <h2 className="font-bold text-lg mb-3">💪 Strengths</h2>
        {strong.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strong.map((m, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg p-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">{m.skill.name}</p>
                  <p className="text-xs text-gray-400">{m.skill.domain.name}</p>
                </div>
                <span className="text-green-600 dark:text-green-400 font-bold">{Math.round(m.conceptualLevel * 100)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No skills mastered yet. Keep going!</p>
        )}
      </section>

      {/* WEAK AREAS */}
      {weak.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-3">📉 Weak Areas Needing Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {weak.map((m, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg p-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">{m.skill.name}</p>
                  <p className="text-xs text-gray-400">{m.skill.domain.name}</p>
                </div>
                <span className="text-red-500 dark:text-red-400 font-bold">{Math.round(m.conceptualLevel * 100)}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CHECKLIST */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow p-5">
        <h2 className="font-bold text-lg mb-4">✅ Pre-Placement Checklist</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: 'DSA — Arrays, Strings, Recursion', done: false },
            { label: 'DSA — Trees, Graphs, DP', done: false },
            { label: 'Python — Problem-solving fluency', done: false },
            { label: 'SQL — JOINs, Window Functions, CTEs', done: false },
            { label: 'Aptitude — Quant, LR, DI', done: false },
            { label: 'Mock Interviews (at least 3)', done: false },
            { label: 'Projects reviewed and ready to explain', done: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${item.done ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
              <span>{item.done ? '✅' : '⬜'}</span>
              <span className={item.done ? 'line-through text-gray-400' : ''}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
