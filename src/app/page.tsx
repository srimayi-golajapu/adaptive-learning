import { PrismaClient } from '@prisma/client';
import { getNextBestAction } from '@/lib/recommendation/priority-engine';
import { calculatePlacementReadiness } from '@/lib/placement/readiness';
import Link from 'next/link';

const prisma = new PrismaClient();

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(100, value * 100).toFixed(0)}%` }} />
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    LEARN: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
    PRACTICE: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200',
    REVISE: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
    ASSESS: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200',
    REPAIR_PREREQUISITE: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider ${colors[action] || 'bg-gray-100 text-gray-700'}`}>
      {action.replace('_', ' ')}
    </span>
  );
}

export default async function Dashboard() {
  const learner = await prisma.learner.findFirst({
    include: { careerTarget: true, masteryStates: { include: { skill: true } } }
  });

  if (!learner) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
        <p className="text-gray-500">Please run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npx prisma db seed</code> to get started.</p>
      </div>
    );
  }

  const recommendations = await getNextBestAction(learner.id, 60);
  const topAction = recommendations[0] || null;
  const secondaryActions = recommendations.slice(1, 5);
  const readiness = await calculatePlacementReadiness(learner.id);

  // Skills needing revision (retentionScore < 0.6 and conceptualLevel >= 0.5)
  const revisionDue = learner.masteryStates.filter(
    m => m.retentionScore < 0.6 && m.conceptualLevel >= 0.5
  );

  // Recently improved (lastAssessedAt within 24h and conceptualLevel > 0)
  const recentlyImproved = learner.masteryStates
    .filter(m => m.lastAssessedAt && new Date().getTime() - new Date(m.lastAssessedAt).getTime() < 86400000 && m.conceptualLevel > 0)
    .slice(0, 3);

  // Skill coverage stats
  const totalSkills = await prisma.skill.count();
  const masteredSkills = learner.masteryStates.filter(m => m.conceptualLevel >= 0.8).length;
  const inProgressSkills = learner.masteryStates.filter(m => m.conceptualLevel > 0 && m.conceptualLevel < 0.8).length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* WELCOME BANNER */}
      <div>
        <h1 className="text-3xl font-extrabold">Good morning, {learner.name} 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {learner.careerTarget ? `Target Role: ${learner.careerTarget.title}` : 'No career target set — '}
          {!learner.careerTarget && <Link href="/settings" className="text-blue-600 underline">set one now</Link>}
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Skills Mastered', value: masteredSkills, total: totalSkills, color: 'text-green-600' },
          { label: 'In Progress', value: inProgressSkills, total: totalSkills, color: 'text-blue-600' },
          { label: 'Revision Due', value: revisionDue.length, total: null, color: 'text-yellow-600' },
          { label: 'Placement Ready', value: `${(readiness.overallPlacementReadiness * 100).toFixed(0)}%`, total: null, color: 'text-purple-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>
              {stat.value}{stat.total !== null ? <span className="text-sm text-gray-400 font-normal">/{stat.total}</span> : ''}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: NEXT BEST ACTION + QUEUE */}
        <div className="lg:col-span-2 space-y-6">

          {/* NEXT BEST ACTION */}
          <section>
            <h2 className="text-lg font-bold mb-3">⚡ Next Best Action</h2>
            {topAction ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow border dark:border-gray-800 p-5 border-l-4 border-blue-500">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <ActionBadge action={topAction.action} />
                    <h3 className="text-xl font-bold mt-2 mb-1">{topAction.skillName}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{topAction.explanation}</p>
                  </div>
                  <Link
                    href={`/session?learnerId=${learner.id}&skillId=${topAction.skillId}&actionType=${topAction.action}`}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm text-center"
                  >
                    Start →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 text-gray-500 italic border dark:border-gray-800">
                🎉 All caught up! Take a <Link href="/diagnostic" className="underline text-blue-500">diagnostic</Link> or <Link href="/practice" className="underline text-blue-500">practice</Link>.
              </div>
            )}
          </section>

          {/* UP NEXT QUEUE */}
          {secondaryActions.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">📋 Up Next Queue</h2>
              <div className="space-y-2">
                {secondaryActions.map((action, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono text-sm w-5">{idx + 2}.</span>
                      <div>
                        <ActionBadge action={action.action} />
                        <p className="font-semibold text-sm mt-0.5">{action.skillName}</p>
                      </div>
                    </div>
                    <Link
                      href={`/session?learnerId=${learner.id}&skillId=${action.skillId}&actionType=${action.action}`}
                      className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline shrink-0"
                    >
                      Start →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* REVISION DUE */}
          {revisionDue.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">🔁 Revision Due</h2>
              <div className="space-y-2">
                {revisionDue.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/40 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{item.skill.name}</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                        Retention: {(item.retentionScore * 100).toFixed(0)}% — fading
                      </p>
                    </div>
                    <Link
                      href={`/session?learnerId=${learner.id}&skillId=${item.skillId}&actionType=REVISE`}
                      className="text-yellow-700 dark:text-yellow-400 text-sm font-semibold hover:underline"
                    >
                      Revise →
                    </Link>
                  </div>
                ))}
                {revisionDue.length > 4 && (
                  <Link href="/revision" className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1">
                    View all {revisionDue.length} items →
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* CRITICAL WEAKNESSES */}
          {readiness.gapAnalysis.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">⚠️ Critical Gaps Blocking Your Target</h2>
              <div className="space-y-2">
                {readiness.gapAnalysis.map((gap, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-sm">
                    <strong className="text-red-700 dark:text-red-400">{gap.skillName}</strong>
                    <span className="text-red-600 dark:text-red-300"> — {gap.reason}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT: READINESS + RECENT */}
        <div className="space-y-6">

          {/* JOB READINESS */}
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow border dark:border-gray-800 p-5">
            <h2 className="font-bold mb-4 text-base">🎯 Job Readiness</h2>
            <div className="space-y-4">
              {[
                { label: 'Overall', value: readiness.overallPlacementReadiness, color: 'bg-green-500' },
                { label: 'Conceptual', value: readiness.knowledgeReadiness, color: 'bg-blue-400' },
                { label: 'Practical / Coding', value: readiness.codingAssessmentReadiness, color: 'bg-orange-400' },
                { label: 'Interview Ready', value: readiness.technicalInterviewReadiness, color: 'bg-purple-400' },
              ].map((r, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{r.label}</span>
                    <span className="font-bold">{(r.value * 100).toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={r.value} color={r.color} />
                </div>
              ))}
            </div>
            <Link href="/placement" className="block text-center text-xs text-blue-500 hover:underline mt-4">
              View full placement report →
            </Link>
          </section>

          {/* RECENTLY IMPROVED */}
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow border dark:border-gray-800 p-5">
            <h2 className="font-bold mb-3 text-base">✅ Recently Improved</h2>
            {recentlyImproved.length > 0 ? (
              <ul className="space-y-2">
                {recentlyImproved.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.skill.name}</span>
                    <span className="text-green-600 font-bold">{(item.conceptualLevel * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm italic">No activity in the last 24h.</p>
            )}
          </section>

          {/* QUICK ACTIONS */}
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow border dark:border-gray-800 p-5">
            <h2 className="font-bold mb-3 text-base">⚡ Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: '/diagnostic', label: 'Run a Diagnostic', icon: '🔬' },
                { href: '/practice', label: 'Start a Quiz', icon: '✏️' },
                { href: '/revision', label: 'Revision Queue', icon: '🔁' },
                { href: '/evidence', label: 'Upload Proof', icon: '📎' },
                { href: '/settings', label: 'Set Career Target', icon: '⚙️' },
              ].map((a, i) => (
                <Link key={i} href={a.href}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                >
                  <span>{a.icon}</span>{a.label}
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
