"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const learnerId = searchParams.get("learnerId");
  const skillId = searchParams.get("skillId");
  const actionType = searchParams.get("actionType");

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (learnerId && skillId && actionType) {
      fetch(`/api/session?learnerId=${learnerId}&skillId=${skillId}&actionType=${actionType}`)
        .then((res) => res.json())
        .then((data) => {
          setSessionData(data);
          setLoading(false);
        });
    }
  }, [learnerId, skillId, actionType]);

  const markLearned = async () => {
    setIsSubmitting(true);
    await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "LEARN", learnerId, skillId }),
    });
    // Redirect back to dashboard
    router.push("/");
  };

  if (loading) return <div className="p-10 font-bold text-center dark:text-gray-100">Loading Session...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-20 px-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-3xl w-full p-8 border dark:border-gray-800">
        <div className="flex items-center space-x-3 mb-6">
          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-bold px-3 py-1 rounded uppercase">
            {sessionData.actionType}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sessionData.skillName}</h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Based on the recommendation engine, you should focus on the following resources to progress.
        </p>

        <h2 className="text-xl font-bold mb-4 border-b dark:border-gray-800 pb-2 dark:text-gray-100">Recommended Resources</h2>
        <ul className="space-y-4 mb-8">
          {sessionData.resources?.length > 0 ? (
            sessionData.resources.map((res: any, idx: number) => (
              <li key={idx} className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-800 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg dark:text-gray-100">{res.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase">{res.role || "Resource"}</p>
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold py-2 px-4 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                >
                  Open Resource
                </a>
              </li>
            ))
          ) : (
            <li className="text-gray-500 dark:text-gray-400 italic">No direct resources found. Please search online for this topic.</li>
          )}
        </ul>

        <div className="border-t dark:border-gray-800 pt-8 text-center flex flex-col items-center">
          <h3 className="font-bold text-lg mb-2 dark:text-gray-100">Done studying?</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md">
            Marking this as learned will boost your conceptual mastery and unlock dependent skills on your dashboard.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/")}
              className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={markLearned}
              disabled={isSubmitting}
              className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow hover:bg-green-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Mark as Learned"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
