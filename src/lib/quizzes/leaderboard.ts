import type { Quiz, QuizAttempt, User } from "@/lib/domain/types";

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  score: number;
  correct: number;
  total: number;
  attempts: number;
  lastAttemptAt: string;
}

export function buildCompetitionLeaderboard(
  quiz: Quiz,
  attempts: QuizAttempt[],
  users: User[],
): LeaderboardEntry[] {
  const byUser = new Map<string, QuizAttempt[]>();
  for (const attempt of attempts) {
    if (attempt.quizId !== quiz.id || attempt.total <= 0) continue;
    const current = byUser.get(attempt.userId) ?? [];
    current.push(attempt);
    byUser.set(attempt.userId, current);
  }

  const entries: LeaderboardEntry[] = [];
  for (const [userId, userAttempts] of byUser) {
    const user = users.find((item) => item.id === userId && item.active);
    if (!user) continue;
    const best = userAttempts.reduce((a, b) => (a.score / a.total >= b.score / b.total ? a : b));
    entries.push({
      userId,
      fullName: user.fullName,
      score: Math.round((best.score / best.total) * 100),
      correct: best.score,
      total: best.total,
      attempts: userAttempts.length,
      lastAttemptAt: userAttempts.reduce((latest, item) => item.at > latest ? item.at : latest, userAttempts[0].at),
    });
  }

  return entries.sort((a, b) => b.score - a.score || a.lastAttemptAt.localeCompare(b.lastAttemptAt) || a.fullName.localeCompare(b.fullName, "fa"));
}
