"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
  type: string;
  skill: { name: string };
}

interface QuizResult {
  questionId: string;
  skillId: string;
  isCorrect: boolean;
  failureType?: string;
}

const FAILURE_TYPES = [
  { value: "CONCEPT_GAP", label: "Didn't understand the concept" },
  { value: "IMPLEMENTATION_GAP", label: "Knew it but couldn't implement it" },
  { value: "PATTERN_RECOGNITION_GAP", label: "Didn't recognize the pattern" },
  { value: "CARELESS_ERROR", label: "Silly mistake / careless error" },
  { value: "RECALL_GAP", label: "Forgot — needed reminding" },
  { value: "PREREQUISITE_GAP", label: "Missing a prerequisite concept" },
  { value: "TIME_PRESSURE", label: "Ran out of time" },
];

export default function PracticePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const skillId = searchParams.get("skillId");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [learner, setLearner] = useState<{ id: string; name: string } | null>(null);
  const [selectedSkill, setSelectedSkill] = useState(skillId || "");
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState("");
  const [quizDone, setQuizDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/learner").then(r => r.json()).then(data => setLearner(data));
    fetch("/api/skills").then(r => r.json()).then((data: any[]) =>
      setSkills(data.map((s: any) => ({ id: s.id, name: s.name })))
    );
  }, []);

  const startQuiz = async () => {
    if (!selectedSkill) return;
    setLoading(true);
    setQuizDone(false);
    setResults([]);
    setCurrent(0);
    setShowAnswer(false);
    const res = await fetch(`/api/questions?skillId=${selectedSkill}`);
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  };

  const handleCorrect = async () => {
    const q = questions[current];
    await submitAnswer(q.id, selectedSkill, true, undefined);
    advance();
  };

  const handleWrong = () => {
    setShowAnswer(true);
  };

  const confirmWrong = async () => {
    const q = questions[current];
    await submitAnswer(q.id, selectedSkill, false, selectedFailure || undefined);
    setShowAnswer(false);
    setSelectedFailure("");
    advance();
  };

  const submitAnswer = async (questionId: string, skillId: string, isCorrect: boolean, failureType?: string) => {
    if (!learner) return;
    setSubmitting(true);
    await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: learner.id, questionId, isCorrect, failureType }),
    });
    setResults(prev => [...prev, { questionId, skillId, isCorrect, failureType }]);
    setSubmitting(false);
  };

  const advance = () => {
    if (current + 1 >= questions.length) {
      setQuizDone(true);
    } else {
      setCurrent(prev => prev + 1);
    }
  };

  const correct = results.filter(r => r.isCorrect).length;

  if (quizDone) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold">✅ Quiz Complete!</h1>
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6 shadow space-y-4">
          <p className="text-2xl font-bold text-center">
            {correct} / {results.length} Correct
          </p>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${r.isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                <span>Q{i + 1}: {r.isCorrect ? "✓ Correct" : `✗ Wrong (${r.failureType?.replace(/_/g, ' ') || 'Unclassified'})`}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            Your mastery has been updated. Go back to your dashboard to see the new recommendation.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setQuizDone(false); setQuestions([]); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition">
              Try Another Skill
            </button>
            <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">✏️ Practice & Quiz</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Select a skill and take a quiz. Your mastery updates after every answer.</p>
      </div>

      {/* Skill Selector */}
      {!q && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6 shadow space-y-4">
          <label className="block font-semibold">Select a Skill to Practice</label>
          <select
            value={selectedSkill}
            onChange={e => setSelectedSkill(e.target.value)}
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Choose a skill —</option>
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={startQuiz}
            disabled={!selectedSkill || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Loading questions..." : "Start Quiz"}
          </button>
        </div>
      )}

      {/* Quiz in progress */}
      {q && !quizDone && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6 shadow space-y-5">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>Skill: <strong className="text-gray-800 dark:text-gray-200">{q.skill.name}</strong></span>
            <span>Question {current + 1} of {questions.length}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${((current) / questions.length) * 100}%` }} />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-xl p-5">
            <p className="font-semibold text-lg leading-relaxed">{q.text}</p>
            <p className="text-xs text-gray-400 mt-2">Type: {q.type}</p>
          </div>

          {!showAnswer ? (
            <div className="flex gap-3">
              <button
                onClick={handleCorrect}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                ✓ Got It Correct
              </button>
              <button
                onClick={handleWrong}
                disabled={submitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                ✗ Got It Wrong
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-semibold text-red-600 dark:text-red-400">Why did you get it wrong?</p>
              <div className="grid grid-cols-1 gap-2">
                {FAILURE_TYPES.map(ft => (
                  <label key={ft.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedFailure === ft.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <input
                      type="radio"
                      name="failureType"
                      value={ft.value}
                      checked={selectedFailure === ft.value}
                      onChange={() => setSelectedFailure(ft.value)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm">{ft.label}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={confirmWrong}
                disabled={submitting}
                className="w-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Submit & Next Question →"}
              </button>
            </div>
          )}
        </div>
      )}

      {q && questions.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6 shadow text-center text-gray-500">
          No questions found for this skill yet. Add them via the seed script.
        </div>
      )}
    </div>
  );
}
