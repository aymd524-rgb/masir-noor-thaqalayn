import type { QuizQuestion } from "@/lib/domain/types";

export function scoreQuizAnswers(questions: QuizQuestion[], answers: Record<string, number>) {
  const correct = questions.reduce((count, question) => count + (answers[question.id] === question.answerIndex ? 1 : 0), 0);
  return { correct, total: questions.length, score: questions.length ? Math.round((correct / questions.length) * 100) : 0 };
}
