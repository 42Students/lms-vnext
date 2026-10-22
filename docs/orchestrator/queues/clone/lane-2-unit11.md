# Unit-test repair queue (unit11): lane chat-2

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-2-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/HR-BREAK-chat15-company-report-archive-31.test.ts` (1 failing)
- [x] `tests/unit/UX-learning-cross-audit-chat17.test.ts` (2 failing)
- [x] `tests/unit/chat17-verify2b-contact-more-parity.test.ts` (1 failing)
- [x] `tests/unit/chat3-verify2-retention-and-assignments.test.ts` (1 failing)
- [x] `tests/unit/chat7-round3-faculty-contracts.test.ts` (1 failing)
- [x] `tests/unit/db04-profile-document-format.test.ts` (1 failing)
- [x] `tests/unit/tpo-drives-chat-3-round4.test.ts` (1 failing)

## Repairs on chatgpt/chat-2-b (static checks; CI not run)
- `UX-learning-cross-audit-chat17.test.ts`: `31cfcf602895d12447f9ec0679c1bd3eee2aef28` and `dd0528d6a09e06ef7c28066032d0e0ae82300824` — retained safe HTTPS links and removed new-tab navigation.
- `chat17-verify2b-contact-more-parity.test.ts`: `6a130ed59f3f367bf7a711be6dee2753afbd9f8e` — eliminated obsolete overlay reference in source comment while keeping direct More route.
- `db04-profile-document-format.test.ts`: `fb9a905f513786136332be96f4cbf23b8b401f86` — accept formatted numeric phone and reject alphabetic input.

- `chat3-verify2-retention-and-assignments.test.ts`: `1ecc0b0be3dc76079983d14e94f79b6dd98266a6`, `9d83e04a6b09120554fdc574163ded7218aeaa51` — visible assignment review lists allowed methods and resources.
- `chat7-round3-faculty-contracts.test.ts`: `c000ce8eb15a1555640e63c82afcdfd1f6029fd4` — display academic period code on course card.
- `tpo-drives-chat-3-round4.test.ts`: `310068edc28b731032818c901ff4a2709f963975` — preserve scoped clone picker wiring and source contract.

- `HR-BREAK-chat15-company-report-archive-31.test.ts`: `67f49fbe3b90636be131bec65b67228f8dd86e85` — filter aggregated applicants by active college membership and active platform account.

## Failures (from CI log)

### tests/unit/HR-BREAK-chat15-company-report-archive-31.test.ts

```
 FAIL  tests/unit/HR-BREAK-chat15-company-report-archive-31.test.ts > HR-REPORT-ARCHIVE-31 published/closed company report portfolio parity > HR-REPORT-MEMBER-42 counts only shortlisted ACTIVE college members with ACTIVE student accounts
AssertionError: expected 'const reportCounts = jobIds.length ==…' to contain 'eq(collegeMemberships.status,"ACTIVE")'

- Expected
+ Received

- eq(collegeMemberships.status,"ACTIVE")
+ const reportCounts = jobIds.length === 0
+     ? []
+     : await db
+         .select({
+           jobId: placementApplications.jobId,
+           applications: sql<number>`
+             count(
+               distinct ${placementApplications.id}
+             )::integer
```

### tests/unit/UX-learning-cross-audit-chat17.test.ts

```
 FAIL  tests/unit/UX-learning-cross-audit-chat17.test.ts > chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learning-webview-fallback-01 makes validated destinations inspectable and focusable
AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'rel="noopener noreferrer"'

- Expected
+ Received

- rel="noopener noreferrer"
+ "use client";
+
+ import { useId, useState } from "react";
+ import { Button } from "@/components/ui/button";
+
+ /** WebView-safe external navigation with a user-selectable, copyable fallback.
+  * Clipboard failures never hide the original validated HTTPS URL. */
+ export function ThirdPartyLink({ href, label, ariaLabel }: { href: string; label: string; ariaLabel?: string }) {
+   const [showFallback, setShowFallback] = useState(false);

 FAIL  tests/unit/UX-learning-cross-audit-chat17.test.ts > chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learn-offers-03 opens own offer letter in same tab without losing label (LX-14)
AssertionError: expected '"use client";\n\nimport { useRef, use…' not to contain 'target="_blank"'

- Expected
+ Received

- target="_blank"
+ "use client";
+
+ import { useRef, useState } from "react";
+ import { useRouter } from "next/navigation";
+ import Link from "next/link";
+ import { learnerOfferAnchor, learnerOfferHref } from "@/modules/placements/learner-offer-deep-link-model";
+ import { Button } from "@/components/ui/button";
+ import { Dialog } from "@/components/ui/dialog";
+ import { learnerOfferAcceptancePreview } from "@/modules/placements/learner-offer-acceptance-preview";
```

### tests/unit/chat17-verify2b-contact-more-parity.test.ts

```
 FAIL  tests/unit/chat17-verify2b-contact-more-parity.test.ts > legacy contacts and TPO mobile navigation parity > sends phone More directly to the authenticated More page with an active state
AssertionError: expected '"use client";\nimport Image from "nex…' not to contain 'BottomSheet'

- Expected
+ Received

- BottomSheet
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

### tests/unit/chat3-verify2-retention-and-assignments.test.ts

```
 FAIL  tests/unit/chat3-verify2-retention-and-assignments.test.ts > Verify2 W1 lane-3 retained views and assignment authoring > reviews submission choices and resources before save, and validates PDF filename and grant failures
AssertionError: expected '"use client";\nimport { Radio } from …' to contain 'Review assignment before saving'

- Expected
+ Received

- Review assignment before saving
+ "use client";
+ import { Radio } from "@/components/ui/radio";
+ import { Checkbox } from "@/components/ui/checkbox";
+ import {
+   type FormEvent,
+   useEffect,
+   useRef,
+   useState,
+ } from "react";
```

### tests/unit/chat7-round3-faculty-contracts.test.ts

```
 FAIL  tests/unit/chat7-round3-faculty-contracts.test.ts > chat-7 round 3 faculty course contracts > FAC-courses-03 shows the assigned Section, batch and academic period on course cards
AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'course.academicPeriodCode'

- Expected
+ Received

- course.academicPeriodCode
+ import { Badge } from "@/components/ui/badge";
+ import { Disclosure } from "@/components/ui/disclosure";
+ import Link from "next/link";
+ import {FacultyCourseCover} from "./faculty-course-cover";
+ import {FacultyCourseFilterAutoSubmit} from "./faculty-course-filter-auto-submit";
+ import { facultyCourseListHref, type FacultyCourseListQuery } from "@/modules/courses/faculty-course-list-model";
+ import { COURSE_TEACHING_ROLES } from "@/modules/courses/constants";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { StatusBadge } from "@/components/ui/status-badge";
```

### tests/unit/db04-profile-document-format.test.ts

```
 FAIL  tests/unit/db04-profile-document-format.test.ts > DB04 learner profile formatting regressions > accepts valid alternate telephone digits and rejects alphabetic impostors
ZodError: [
  {
    "code": "custom",
    "path": [
      "contacts",
      "alternatePhone"
    ],
    "message": "Phone number must be 10-15 digits"
  }
]
 ❯ tests/unit/db04-profile-document-format.test.ts:7:41
      5| describe("DB04 learner profile formatting regressions", () => {
      6|   it("accepts valid alternate telephone digits and rejects alphabetic …
      7|     expect(learnerProfileDocumentSchema.parse({
       |                                         ^
```

### tests/unit/tpo-drives-chat-3-round4.test.ts

```
 FAIL  tests/unit/tpo-drives-chat-3-round4.test.ts > chat-3 Drives round 4 > TPO-drives-26 Create drive now provides a scoped clone-past picker
AssertionError: expected 'import { Disclosure } from "@/compone…' to contain '<TpoDriveClonePicker drives={pastDriv…'

- Expected
+ Received

- <TpoDriveClonePicker drives={pastDrives.map(job=>({
+ import { Disclosure } from "@/components/ui/disclosure";
+ import type { ReactNode } from "react";
+ import Link from "next/link";
+ import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
+ import {getDb} from "@/db/client";
+ import {placementJobs,sections,cohorts,programs as programsTable,departments} from "@/db/schema";
+ import { PlacementJobCreateForm } from "./placement-job-create-form";
+ import {TpoDriveClonePicker} from "./tpo-drive-clone-picker";
+ import { PageHeader } from "@/components/ui/page-header";
```


## Current-main recheck (2026-10-23)
- [x] Lane-2 unit11: all seven listed test files were already ticked on current `main`; prior repairs are recorded above (static review only; CI not rerun).
- [x] Overflow scan: lane-3 and lane-4 unit11 were already fully ticked on current `main`; moved to lane-5's next unticked `chat7-superadmin-learning-export-service-behavior.test.ts` (two historical failures). Current export service passes `{...params.data,page}` as the third argument to `listCollegeAssessmentAggregate` in both quiz and assignment branches, and retains filters for each page; historical `query.page` undefined error is not supported by this current source. Static inspection only; no claim of a passing CI run.
