export interface QuizResultSummary {
  count: number;
  average: number | null;
  best: number | null;
}

/** Summarizes only the attempts supplied by the caller; backend callers must pass RLS-scoped rows. */
export function summarizeQuizResults(attempts: readonly { score: number; total: number }[]): QuizResultSummary {
  const scores = attempts.map((attempt) => attempt.total > 0
    ? Math.round((attempt.score / attempt.total) * 100)
    : 0);
  return {
    count: scores.length,
    average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
    best: scores.length ? Math.max(...scores) : null,
  };
}
