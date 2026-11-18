import { describe, expect, it } from "vitest";
import {
  validateAdminGameQuestionInput,
  type AdminGameQuestionInput,
} from "./games";

const validInput = (overrides: Partial<AdminGameQuestionInput> = {}): AdminGameQuestionInput => ({
  gameType: "multiple_choice",
  prompt: "کدام سوره با حمد آغاز می‌شود؟",
  options: ["فاتحه", "بقره", "ناس"],
  explanation: "سوره حمد با ستایش خدا آغاز می‌شود.",
  topic: "شناخت سوره‌ها",
  difficulty: "easy",
  ageGroup: "kids",
  answerPayload: 0,
  ...overrides,
});

describe("validateAdminGameQuestionInput", () => {
  it("accepts a valid multiple-choice question", () => {
    expect(() => validateAdminGameQuestionInput(validInput())).not.toThrow();
  });

  it("rejects missing or oversized text fields", () => {
    expect(() => validateAdminGameQuestionInput(validInput({ prompt: " " }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({ prompt: "x".repeat(1201) }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({ topic: "x".repeat(121) }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({ explanation: "x".repeat(2001) }))).toThrow();
  });

  it("rejects invalid or duplicate options", () => {
    expect(() => validateAdminGameQuestionInput(validInput({ options: ["تنها"] }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({ options: ["الف", "الف"] }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({ options: ["الف", " الف "] }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({ options: ["الف", "ب".repeat(301)] }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({ options: Array.from({ length: 9 }, (_, i) => String(i)) }))).toThrow();
  });

  it("requires exactly two options for true/false questions", () => {
    expect(() => validateAdminGameQuestionInput(validInput({ gameType: "true_false" }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({ gameType: "true_false", options: ["درست", "نادرست"] }))).not.toThrow();
  });

  it("checks numeric answer indexes for non-order games", () => {
    for (const answerPayload of [-1, 3, 1.5, "0", ["فاتحه"]]) {
      expect(() => validateAdminGameQuestionInput(validInput({ answerPayload: answerPayload as number }))).toThrow();
    }
  });

  it("requires a complete, unique word-order answer", () => {
    const options = ["بسم", "الله", "الرحمن"];
    expect(() => validateAdminGameQuestionInput(validInput({
      gameType: "word_order", options, answerPayload: ["بسم", "الله", "الرحمن"],
    }))).not.toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({
      gameType: "word_order", options, answerPayload: ["بسم", "الله"],
    }))).toThrow();
    expect(() => validateAdminGameQuestionInput(validInput({
      gameType: "word_order", options, answerPayload: ["بسم", "بسم", "الرحمن"],
    }))).toThrow();
  });
});
