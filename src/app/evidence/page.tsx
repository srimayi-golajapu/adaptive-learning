"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EvidenceEntry {
  skillName: string;
  evidenceType: string;
  notes: string;
  url: string;
}

const EVIDENCE_TYPES = [
  "Project (Tutorial/Guided)",
  "Project (Independent)",
  "Assessment Score",
  "Certificate",
  "LeetCode Submission",
  "GitHub Repo",
  "Kaggle Notebook",
  "Other",
];

export default function EvidencePage() {
  const [entries, setEntries] = useState<EvidenceEntry[]>([]);
  const [form, setForm] = useState<EvidenceEntry>({ skillName: '', evidenceType: '', notes: '', url: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.skillName || !form.evidenceType) return;
    setEntries(prev => [form, ...prev]);
    setForm({ skillName: '', evidenceType: '', notes: '', url: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">📎 Evidence & Proof</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Log external proof of skills — projects, submissions, scores. Evidence informs job readiness but does not override assessment results.
        </p>
      </div>

      {/* NOTICE */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>Important:</strong> Evidence supplements your mastery data — it does not automatically increase your conceptual or practical mastery scores. 
        Using a library in a project ≠ mastery. Take a <a href="/practice" className="underline">quiz</a> to formally update mastery.
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow p-6 space-y-4">
        <h2 className="font-bold text-lg">Add Evidence</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Skill / Topic this demonstrates</label>
          <input
            type="text"
            placeholder="e.g. Python Pandas, SQL JOINs, Binary Search..."
            value={form.skillName}
            onChange={e => setForm({ ...form, skillName: e.target.value })}
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type of Evidence</label>
          <select
            value={form.evidenceType}
            onChange={e => setForm({ ...form, evidenceType: e.target.value })}
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">— Select type —</option>
            {EVIDENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Link / URL (optional)</label>
          <input
            type="url"
            placeholder="https://github.com/yourrepo or https://leetcode.com/..."
            value={form.url}
            onChange={e => setForm({ ...form, url: e.target.value })}
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes / Self-assessment</label>
          <textarea
            placeholder="What did you build / solve? Was it guided or independent? What was your score?"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition"
        >
          Save Evidence
        </button>

        {submitted && (
          <p className="text-green-600 dark:text-green-400 text-sm text-center font-medium">
            ✅ Evidence saved! Great work documenting your progress.
          </p>
        )}
      </form>

      {/* EVIDENCE LOG */}
      {entries.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-3">Evidence Log</h2>
          <div className="space-y-3">
            {entries.map((e, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-semibold">{e.skillName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{e.evidenceType}</p>
                    {e.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{e.notes}</p>}
                    {e.url && <a href={e.url} target="_blank" className="text-blue-500 text-xs underline mt-1 block">{e.url}</a>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">Just now</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
