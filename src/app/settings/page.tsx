"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [name, setName] = useState("You");
  const [careerTarget, setCareerTarget] = useState("");
  const [studyTime, setStudyTime] = useState("60");
  const [saved, setSaved] = useState(false);

  const CAREER_TARGETS = [
    "Data Scientist",
    "Data Analyst",
    "Software Engineer (SWE)",
    "Backend Engineer",
    "Full Stack Engineer",
    "ML Engineer",
    "Business Analyst",
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a full implementation, this would call PATCH /api/learner
    // For now we just show the saved confirmation
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">⚙️ Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your learning preferences and career target.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 shadow p-6 space-y-6">

        <div>
          <label className="block text-sm font-semibold mb-1">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Target Career / Role</label>
          <select
            value={careerTarget}
            onChange={e => setCareerTarget(e.target.value)}
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select a target role —</option>
            {CAREER_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This influences which skills are prioritized by the recommendation engine.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Typical Daily Study Time</label>
          <select
            value={studyTime}
            onChange={e => setStudyTime(e.target.value)}
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="30">30 minutes — quick session</option>
            <option value="60">1 hour — standard session</option>
            <option value="120">2 hours — deep focus</option>
            <option value="180">3+ hours — full day</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            The recommendation engine uses this to scope the next session appropriately.
          </p>
        </div>

        <hr className="dark:border-gray-800" />

        <div>
          <h3 className="font-semibold text-sm mb-3">Manual Overrides</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>You can override recommendations at any time by:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Going to <a href="/skills" className="text-blue-500 underline">Skills</a> and clicking "Study" on any skill directly.</li>
              <li>Going to <a href="/practice" className="text-blue-500 underline">Practice</a> and selecting any skill for a quiz.</li>
              <li>Going to <a href="/revision" className="text-blue-500 underline">Revision Queue</a> to revise specific skills.</li>
            </ul>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition"
        >
          Save Settings
        </button>

        {saved && (
          <p className="text-green-600 dark:text-green-400 text-sm text-center font-medium">✅ Settings saved!</p>
        )}
      </form>

      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-300">
        <strong>Note:</strong> Full persistence of settings (career target, name changes) to the database will be wired in the next update. For now, database edits can be done directly via <code>npx prisma studio</code>.
      </div>
    </div>
  );
}
