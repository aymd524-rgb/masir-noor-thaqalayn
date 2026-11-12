import { describe, expect, it } from "vitest";
import { scoreQuizAnswers } from "./scoring";
import type { QuizQuestion } from "@/lib/domain/types";

const questions: QuizQuestion[] = [
  { id: "a", text: "پرسش اول", options: ["الف", "ب"], answerIndex: 1 },
  { id: "b", text: "پرسش دوم", options: ["الف", "ب"], answerIndex: 0 },
  { id: "c", text: "پرسش سوم", options: ["الف", "ب"], answerIndex: 1 },
];

describe("scoreQuizAnswers", () => {
  it("scores correct and incorrect answers", () => {
    expect(scoreQuizAnswers(questions, { a: 1, b: 1, c: 1 })).toEqual({ correct: 2, total: 3, score: 67 });
  });
  it("treats unanswered questions as incorrect", () => {
    expect(scoreQuizAnswers(questions, { a: 1 })).toEqual({ correct: 1, total: 3, score: 33 });
  });
  it("returns zero for an empty quiz", () => {
    expect(scoreQuizAnswers([], {})).toEqual({ correct: 0, total: 0, score: 0 });
  });
});
