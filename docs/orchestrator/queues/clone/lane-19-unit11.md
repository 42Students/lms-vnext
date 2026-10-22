# Unit-test repair queue (unit11): lane chat-19

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-19-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-kit-role-and-overlay-chat17.test.tsx` (1 failing)
- [x] `tests/unit/chat16-mentor-editor-guard-r5.test.ts` (1 failing)
- [x] `tests/unit/chat3-round9-origin-and-portal-regression.test.ts` (1 failing)
- [ ] `tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts` (1 failing)
- [x] `tests/unit/company-share-audit-columns-safety.test.ts` (1 failing)
- [ ] `tests/unit/superadmin-tenants-gap-closure.test.ts` (2 failing)

## Failures (from CI log)

### tests/unit/UX-kit-role-and-overlay-chat17.test.tsx

```
 FAIL  tests/unit/UX-kit-role-and-overlay-chat17.test.tsx > UX-kit-HARDEN-23 authorization boundaries and WebView history > UX-kit-HARDEN-32 external evidence rejects backslash, trailing whitespace and embedded controls
AssertionError: expected '<span class="inline-flex min-w-0 flex…' to contain 'target="_blank"'

Expected: "target="_blank""
Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.test/proof%20one" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 text-[14px] font-[650] leading-5 text-[var(--lms-link-text)] underline underline-offset-2 transition-colors duration-[var(--lms-motion-fast)] motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="mr-2 size-4 shrink-0"><rect x="3" y="5" width="13" height="14" rx="2"></rect><path d="m16 10 5-3v10l-5-3"></path></svg>Evidence<span class="sr-only"> (external website)</span></a><span class="flex flex-wrap gap-3"><button data-slot="button" data-variant="link" data-size="sm" type="button" aria-expanded="false" class="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_3px_rgba(26,149,161,0.15)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-busy:cursor-progress aria-busy:pointer-events-none enabled:active:translate-y-px motion-reduce:active:translate-y-0 border-transparent bg-transparent text-[var(--lms-link-text)] underline-offset-4 enabled:hover:underline enabled:hover:text-[var(--lms-link-text)] min-h-[var(--lms-control-height)] px-[var(--lms-space-3)] text-[13px] min-h-11 md:min-h-[var(--lms-control-height)] px-2 text-[14px] font-[650] underline! hover:underline! focus-visible:underline! underline-offset-2 hover:bg-[var(--lms-primary-subtle)] aria-expanded:bg-[var(--lms-primary-subtle)] aria-expanded:text-[var(--lms-primary-text)]">Show link to copy</button><button data-slot="button" data-variant="link" data-size="sm" type="button" class="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_3px_rgb
```

### tests/unit/chat16-mentor-editor-guard-r5.test.ts

```
 FAIL  tests/unit/chat16-mentor-editor-guard-r5.test.ts > chat-16 mentor editor safeguards > MEN-projects-meetings-75 intercepts in-app links until the mentor confirms draft discard
AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'target.pathname===window.location.pat…'

- Expected
+ Received

- target.pathname===window.location.pathname
+ "use client";
+ import {useEffect,useRef,useState} from "react";
+ import {canKeepProjectEditorMountedAcrossNavigation} from "@/modules/projects/project-navigation-guard-model";
+
+ /** MEN-projects-meetings-75: do not silently lose mentor edits to a dialog dismissal,
+  * full reload or an in-app Link navigation. Only a confirmed discard may navigate.
+  */
+ export function useProjectEditorDiscardGuard(
+  open:boolean,dirty:boolean,pending:boolean,onDiscard:()=>void,
```

### tests/unit/chat3-round9-origin-and-portal-regression.test.ts

```
 FAIL  tests/unit/chat3-round9-origin-and-portal-regression.test.ts > Chat-3 Round 9 restored contracts > TPO-drives-29/30/38 external employer portal uses noopener noreferrer
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
```

### tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts

```
 FAIL  tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts > chat-7 final sprint Super Admin courses and content > SA-academics-people-52 offers guarded selected-course bulk show hide and per-record failures
AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'selected.length!==input.courseIds.len…'

- Expected
+ Received

- selected.length!==input.courseIds.length
+ import "server-only";
+ import {and,eq,inArray,sql} from "drizzle-orm";
+ import {z} from "zod";
+ import {getDb} from "@/db/client";
+ import {academicPeriods,courseLessons,courseLearningPaths,courseOfferings,courses,departments,lessonContents} from "@/db/schema";
+ import type {RequestContext} from "@/modules/identity/context";
+ import {resolveActingCollege} from "@/modules/permissions/acting-college";
+ import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
+ import {bulkSuperAdminLessonVisibility} from "./super-admin-lesson-bulk-visibility";
```

### tests/unit/company-share-audit-columns-safety.test.ts

```
 FAIL  tests/unit/company-share-audit-columns-safety.test.ts > public share service selects only preview-approved candidate identity fields
AssertionError: expected 'import {learnerProfileDocumentSchema}…' to contain 'Object.fromEntries(columns.map(key=>[…'

- Expected
+ Received

- Object.fromEntries(columns.map(key=>[key,values[key]??"-"]))
+ import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
+ import {placementReportCsv} from "../report-model";
+ export const COMPANY_SHARE_COLUMNS={
+  APPLICATION_ID:"Applicant ID",NAME:"Name",ROLL_NUMBER:"Roll number",
+  BRANCH:"Branch",UG_BAND:"UG %",TENTH:"10th %",TWELFTH:"12th % / Diploma",
+  EMAIL:"Email",PHONE:"Phone",RESUME:"Resume",GITHUB:"GitHub",
+  PORTFOLIO:"Portfolio",STAGE:"Stage",
+ } as const;
+ export type CompanyShareColumn=keyof typeof COMPANY_SHARE_COLUMNS;
```

### tests/unit/superadmin-tenants-gap-closure.test.ts

```
 FAIL  tests/unit/superadmin-tenants-gap-closure.test.ts > Super Admin Tenants/Modules legacy gap contracts > SA-tenants-modules-03 scoped setup retains tenant navigation and administration controls
AssertionError: expected 'import SuperAdminTenantSetup from "./…' to contain 'caption="Tenant directory"'

- Expected
+ Received

- caption="Tenant directory"
+ import SuperAdminTenantSetup from "./setup/page";
+ import TenantDirectory from "./directory/page";
+
+ /** Old Tenant Setup lands in the two-step structure/launch workspace.
+  * The independent college directory remains reachable as a secondary route.
+  * Keep existing filtered directory deep links working after the route split.
+  */
+ export default async function SuperAdminTenantLanding({searchParams}:{
+  searchParams:Promise<Record<string,string|string[]|undefined>>;

 FAIL  tests/unit/superadmin-tenants-gap-closure.test.ts > Super Admin Tenants/Modules legacy gap contracts > SA-tenants-modules-13 tenant directory searches college and organization before paging
AssertionError: expected 'import SuperAdminTenantSetup from "./…' to contain 'type="search"'

- Expected
+ Received

- type="search"
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


## Branch fixes

- UX-kit same-tab link assertion: `b88496b`.
- Mentor draft navigation shared helper assertion: `57cdc9e`.
- Employer portal same-tab assertion: `fcc60f3`.
- Company share missing resume fail-closed fallback assertion: `2b9c1c6`.
- Tests not executed in connector environment; remaining failures are unticked.
