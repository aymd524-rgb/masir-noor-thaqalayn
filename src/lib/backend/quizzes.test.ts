import { describe, expect, it } from "vitest";
import { validateBackendQuizAttemptInput, validateBackendQuizInput } from "./quizzes";
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
  it("returns validation errors instead of runtime TypeErrors for malformed JavaScript input", () => {
    const malformedTitle = { ...validInput(), title: null } as unknown as Parameters<typeof validateBackendQuizInput>[0];
    const malformedDescription = { ...validInput(), description: null } as unknown as Parameters<typeof validateBackendQuizInput>[0];
    const malformedQuestion = { ...validInput(), questions: [{ text: null, options: ["الف", "ب"], answerIndex: 0 }] } as unknown as Parameters<typeof validateBackendQuizInput>[0];
    const nullQuestion = { ...validInput(), questions: [null] } as unknown as Parameters<typeof validateBackendQuizInput>[0];
    const malformedOption = { ...validInput(), questions: [{ text: "پرسش", options: ["الف", null], answerIndex: 0 }] } as unknown as Parameters<typeof validateBackendQuizInput>[0];

    expect(() => validateBackendQuizInput(malformedTitle)).toThrow("عنوان، توضیحات یا مدت آزمون معتبر نیست.");
    expect(() => validateBackendQuizInput(malformedDescription)).toThrow("عنوان، توضیحات یا مدت آزمون معتبر نیست.");
    expect(() => validateBackendQuizInput(malformedQuestion)).toThrow("متن پرسش، گزینه‌ها یا پاسخ صحیح کامل و معتبر نیست.");
    expect(() => validateBackendQuizInput(nullQuestion)).toThrow("متن پرسش، گزینه‌ها یا پاسخ صحیح کامل و معتبر نیست.");
    expect(() => validateBackendQuizInput(malformedOption)).toThrow("متن پرسش، گزینه‌ها یا پاسخ صحیح کامل و معتبر نیست.");
  });

});

describe("validateBackendQuizAttemptInput", () => {
  const quizId = "123e4567-e89b-42d3-a456-426614174000";
  const questionId = "123e4567-e89b-42d3-a456-426614174001";

  it("accepts a well-formed answer map", () => {
    expect(() => validateBackendQuizAttemptInput(quizId, { [questionId]: 1 })).not.toThrow();
  });

  it("rejects invalid quiz IDs and malformed answer maps", () => {
    for (const [id, answers] of [
      ["not-a-uuid", { [questionId]: 0 }],
      [quizId, null],
      [quizId, []],
      [quizId, {}],
      [quizId, { "bad-id": 0 }],
      [quizId, { [questionId]: -1 }],
      [quizId, { [questionId]: 1.5 }],
      [quizId, { [questionId]: "1" }],
    ] as const) {
      expect(() => validateBackendQuizAttemptInput(id, answers)).toThrow();
    }
  });

  it("rejects answer maps with more than one hundred entries", () => {
    const answers = Object.fromEntries(Array.from({ length: 101 }, (_, index) => [
      `123e4567-e89b-42d3-a456-${String(index).padStart(12, "0")}`, 0,
    ]));
    expect(() => validateBackendQuizAttemptInput(quizId, answers)).toThrow();
  });
});
