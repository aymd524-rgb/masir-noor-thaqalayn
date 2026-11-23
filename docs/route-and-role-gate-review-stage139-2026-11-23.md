# Stage 139 — Route gates and admin-role mutation call-site review

Date: 2026-11-23
Repository: `aymd524-rgb/masir-noor-thaqalayn`
Branch: `docs/live-schema-security-inventory-2026-11-23`

## Scope

Read-only source inspection of route components, the shared `RoleGate`, authentication provider, domain role action, and admin/teacher backend call sites. No database calls, test accounts, production data, or application code changes were made.

Files inspected:
- `src/components/common/RoleGate.tsx`
- `src/routes/admin.tsx`
- `src/routes/teacher.tsx`
- `src/routes/student.tsx`
- `src/lib/auth.tsx`
- `src/lib/domain/actions.ts`
- `src/components/admin/AdminBackendPanel.tsx`
- `src/components/teacher/TeacherBackendPanel.tsx`

## Findings

### 1. Admin route has a client-side role check, but does not use the shared RoleGate

`/admin` renders the backend admin panel only when the cached authenticated user has `role === "admin"`. Unauthenticated users see a sign-in link and other roles see a denial message. This is a useful UI boundary, not a server authorization control. The shared `RoleGate` documents the same limitation and is not imported by this route.

### 2. Teacher route intentionally allows both teacher and admin roles

`/teacher` permits `teacher` and `admin`; in backend mode it passes the current user to `TeacherBackendPanel`, which passes the user ID and an `isAdmin` boolean to `loadTeacherWorkspace`. This flag is client-supplied context and must not be trusted as authorization by database functions or RLS. The database must independently scope teachers to assigned classes and allow admins only according to policy.

### 3. Student route checks the cached role in the UI

`/student` only renders the student dashboard for a cached `student` role. Again, this is presentation logic only. Backend row-level policies and RPC authorization remain decisive.

### 4. Direct admin role update is performed from the browser

`AdminBackendPanel.updateUserRole` blocks changing the current user's own role in the UI and sends a direct `profiles.update({ role })` for another profile. The UI self-protection is bypassable and cannot secure the operation. The effective database UPDATE policy must restrict role changes to authorized admins and prevent unauthorized role escalation. A safe role-change test matrix remains outstanding.

The domain-layer `setUserRole` helper also checks for an admin actor and blocks self-role changes, but this is local application logic and does not replace the database policy for backend mode.

### 5. Authentication bootstrap has an error-handling gap relevant to role gates

The auth provider's initial backend sync awaits `auth.getUser()` and `resolveBackendUser()` without a local catch. The resolver currently ignores profile/contact query errors (Stage 138), so a profile-read failure can be represented as a student fallback; if a future resolver starts throwing, the initial sync also needs a catch/finally path so the UI does not remain indefinitely in loading state.

## Risk interpretation

These findings identify where the application relies on client-side role state. They do not, by themselves, establish that a non-admin can read or modify protected records. That conclusion requires inspection and safe execution tests of the live RLS policies and RPC guards under separate anon, student, teacher, and admin sessions.

## Recommended next verification (not performed)

1. Verify effective UPDATE privileges and RLS policies for `profiles.role`; confirm non-admin updates are denied even when requests bypass the UI.
2. Verify `loadTeacherWorkspace` and every teacher write helper are constrained by the authenticated identity and class assignment in database-side policies/functions, not by the passed `isAdmin` boolean.
3. Test the admin contact RPC and profile-role mutation with anon, student, teacher, and admin sessions in a non-production environment.
4. Improve auth bootstrap handling for profile lookup failures: distinguish missing profile from transient read errors, avoid silently manufacturing a default role on failed reads, and always settle loading state on failure.
5. Add route/component tests for unauthenticated, student, teacher, and admin rendering, while keeping them separate from backend authorization tests.

## Non-actions

No SQL, DDL, DML, grants, revokes, policies, functions, triggers, Auth settings, migrations, deployment, user creation, or live data reads were performed. No PR was merged.
