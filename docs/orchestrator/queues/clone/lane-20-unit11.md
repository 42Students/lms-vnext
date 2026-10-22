# Unit-test repair queue (unit11): lane chat-20

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-20-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/UX-kit-scroll-motion-01.test.tsx` (1 failing)
- [ ] `tests/unit/chat17-tenant-domain-service-journeys.test.ts` (1 failing)
- [ ] `tests/unit/chat3-superadmin-applications-retained.test.ts` (1 failing)
- [ ] `tests/unit/chat7-lesson-inline-transaction-verify2b.test.ts` (1 failing)
- [ ] `tests/unit/company-share-code-live-grant-guard.test.ts` (1 failing)
- [ ] `tests/unit/t-s2-07-tpo-undo.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-kit-scroll-motion-01.test.tsx

```
 FAIL  tests/unit/UX-kit-scroll-motion-01.test.tsx > UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-07 skeleton shimmer and disclosure honor reduced-motion defaults
AssertionError: expected '<details data-slot="disclosure" class…' to contain 'min-h-11'

Expected: "min-h-11"
Received: "<details data-slot="disclosure" class="group min-w-0 border-t border-[var(--lms-canvas-border)]"><summary style="min-height:44px" class="flex cursor-pointer list-none items-center justify-between gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] px-[var(--lms-space-2)] py-[var(--lms-space-2)] text-[13px] font-semibold leading-5 text-[var(--lms-body-text)] hover:text-[var(--lms-primary-text)] group-open:text-[var(--lms-primary-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] focus-visible:outline-offset-[3px] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)] motion-reduce:transition-none [&amp;::-webkit-details-marker]:hidden">More details<span aria-hidden="true" class="shrink-0 transition-transform duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] group-open:rotate-180 motion-reduce:transition-none">⌄</span></summary><div class="min-w-0 pb-[var(--lms-space-2)]"><p>Hidden grade</p></div></details>"

 ❯ tests/unit/UX-kit-scroll-motion-01.test.tsx:108:20
    106|     expect(detail).toContain("<details");
    107|     expect(detail).toContain("<summary");
    108|     expect(detail).toContain("min-h-11");
       |                    ^
    109|     expect(detail).toContain("motion-reduce:transition-none");
    110|     const css=read("src/app/globals.css");

```

### tests/unit/chat17-tenant-domain-service-journeys.test.ts

```
 FAIL  tests/unit/chat17-tenant-domain-service-journeys.test.ts > WEAK-tenant-domains service authorization, idempotency and hostile host journeys > WEAK-tenant-domains-12 verified host is idempotent; missing token fails closed
AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times

Received:

  1st vi.fn() call:

    Array [
      "portal.example.edu",
      "opaque-proof",
    ]


Number of calls: 1

 ❯ tests/unit/chat17-tenant-domain-service-journeys.test.ts:160:24
```

### tests/unit/chat3-superadmin-applications-retained.test.ts

```
 FAIL  tests/unit/chat3-superadmin-applications-retained.test.ts > Super Admin scoped applications stale refresh > checks Super Admin college scope before loading and keys memory by actor, college, job and filters
AssertionError: expected 'import {AdminDriveApplicationsRetaine…' to contain 'key={snapshotKey} failed retryHref={r…'

- Expected
+ Received

- key={snapshotKey} failed retryHref={retryHref}
+ import {AdminDriveApplicationsRetained} from "@/components/admin/admin-drive-applications-retained";
+ import {CollegeDriveApplicationsSizeControl} from "@/components/placements/college-drive-applications-size-control";
+ import {LastKnownGoodApplications} from "@/components/placements/last-known-good-applications";
+ import Link from "next/link";
+ import { redirect } from "next/navigation";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { getPlacementJobLegacyDetail } from "@/modules/placements/job-service";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { Tabs } from "@/components/ui/tabs";
```

### tests/unit/chat7-lesson-inline-transaction-verify2b.test.ts

```
 FAIL  tests/unit/chat7-lesson-inline-transaction-verify2b.test.ts > legacy curriculum authoring and links > validates nested legacy contents and rolls back all inserts atomically
AssertionError: expected 'import {\n  and,\n  asc,\n  desc,\n  …' to contain 'const {contentsDTOs,lessonName,...les…'

- Expected
+ Received

- const {contentsDTOs,lessonName,...lessonFields}=rawObject
+ import {
+   and,
+   asc,
+   desc,
+   eq,
+   isNotNull,
+   isNull,
+   sql,
+ } from "drizzle-orm";
```

### tests/unit/company-share-code-live-grant-guard.test.ts

```
 FAIL  tests/unit/company-share-code-live-grant-guard.test.ts > company share email challenge live-grant authorization > does not accept an arbitrary recipient and preserves send limits
AssertionError: expected '(\n context:RequestContext,rawToken:u…' to contain 'if(sent.length>=3)return'

- Expected
+ Received

- if(sent.length>=3)return
+ (
+  context:RequestContext,rawToken:unknown,
+ ):Promise<"SENT"|"DENIED"|"TOO_SOON"|"LIMITED"|"UNAVAILABLE">{
+  const token=companyShareTokenSchema.safeParse(rawToken);
+  if(!token.success||!await companyShareTablesReady()||!hasActiveRecruiter(context)||
+     !context.recruiter||context.recruiter.userId!==context.user.id)return "DENIED";
+  // A dedicated non-login template must be provisioned; never send a share
+  // challenge through the authentication OTP template.
+  if(!resolveZeptoMailTemplateId({kind:"TPO",templateName:"company-share-access"}))
```

### tests/unit/t-s2-07-tpo-undo.test.ts

```
 FAIL  tests/unit/t-s2-07-tpo-undo.test.ts > T-S2-07 30-second undo send > starts only from persisted dispatch for scheduled notices, in both UI and write guard
AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'row.sentAt??(row.scheduledAt===null?r…'

- Expected
+ Received

- row.sentAt??(row.scheduledAt===null?row.createdAt:null)
+ import { DateInput } from "@/components/ui/date-input";
+ import { Tabs } from "@/components/ui/tabs";
+ import {StatusBadge} from "@/components/ui/status-badge";
+ import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
+ import {Button} from "@/components/ui/button";
+ import {Textarea} from "@/components/ui/textarea";
+ import {Input} from "@/components/ui/input";
+ import Link from "next/link";
+ import { Checkbox } from "@/components/ui/checkbox";
```

