# Unit-test repair queue (unit11): lane chat-10

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-10-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx` (2 failing)
- [ ] `tests/unit/chat12-verify2-legacy-category-controls.test.ts` (1 failing)
- [x] `tests/unit/chat2-team-handover-36.test.ts` (1 failing)
- [ ] `tests/unit/chat6-superadmin-course-edit-copy-55.test.ts` (1 failing)
- [ ] `tests/unit/chat9-super-admin-placement-remaining-gap-verification.test.ts` (1 failing)
- [ ] `tests/unit/learner-syllabus-soft-delete-visibility.test.ts` (1 failing)
- [ ] `tests/unit/verify2-lane18-attendance-program-interviews.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx

```
 FAIL  tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx > Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-38 any essential directory outage displays an honest retry, never a false zero-program list
Error: [vitest] No "listProgramsPage" export is defined on the "@/modules/academics/program-service" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("@/modules/academics/program-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.SuperAdminProgramsPage src/app/(authenticated)/admin/programs/page.tsx:103:5
    101|   </div>;
    102|   const [programRead,departmentRead]=await Promise.allSettled([
    103|     listProgramsPage(context,collegeId,filters.data),

 FAIL  tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx > Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-39 a valid college preserves the exact program/dept association
Error: [vitest] No "listProgramsPage" export is defined on the "@/modules/academics/program-service" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

vi.mock(import("@/modules/academics/program-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

 ❯ Module.SuperAdminProgramsPage src/app/(authenticated)/admin/programs/page.tsx:103:5
    101|   </div>;
    102|   const [programRead,departmentRead]=await Promise.allSettled([
    103|     listProgramsPage(context,collegeId,filters.data),
```

### tests/unit/chat12-verify2-legacy-category-controls.test.ts

```
 FAIL  tests/unit/chat12-verify2-legacy-category-controls.test.ts > chat-12 verification round 2: legacy filter and accessible controls > keeps TPO photos signed and upload-confirmed, with touch targets at least 44px
AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'className="block min-h-11 md:min-h-9'

- Expected
+ Received

- className="block min-h-11 md:min-h-9
+ "use client";
+ import {useEffect,useRef,useState} from "react";
+ import {useRouter} from "next/navigation";
+ import {Button} from "@/components/ui/button";
+ import {Input} from "@/components/ui/input";
+
+ type AvatarSnapshot = {preview:string|null;version:number};
+ const endpoint="/api/placements/tpo/profile/avatar";
+ const limit=5*1024*1024;
```

### tests/unit/chat2-team-handover-36.test.ts

```
 FAIL  tests/unit/chat2-team-handover-36.test.ts > Scoped Team ownership handover > TPO-inbox-team-36 exposes guarded handover from People, not an unguarded role-revocation button
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

### tests/unit/chat6-superadmin-course-edit-copy-55.test.ts

```
 FAIL  tests/unit/chat6-superadmin-course-edit-copy-55.test.ts > Super Admin courses legacy edit semantics > SA-academics-people-55 uses the legacy Course Name field and confirmation language while keeping immutable department
AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'Department ownership is immutable'

- Expected
+ Received

- Department ownership is immutable
+ "use client";
+
+ import Link from "next/link";
+ import Image from "next/image";
+ import {
+   useEffect,
+   useState,
+ } from "react";
+ import { useRouter } from "next/navigation";
```

### tests/unit/chat9-super-admin-placement-remaining-gap-verification.test.ts

```
 FAIL  tests/unit/chat9-super-admin-placement-remaining-gap-verification.test.ts > Super Admin Placement operations remaining source parity > SA-placements-projects-46 filters candidate interview bookings by type, status, mode and department
AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'choices("Type"'

- Expected
+ Received

- choices("Type"
+ "use client";
+ import { Checkbox } from "@/components/ui/checkbox";
+ import {SuperAdminInterviewEdit} from "@/components/admin/super-admin-interview-edit";
+ import {useMemo,useState,useTransition} from "react";
+ import Link from "next/link";
+ import {useRouter} from "next/navigation";
+ import {Input} from "@/components/ui/input";
+ import { DataTable } from "@/components/ui/data-table";
+ import { Select } from "@/components/ui/select";
```

### tests/unit/learner-syllabus-soft-delete-visibility.test.ts

```
 FAIL  tests/unit/learner-syllabus-soft-delete-visibility.test.ts > Learner syllabus soft-delete and audience isolation > continues to deny hidden, deleted and foreign-class content
AssertionError: expected 'const rows = await getDb()\n    .sele…' to contain 'eq(lessonContents.status,'

- Expected
+ Received

- eq(lessonContents.status,
+ const rows = await getDb()
+     .select({
+       membershipId: courseTeachingAssignments.membershipId,
+       role: courseTeachingAssignments.role,
+       name: users.displayName,
+       endedAt: courseTeachingAssignments.endedAt,
+     })
+     .from(courseTeachingAssignments)
+     .innerJoin(
```

### tests/unit/verify2-lane18-attendance-program-interviews.test.ts

```
 FAIL  tests/unit/verify2-lane18-attendance-program-interviews.test.ts > Verify2 lane-18: legacy attendance, interview and duration guards > denies a smaller program when an active imported enrollment has no term provenance
AssertionError: expected 'import {\n  and,\n  asc,\n  count,\n …' to contain 'eq(learnerProgramEnrollments.status,"…'

- Expected
+ Received

- eq(learnerProgramEnrollments.status,"ACTIVE")
+ import {
+   and,
+   asc,
+   count,
+   desc,
+   eq,
+   isNull,
+   ne,
+   or,
```

