import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20261126013000_lock_membership_during_enrollment_approval.sql",
  ),
  "utf8",
);

describe("enrollment approval serialization (SQL source checks)", () => {
  it("locks the active institute and course against concurrent deactivation", () => {
    expect(migration).toMatch(/from public\.institutions i[\s\S]*?i\.is_active is true[\s\S]*?for share/i);
    expect(migration).toMatch(/from public\.courses co[\s\S]*?co\.is_active is true[\s\S]*?for share/i);
    expect(migration).toMatch(/co\.institute_id = locked_institute_id/i);
  });

  it("locks the exact active student membership before creating enrollment", () => {
    expect(migration).toMatch(/from public\.institute_memberships im[\s\S]*?im\.user_id = new\.student_id[\s\S]*?im\.role = 'student'[\s\S]*?im\.status = 'active'[\s\S]*?for share/i);
    expect(migration).toMatch(/if not found then[\s\S]*?active student membership/i);
    expect(migration).toMatch(/insert into public\.enrollments[\s\S]*?values \(new\.student_id, new\.class_id\)/i);
  });

  it("retains class capacity serialization and payment validation", () => {
    expect(migration).toMatch(/from public\.classes c[\s\S]*?for update/i);
    expect(migration).toMatch(/new\.payment_status not in \('paid', 'waived'\)/i);
    expect(migration).toMatch(/select count\(\*\) into enrolled_count[\s\S]*?e\.class_id = new\.class_id/i);
    expect(migration).toMatch(/enrolled_count >= class_row\.capacity/i);
  });

  it("keeps the approval trigger function inaccessible to client roles", () => {
    expect(migration).toMatch(/revoke all on function private\.create_enrollment_after_request_approval\(\)[\s\S]*?from public, anon, authenticated/i);
  });
});
