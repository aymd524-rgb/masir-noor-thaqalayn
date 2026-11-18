import { describe, expect, it } from "vitest";
import { validateBackendQuizInput } from "./quizzes";
import type { QuizQuestion } from "@/lib/domain/types";

const question = (overrides: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: "q-1",
  text: "کدام سوره با حمد آغاز می‌شود؟",
  options: ["فاتحه", "بقره", "ناس"],
  answerIndex: 0,
  ...overrides,
});

const validInput = () => ({
  title: "آزمون قرآن",
  description: "آزمون کوتاه",
  timeLimitMin: 20,
  questions: [question()],
});

describe("validateBackendQuizInput", () => {
  it("accepts a valid quiz", () => {
    expect(() => validateBackendQuizInput(validInput())).not.toThrow();
  });

  it("enforces title, description, and time limits", () => {
    expect(() => validateBackendQuizInput({ ...validInput(), title: " " })).toThrow();
    expect(() => validateBackendQuizInput({ ...validInput(), title: "x".repeat(121) })).toThrow();
    expect(() => validateBackendQuizInput({ ...validInput(), description: "x".repeat(2001) })).toThrow();
    for (const timeLimitMin of [0, 241, 2.5, Number.NaN]) {
      expect(() => validateBackendQuizInput({ ...validInput(), timeLimitMin })).toThrow();
    }
  });

  it("requires between one and one hundred questions", () => {
    expect(() => validateBackendQuizInput({ ...validInput(), questions: [] })).toThrow();
    expect(() => validateBackendQuizInput({ ...validInput(), questions: Array.from({ length: 101 }, (_, i) => question({ id: String(i) })) })).toThrow();
    expect(() => validateBackendQuizInput({ ...validInput(), questions: Array.from({ length: 100 }, (_, i) => question({ id: String(i) })) })).not.toThrow();
  });

  it("rejects oversized prompts and options", () => {
    expect(() => validateBackendQuizInput({ ...validInput(), questions: [question({ text: "x".repeat(1001) })] })).toThrow();
    expect(() => validateBackendQuizInput({ ...validInput(), questions: [question({ options: ["x", "y".repeat(301)] })] })).toThrow();
  });

  it("rejects duplicate choices after trimming whitespace", () => {
    expect(() => validateBackendQuizInput({
      ...validInput(),
      questions: [question({ options: ["فاتحه", " فاتحه ", "ناس"] })],
    })).toThrow();
  });

  it("caps the aggregate quiz text size", () => {
    const questions = Array.from({ length: 100 }, (_, i) =>
      question({ id: String(i), text: "پرسش".repeat(200), options: ["الف".repeat(300), "ب".repeat(300)] }),
    );
    expect(() => validateBackendQuizInput({ ...validInput(), questions })).toThrow();
  });

  it("rejects invalid option counts and answer indexes", () => {
    for (const options of [[], ["تنها یک گزینه"], Array.from({ length: 9 }, (_, i) => String(i))]) {
      expect(() => validateBackendQuizInput({ ...validInput(), questions: [question({ options })] })).toThrow();
    }
    for (const answerIndex of [-1, 3, 1.5, Number.NaN]) {
      expect(() => validateBackendQuizInput({ ...validInput(), questions: [question({ answerIndex })] })).toThrow();
    }
  });
});
