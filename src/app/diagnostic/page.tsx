import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function DiagnosticPage() {
  const learner = await prisma.learner.findFirst();
  const domains = await prisma.domain.findMany({ include: { skills: true } });

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">🔬 Diagnostic</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Run a domain diagnostic to let the engine assess your baseline knowledge. It will skip material you already know.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>How it works:</strong> You'll answer questions spanning different difficulty levels for a domain. 
        Your results initialize your mastery state — so you won't be forced through beginner material you already know.
      </div>

      <section className="space-y-4">
        <h2 className="font-bold text-lg">Select a Domain to Diagnose</h2>
        {domains.map(domain => (
          <div key={domain.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base">{domain.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{domain.description}</p>
              <p className="text-xs text-gray-400 mt-1">{domain.skills.length} skills in this domain</p>
            </div>
            {learner ? (
              <Link
                href={`/practice?domainId=${domain.id}`}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition"
              >
                Start Diagnostic →
              </Link>
            ) : (
              <span className="text-gray-400 text-sm">No learner found</span>
            )}
          </div>
        ))}
      </section>

      <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 text-sm text-gray-600 dark:text-gray-400">
        <strong className="text-gray-800 dark:text-gray-200">After the diagnostic:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Skills you know well will be marked as high mastery — you won't revisit them.</li>
          <li>Weak spots will be flagged and prioritized in your Next Best Action queue.</li>
          <li>Prerequisites will be checked — you won't be pushed into advanced topics prematurely.</li>
        </ul>
      </div>
    </div>
  );
}
