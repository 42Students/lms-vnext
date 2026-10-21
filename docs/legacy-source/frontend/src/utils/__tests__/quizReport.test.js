import { buildQuizReport } from "../quizReport";

const QUIZ = {
  title: "Loops Quiz",
  dueAt: "2026-10-01T00:00:00.000Z",
  questions: [
    { id: 1, prompt: "What does a for-loop do?", points: 5, sequence: 1 },
    { id: 2, prompt: "What is an infinite loop?", points: 5, sequence: 2 },
  ],
};

function attempt(overrides = {}) {
  return {
    learnerId: 1,
    learnerName: "Asha Rao",
    attemptNumber: 1,
    score: 10,
    maxScore: 10,
    submittedAt: "2026-09-20T10:00:00.000Z",
    answers: [
      { questionId: 1, correct: true, pointsAwarded: 5 },
      { questionId: 2, correct: true, pointsAwarded: 5 },
    ],
    ...overrides,
  };
}

test("computes total points from question points, not a hardcoded value", () => {
  const report = buildQuizReport({ quiz: QUIZ, submissions: [] });
  expect(report.totalPoints).toBe(10);
  expect(report.questionCount).toBe(2);
});

test("keeps only each learner's latest attempt when they have retaken the quiz", () => {
  const submissions = [
    attempt({ attemptNumber: 1, score: 4, maxScore: 10 }),
    attempt({ attemptNumber: 2, score: 9, maxScore: 10 }),
  ];
  const report = buildQuizReport({ quiz: QUIZ, submissions });

  expect(report.students).toHaveLength(1);
  expect(report.students[0].score).toBe(9);
  expect(report.submittedCount).toBe(1);
});

test("question accuracy is worst-first, and an unanswered question sorts last, not first", () => {
  const submissions = [
    attempt({
      learnerId: 1, learnerName: "Asha Rao", score: 5, maxScore: 10,
      answers: [{ questionId: 1, correct: true, pointsAwarded: 5 }, { questionId: 2, correct: false, pointsAwarded: 0 }],
    }),
    attempt({
      learnerId: 2, learnerName: "Ravi Kumar", score: 0, maxScore: 10,
      answers: [{ questionId: 1, correct: false, pointsAwarded: 0 }, { questionId: 2, correct: false, pointsAwarded: 0 }],
    }),
  ];
  const quizWithThird = {
    ...QUIZ,
    questions: [...QUIZ.questions, { id: 3, prompt: "Unreleased question", points: 5, sequence: 3 }],
  };
  const report = buildQuizReport({ quiz: quizWithThird, submissions });

  // Q2: 0/2 correct (0%), Q1: 1/2 correct (50%), Q3: unanswered (null) -- worst real score first,
  // "no data" last.
  expect(report.questions.map((q) => q.id)).toEqual([2, 1, 3]);
  expect(report.questions[0].accuracyPercent).toBe(0);
  expect(report.questions[2].accuracyPercent).toBeNull();
});

test("computes completion against the roster when one is given, and omits it when not", () => {
  const submissions = [attempt()];
  const withRoster = buildQuizReport({ quiz: QUIZ, submissions, roster: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] });
  expect(withRoster.rosterSize).toBe(4);
  expect(withRoster.completionPercent).toBe(25);

  const withoutRoster = buildQuizReport({ quiz: QUIZ, submissions });
  expect(withoutRoster.rosterSize).toBeNull();
  expect(withoutRoster.completionPercent).toBeNull();
});

test("an ungraded/unscored attempt does not corrupt the average", () => {
  const submissions = [
    attempt({ learnerId: 1, score: 10, maxScore: 10 }),
    attempt({ learnerId: 2, learnerName: "Ravi Kumar", score: null, maxScore: null }),
  ];
  const report = buildQuizReport({ quiz: QUIZ, submissions });

  expect(report.avgPercent).toBe(100);
  expect(report.students).toHaveLength(2);
});

test("a null score with a real maxScore produces a null percent, not NaN", () => {
  const submissions = [attempt({ score: null, maxScore: 10 })];
  const report = buildQuizReport({ quiz: QUIZ, submissions });

  expect(report.students[0].percent).toBeNull();
  expect(Number.isNaN(report.avgPercent)).toBe(false);
  expect(report.avgPercent).toBeNull();
});

test("dedup by latest attempt is decided by submission time, not attempt number order", () => {
  // Deliberately out of chronological order and with equal attemptNumbers, to exercise the tie
  // path directly rather than relying on the array already being submittedAt-DESC.
  const submissions = [
    attempt({ attemptNumber: 1, score: 3, maxScore: 10, submittedAt: "2026-09-20T10:00:00.000Z" }),
    attempt({ attemptNumber: 1, score: 9, maxScore: 10, submittedAt: "2026-09-21T10:00:00.000Z" }),
  ];
  const report = buildQuizReport({ quiz: QUIZ, submissions });

  expect(report.students).toHaveLength(1);
  expect(report.students[0].score).toBe(9);
});

test("an empty quiz with no submissions produces sensible empty values, not crashes", () => {
  const report = buildQuizReport({ quiz: QUIZ, submissions: [] });
  expect(report.students).toEqual([]);
  expect(report.avgPercent).toBeNull();
  expect(report.distribution.every((b) => b.count === 0)).toBe(true);
});
