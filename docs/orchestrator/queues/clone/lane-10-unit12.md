# Unit-test repair queue (unit12): lane chat-10

CI run 39840114517 on main (06b36804), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/admin-program-directory.test.ts` (1 failing)
- [ ] `tests/unit/chat6-admin-second-third-lecture-hall-pages.test.ts` (1 failing)
- [ ] `tests/unit/tpo-team-legacy-people-chat2.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/admin-program-directory.test.ts

```
 FAIL  tests/unit/admin-program-directory.test.ts > W06 admin Programs directory > matches legacy years while preserving exactly two terms per year
AssertionError: expected '1 semester' to be '0.5 years' // Object.is equality

Expected: "0.5 years"
Received: "1 semester"

 ❯ tests/unit/admin-program-directory.test.ts:22:42
     20|   it("matches legacy years while preserving exactly two terms per year…
     21|     expect(programDurationYearsLabel(8)).toBe("4 years");
     22|     expect(programDurationYearsLabel(1)).toBe("0.5 years");
       |                                          ^
     23|     expect(legacyDurationYearsToTerms(4)).toBe(8);
     24|     expect(legacyDurationYearsToTerms(1.5)).toBe(3);

```

### tests/unit/chat6-admin-second-third-lecture-hall-pages.test.ts

```
 FAIL  tests/unit/chat6-admin-second-third-lecture-hall-pages.test.ts > Super Admin second third: actual Lecture Halls server-page states > CHAT6-ADMIN-LECTURES-PAGE-01 renders college selector recovery before ANY roster lookup
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

### tests/unit/tpo-team-legacy-people-chat2.test.ts

```
 FAIL  tests/unit/tpo-team-legacy-people-chat2.test.ts > TPO People roster legacy copy > TPO-inbox-team-32 keeps the number of displayed team members consistent with the filtered roster
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/tpo/settings/team")'

- Expected
+ Received

- redirect("/tpo/settings/team")
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
+ import { hasMembershipRole } from "@/modules/identity/context";
+
+ type LegacyTeamSearch = Record<string, string | string[] | undefined>;
+
+ function first(value: string | string[] | undefined): string | undefined {
+   return Array.isArray(value) ? value[0] : value;
```


## Deep rows (do these FIRST)

Record each result under ## Results in the deep packet named next to the row: OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-2-010-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md; record in: docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md)
