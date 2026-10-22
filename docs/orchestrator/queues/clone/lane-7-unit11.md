# Unit-test repair queue (unit11): lane chat-7

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-7-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts` (1 failing)
- [ ] `tests/unit/chat12-drive-visibility-overrides.test.ts` (1 failing)
- [x] `tests/unit/chat2-UX-tpo-overlay-coverage.test.ts` (1 failing)
- [x] `tests/unit/chat6-application-score-precision.test.ts` (1 failing)
- [x] `tests/unit/chat8-verify2-mapping-stale.test.ts` (1 failing)
- [x] `tests/unit/learner-contact-edit.test.ts` (1 failing)
- [x] `tests/unit/ux-admin-chat9-batch-04.test.ts` (1 failing)

## Repair results

- `tests/unit/chat6-application-score-precision.test.ts`: 04775f9 — Fractional score SQL remains unchanged; ascending and descending order place unscored (NULL) applications last. Not executed locally.

- `tests/unit/ux-admin-chat9-batch-04.test.ts`: 4691c61 — Tenant filters and pagination now live in directory/page.tsx; test asserts split landing routes plus filter controls on actual directory. Not executed locally.

- `tests/unit/chat8-verify2-mapping-stale.test.ts`: 3bee1c7 — Read-only guard was added to term mapping mutation; exact assertion updated while retaining stale refresh and validation checks. Not executed locally.

- `tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts`: FIXED `9a64f10f6dc574957dcea5516cfa2d46519cd251`. The legacy mentor calendar shows an HTTPS join link whenever a meeting is not cancelled, including requested and past meetings (`docs/legacy-source/frontend/src/pages/mentor/calendar.js`); the outdated test now retains URL safety assertions and explicitly checks cancellation. Not executed locally.

- `tests/unit/chat2-UX-tpo-overlay-coverage.test.ts`: FIXED in `40cab002ae7191aaf83d5756086054886299b3dc`; the mobile More footer is an accessible same-tab `Link` to `/tpo/more`, not an overlay. The case now asserts its navigation role, active-page cue, destination and no new-tab behavior. Shared overlay checks remain intact. Not executed locally.

- `tests/unit/learner-contact-edit.test.ts`: test corrected in `be26efbdf19602ca80c5c3f01ecc3149b7782f2a` to use persisted digits-only alternate phone representation (`919876543210`), and additionally assert formatted input (`+91 9876543210`) is rejected. Existing strict `src/modules/people/learner-contact-model.ts` checks and service-side comparison stay unchanged; not executed locally.

## Failures (from CI log)

### tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts > PROJ-BREAK-MENTOR calendar and resource directory independent user safety > PROJ-BREAK-MENTOR-40 meeting links allow only credential-free web protocols
AssertionError: expected 'https://video.example.edu/room' to be null

- Expected:
null

+ Received:
"https://video.example.edu/room"

 ❯ tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts:32:66
     30|   }
     31|   expect(safeMentorMeetingJoinUrl(base)).toBe("https://video.example.e…
     32|   expect(safeMentorMeetingJoinUrl({...base,status:"REQUESTED"})).toBeN…
       |                                                                  ^
     33|   expect(safeMentorMeetingJoinUrl(base,NOW)).toBeNull();
     34|   expect(mentorMeetingDisplayStatus(base,NOW)).toBe("MISSED");
```

### tests/unit/chat12-drive-visibility-overrides.test.ts

```
 FAIL  tests/unit/chat12-drive-visibility-overrides.test.ts > TPO drive visibility overrides > TPO-students-12 uses scoped PUT/DELETE eligibility APIs and a guarded confirmation
AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'The eligibility rules still protect c…'

- Expected
+ Received

- The eligibility rules still protect college and cohort targeting.
+ "use client";
+ import {Textarea} from "@/components/ui/textarea";
+ import {Select} from "@/components/ui/select";
+ import {useId,useState} from "react";
+ import {useRouter} from "next/navigation";
+ import {apiFetch} from "@/lib/api-fetch";
+ import {useGuardedAction} from "@/hooks/use-guarded-action";
+ import {Dialog} from "@/components/ui/dialog";
+ import {Button} from "@/components/ui/button";
```

### tests/unit/chat2-UX-tpo-overlay-coverage.test.ts

```
 FAIL  tests/unit/chat2-UX-tpo-overlay-coverage.test.ts > UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-mobile-footer.tsx keeps a named shared overlay and scoped interaction
AssertionError: expected '"use client";\nimport Image from "nex…' to contain '<BottomSheet'

- Expected
+ Received

- <BottomSheet
+ "use client";
+ import Image from "next/image";
+ import Link from "next/link";
+ import "@/components/shell/legacy-mobile-footer.css";
+ import { usePathname } from "next/navigation";
+
+ /** Legacy phone footer destinations. More opens the actual /tpo/more page
+  * instead of a competing BottomSheet that hid the page navigation. */
+ const links = [
```

### tests/unit/chat6-application-score-precision.test.ts

```
 FAIL  tests/unit/chat6-application-score-precision.test.ts > Super Admin application scores > sorts on the persisted fractional round score before paging, never integer-truncates
AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'sql`${source.screeningScore} asc null…'

- Expected
+ Received

- sql`${source.screeningScore} asc nulls first`
+ import "server-only";
+
+ import { and, asc, desc, count, eq, exists, gte, lte, ilike, isNull, lt, or, sql } from "drizzle-orm";
+ import { z } from "zod";
+ import { getDb } from "@/db/client";
+ import {
+   collegeMemberships, learnerProfiles, placementApplications, placementApplicationScreenings,
+   placementJobRoleOptions, placementJobs, placementCompanies, placementCompanyRelationships, users,
+   cohorts, departments, learnerProgramEnrollments, programs, colleges,
```

### tests/unit/chat8-verify2-mapping-stale.test.ts

```
 FAIL  tests/unit/chat8-verify2-mapping-stale.test.ts > lane-8 semester mapping stale refresh controls > blocks stale term data but keeps validation errors independently correctable
AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'if (mappingStale || refreshing || inF…'

- Expected
+ Received

- if (mappingStale || refreshing || inFlight.current) return;
+ "use client";
+
+ import { Select } from "@/components/ui/select";
+ import { Input } from "@/components/ui/input";
+ import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
+ import { usePathname, useRouter } from "next/navigation";
+ import Link from "next/link";
+ import { Alert } from "@/components/ui/alert";
+ import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
```

### tests/unit/learner-contact-edit.test.ts

```
 FAIL  tests/unit/learner-contact-edit.test.ts > Learner contact-only edit validation > permits confirmed, properly formatted alternate contact fields
ZodError: [
  {
    "code": "custom",
    "path": [
      "contacts",
      "alternatePhone"
    ],
    "message": "Alternate phone number must be 10 to 15 digits"
  },
  {
    "code": "custom",
    "path": [
      "contacts",
      "alternatePhone"
    ],
```

### tests/unit/ux-admin-chat9-batch-04.test.ts

```
 FAIL  tests/unit/ux-admin-chat9-batch-04.test.ts > chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-01 preserves shared UX and scoped route behavior
AssertionError: expected 'import SuperAdminTenantSetup from "./…' to contain '<Input'

- Expected
+ Received

- <Input
+ import SuperAdminTenantSetup from "./setup/page";
+ import TenantDirectory from "./directory/page";
+
+ /** Old Tenant Setup lands in the two-step structure/launch workspace.
+  * The independent college directory remains reachable as a secondary route.
+  * Keep existing filtered directory deep links working after the route split.
+  */
+ export default async function SuperAdminTenantLanding({searchParams}:{
+  searchParams:Promise<Record<string,string|string[]|undefined>>;
```

