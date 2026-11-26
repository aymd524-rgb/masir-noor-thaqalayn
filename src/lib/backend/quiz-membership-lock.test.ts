import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20261126012000_lock_student_membership_during_quiz.sql",
  ),
  "utf8",
);

describe("course quiz membership locking (SQL regression checks)", () => {
  it("locks only the caller's active student membership", () => {
    expect(migration).toMatch(/im\.institute_id\s*=\s*p_institute_id/i);
    expect(migration).toMatch(/im\.user_id\s*=\s*\(select auth\.uid\(\)\)/i);
    expect(migration).toMatch(/im\.role\s*=\s*'student'/i);
    expect(migration).toMatch(/im\.status\s*=\s*'active'/i);
    expect(migration).toMatch(/for share/i);
    expect(migration).toMatch(/return found/i);
  });

  it("checks membership before resuming or creating a course quiz session", () => {
    expect(migration).toMatch(/private\.lock_active_student_membership\(co\.institute_id\)/i);
    expect(migration).toMatch(/create or replace function public\.start_quiz_attempt/i);
    expect(migration).toMatch(/v_course_id is not null and not exists[\s\S]*?lock_active_student_membership/i);
    expect(migration).toMatch(/select s\.id[\s\S]*?for update/i);
    expect(migration).toMatch(/insert into public\.quiz_attempt_sessions/i);
  });

  it("rechecks and locks membership on the final submission transition", () => {
    expect(migration).toMatch(/create or replace function private\.guard_quiz_session_submission_membership/i);
    expect(migration).toMatch(/old\.submitted_at is null and new\.submitted_at is not null/i);
    expect(migration).toMatch(/not private\.lock_active_student_membership\(institute_id\)/i);
    expect(migration).toMatch(/guard_quiz_session_submission_membership\(\)[\s\S]*?returns trigger[\s\S]*?return new/i);
  });

  it("restricts helper execution and keeps course checks separate from standalone quizzes", () => {
    expect(migration).toMatch(/revoke all on function private\.lock_active_student_membership\(uuid\)[\s\S]*?from public, anon/i);
    expect(migration).toMatch(/grant execute on function private\.lock_active_student_membership\(uuid\)[\s\S]*?to authenticated/i);
    expect(migration).toMatch(/if quiz_row\.course_id is not null/i);
  });
});
