import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const updateGuard = readFileSync(
  path.join(migrationsDir, "20261126011000_serialize_institute_owner_updates.sql"),
  "utf8",
);
const deleteGuard = readFileSync(
  path.join(migrationsDir, "20261126007000_protect_institute_owner_membership_deletes.sql"),
  "utf8",
);

describe("institute owner membership guards (SQL regression checks)", () => {
  it("serializes owner demotions/status changes on the institute row", () => {
    expect(updateGuard).toMatch(/old\.role\s*=\s*'owner'[\s\S]*?new\.role\s*<>\s*'owner'[\s\S]*?for update/i);
    expect(updateGuard).toMatch(/from public\.institutions i[\s\S]*?where i\.id = old\.institute_id[\s\S]*?for update/i);
  });

  it("serializes owner deletion on the same institute row", () => {
    expect(deleteGuard).toMatch(/from public\.institutions i[\s\S]*?where i\.id = old\.institute_id[\s\S]*?for update/i);
  });

  it("both guards reject removal when no other active owner exists", () => {
    for (const sql of [updateGuard, deleteGuard]) {
      expect(sql).toMatch(/other_owner\.institute_id\s*=\s*old\.institute_id/i);
      expect(sql).toMatch(/other_owner\.user_id\s*<>\s*old\.user_id/i);
      expect(sql).toMatch(/other_owner\.role\s*=\s*'owner'/i);
      expect(sql).toMatch(/other_owner\.status\s*=\s*'active'/i);
      expect(sql).toMatch(/an institute must retain at least one active owner/i);
    }
  });

  it("does not let managers alter owner/manager memberships", () => {
    expect(updateGuard).toMatch(/old\.role in \('owner','manager'\) and not actor_is_owner/i);
    expect(deleteGuard).toMatch(/old\.role in \('owner','manager'\) and not actor_is_owner/i);
  });

  it("keeps membership institute and user identity immutable", () => {
    expect(updateGuard).toMatch(/new\.institute_id is distinct from old\.institute_id[\s\S]*?new\.user_id is distinct from old\.user_id/i);
  });
});
