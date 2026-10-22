# Unit-test repair queue (unit12): lane chat-12

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat11-super-admin-tenant-lifecycle-races.test.ts` (1 failing)
- [ ] `tests/unit/chat6-superadmin-lecture-hall-role-24.test.tsx` (1 failing)

## Failures (from CI log)

### tests/unit/chat11-super-admin-tenant-lifecycle-races.test.ts

```
 FAIL  tests/unit/chat11-super-admin-tenant-lifecycle-races.test.ts > SA-tenants-modules-LIFECYCLE-11 cross-tenant and concurrent lifecycle guards > serializes archived-parent change with active-child existence before activity
AssertionError: expected 'export async function archiveOrganiza…' to contain 'blockerCounts.active+blockerCounts.ar…'

- Expected
+ Received

- blockerCounts.active+blockerCounts.archived>0
+ export async function archiveOrganization(
+   context: RequestContext,
+   organizationIdInput: string,
+ ) {
+   const organizationId =
+     organizationIdSchema.parse(organizationIdInput);
+   const organization = await loadActiveOrganization(organizationId);
+
+   requirePermission(context, "organization.manage", {
```

### tests/unit/chat6-superadmin-lecture-hall-role-24.test.tsx

```
 FAIL  tests/unit/chat6-superadmin-lecture-hall-role-24.test.tsx > SA-middle-lecture-halls-24 platform role and selected college > provides safe missing-college recovery with zero private reads
Error: [vitest] No "listSuperAdminOrganizationLectureHalls" export is defined on the "@/modules/academics/lecture-hall-service" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("@/modules/academics/lecture-hall-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.SuperAdminLectureHallsPage src/app/(authenticated)/admin/lecture-halls/page.tsx:38:61
     36|     // Organization-scoped and global Super Admins both get the legacy
     37|     // read-only directory; college scope is required only for mutatio…
     38|     const organizationDirectory=isSuperAdmin(context)?await listSuperA…
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-2-016-134  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
