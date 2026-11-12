import { describe, expect, it } from "vitest";
import { buildCompetitionLeaderboard } from "./leaderboard";
import type { Quiz, QuizAttempt, User } from "@/lib/domain/types";

const quiz: Quiz = { id: "q1", title: "مسابقه", description: "", createdBy: "t1", timeLimitMin: 10, open: true, isCompetition: true, questions: [], createdAt: "" };
const users: User[] = [
  { id: "s1", fullName: "علی", email: "a@test", role: "student", active: true, joinedAt: "" },
  { id: "s2", fullName: "مریم", email: "m@test", role: "student", active: true, joinedAt: "" },
  { id: "s3", fullName: "حساب غیرفعال", email: "x@test", role: "student", active: false, joinedAt: "" },
];
const attempts: QuizAttempt[] = [
  { id: "1", quizId: "q1", userId: "s1", score: 2, total: 4, at: "2026-11-01T10:00:00Z" },
  { id: "2", quizId: "q1", userId: "s1", score: 4, total: 4, at: "2026-11-02T10:00:00Z" },
  { id: "3", quizId: "q1", userId: "s2", score: 3, total: 4, at: "2026-11-01T09:00:00Z" },
  { id: "4", quizId: "q1", userId: "s3", score: 4, total: 4, at: "2026-11-01T08:00:00Z" },
  { id: "5", quizId: "other", userId: "s2", score: 4, total: 4, at: "2026-11-03T10:00:00Z" },
];

describe("buildCompetitionLeaderboard", () => {
  it("ranks each active participant by their best percentage", () => {
    const result = buildCompetitionLeaderboard(quiz, attempts, users);
    expect(result.map((entry) => [entry.fullName, entry.score, entry.attempts])).toEqual([["علی", 100, 2], ["مریم", 75, 1]]);
  });
  it("returns an empty ranking when there are no eligible attempts", () => {
    expect(buildCompetitionLeaderboard(quiz, [], users)).toEqual([]);
  });
});
