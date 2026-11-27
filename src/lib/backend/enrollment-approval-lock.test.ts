import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const approvalTriggerMigration = readFileSync(
  path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20261125143000_create_enrollment_on_approval.sql",
  ),
  "utf8",
);

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
  it("preserves lock order from class capacity row through institute, course, and student membership", () => {
    const classLock = migration.indexOf("from public.classes c");
    const instituteLock = migration.indexOf("from public.institutions i");
    const courseLock = migration.indexOf("from public.courses co");
    const membershipLock = migration.indexOf("from public.institute_memberships im");
    const capacityCheck = migration.indexOf("select count(*) into enrolled_count");
    const enrollmentInsert = migration.indexOf("insert into public.enrollments");

    expect(classLock).toBeGreaterThanOrEqual(0);
    expect(classLock).toBeLessThan(instituteLock);
    expect(instituteLock).toBeLessThan(courseLock);
    expect(courseLock).toBeLessThan(membershipLock);
    expect(membershipLock).toBeLessThan(capacityCheck);
    expect(capacityCheck).toBeLessThan(enrollmentInsert);
  });

  it("keeps the approval transition trigger installed by the original migration", () => {
    expect(approvalTriggerMigration).toContain("after update of status, payment_status on public.enrollment_requests");
    expect(approvalTriggerMigration).toContain("when (new.status = 'approved' and old.status is distinct from 'approved')");
    expect(approvalTriggerMigration).toContain("execute function private.create_enrollment_after_request_approval()");
  });

});
