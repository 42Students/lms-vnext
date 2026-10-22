# Unit-test repair queue (unit11): lane chat-12

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-12-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx` (1 failing)
- [x] `tests/unit/chat13-faculty-bulk-stale-file-guard.test.ts` (1 failing)
- [x] `tests/unit/chat2-team-people-workload-links.test.ts` (1 failing)
- [x] `tests/unit/chat6-superadmin-middle-third-adversarial.test.ts` (1 failing)
- [x] `tests/unit/chat9-super-admin-unselected-college-copy.test.ts` (1 failing)
- [x] `tests/unit/proj-break-chat9-services.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx

```
 FAIL  tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx > UX-SPILL-TPO-CLIP-02: request mobile cards retain selection and full fields > keeps sorting, chooser and reset controls keyboard-focusable and 44px tall
AssertionError: expected '<section aria-label="Request row tool…' to match /<summary[^>]*min-h-11[^>]*>Choose col…/

- Expected:
/<summary[^>]*min-h-11[^>]*>Choose columns/

+ Received:
"<section aria-label=\"Request row tools\" class=\"space-y-2 border-y border-[var(--lms-canvas-border)] py-3\"><p class=\"text-sm font-semibold\">Select and copy request rows</p><p role=\"status\" aria-live=\"polite\" class=\"text-xs\">0 selected of 1 on this page.</p><div class=\"flex flex-wrap gap-3\"><label class=\"text-[13px]\">Sort request rows<select data-slot=\"select\" class=\"min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full min-w-0 cursor-pointer appearance-auto max-[767px]:text-[16px] max-[767px]:leading-6 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] py-[7px] font-[inherit] text-[var(--lms-font-base)] font-normal leading-5 tracking-[0.2px] text-[var(--lms-form-ink)] outline-none shadow-none transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--lms-motion-ease)] enabled:hover:border-[var(--lms-field-hover-border)] focus-visible:border-[var(--lms-primary)] focus-visible:shadow-[var(--lms-control-shadow)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] disabled:cursor-not-allowed disabled:select-none disabled:opacity-100 disabled:border-[var(--lms-canvas-border)] disabled:bg-[var(--lms-neutral-50)] disabled:text-[var(--lms-neutral-400)] aria-invalid:border-[var(--lms-error)] aria-invalid:bg-[rgba(239,68,68,0.06)] aria-invalid:enabled:hover:border-[var(--lms-error)] aria-invalid:focus-visible:border-[var(--lms-error)] aria-invalid:focus-visible:shadow-[0_0_0_2px_rgba(239,68,68,0.2)] aria-invalid:focus-visible:outline-[var(--lms-error)] aria-invalid:disabled:border-[var(--lms-canvas-border)] aria-invalid:disabled:bg-[var(--lms-neutral-50)] [&amp;_option:checked]:bg-[var(--lms-primary)] [&amp;_option:checked]:text-white [&amp;_option[value=&#x27;&#x27;]]:text-[var(--lms-placeholder)] motion-reduce:transition-none ml-2 min-h-11 max-w-full text-base\"><option value=\"ASKED_NEW\" selected=\"\">Asked · newest</option><option value=\"ASKED_OLD\">Asked · oldest</option><option value=\"DECIDED_NEW\">Decided on · newest</option><option value=\"DECIDED_OLD\">Decided on · oldest</option></select></label><details data-slot=\"disclosure\" class=\"group min-w-0 border-t border-[var(--lms-canvas-border)] min-w-0 max-w-full rounded border border-border p-2 text-sm\"><summary style=\"min-height:44px\" class=\"flex cursor-pointer list-none items-center justify-between gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] px-[var(--lms-space-2)] py-[var(--lms-space-2)] text-[13px] font-semibold leading-5 text-[var(--lms-body-text)] hover:text-[var(--lms-primary-text)] group-open:text-[var(--lms-primary-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] focus-visible:outline-offset-[3px] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)] motion-reduce:transition-none [&amp;::-webkit-details-marker]:hidden\">Choose columns<sp
```

### tests/unit/chat13-faculty-bulk-stale-file-guard.test.ts

```
 FAIL  tests/unit/chat13-faculty-bulk-stale-file-guard.test.ts > SA-FACULTY-CSV-17 prevent stale bulk onboarding after replacement file > guards against invalid replacement files, out-of-order File.text and double confirm
AssertionError: expected '"use client";\nimport { useRef, useSt…' to contain 'setCsv("");setResults([]);setError(""…'

- Expected
+ Received

- setCsv("");setResults([]);setError("");setPreviewVersion(-1);setFilename(file?.name??"")
+ "use client";
+ import { useRef, useState } from "react";
+ import { useRouter } from "next/navigation";
+ import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
+ import {canSubmitFacultyBulkImport} from "@/modules/people/faculty-bulk-import-submit-guard";
+ import {facultyBulkImportResponseSchema,facultyBulkImportFailureMessage} from "@/modules/people/faculty-bulk-import-response-model";
+ import { DataTable } from "@/components/ui/data-table";
+ import { Button } from "@/components/ui/button";
+ import { Alert } from "@/components/ui/alert";
```

### tests/unit/chat2-team-people-workload-links.test.ts

```
 FAIL  tests/unit/chat2-team-people-workload-links.test.ts > Team People persisted workload destinations > TPO-inbox-team-31 keeps historical team bookmarks in scoped canonical workspaces
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

### tests/unit/chat6-superadmin-middle-third-adversarial.test.ts

```
 FAIL  tests/unit/chat6-superadmin-middle-third-adversarial.test.ts > Chat-6 /admin middle-third read and application correctness > SA-admin-middle-applications-export-01 exports exactly the current filtered roster, not hidden candidates
AssertionError: expected 'import { getCurrentRequestContext } f…' to contain 'search.get("q")'

- Expected
+ Received

- search.get("q")
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { exportCollegeDriveApplicationsCsv } from "@/modules/placements/college-drive-applications-service";
+ import { driveApplicationsExportParams } from "@/modules/placements/college-drive-applications-model";
+
+ export async function GET(request: Request, {params}: {params:Promise<{jobId:string}>}) {
+   const context = await getCurrentRequestContext();
+   const {jobId}=await params;
+   const search=new URL(request.url).searchParams;
+   const parsed=driveApplicationsExportParams(search);
```

### tests/unit/chat9-super-admin-unselected-college-copy.test.ts

```
 FAIL  tests/unit/chat9-super-admin-unselected-college-copy.test.ts > Super Admin exact dev-legacy unselected-college copy > lecture-halls exact copy
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Choose a college in the header above …'

- Expected
+ Received

- Choose a college in the header above to see its lecture halls.
+ import Link from "next/link";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
+ import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
+ import { ErrorState } from "@/components/ui/error-state";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { Tabs } from "@/components/ui/tabs";
+ import { Alert } from "@/components/ui/alert";
+ import { Input } from "@/components/ui/input";
```

### tests/unit/proj-break-chat9-services.test.ts

```
 FAIL  tests/unit/proj-break-chat9-services.test.ts > IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-archive-01 archived projects never enter active override counts or result exports
AssertionError: expected 'import { and, desc, eq, inArray, isNu…' to contain 'ne(projectInstances.status, "ARCHIVED…'

- Expected
+ Received

- ne(projectInstances.status, "ARCHIVED")
+ import { and, desc, eq, inArray, isNull } from "drizzle-orm";
+ import { getDb } from "@/db/client";
+ import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
+ import { activityEvents, projectInstances, users } from "@/db/schema";
+ import type { RequestContext } from "@/modules/identity/context";
+ import { requirePermission } from "@/modules/permissions/policy";
+ import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
+ import { loadProjectCollegeScope } from "./scope";
+ import {getProjectAdminCollegeId} from "./admin-college-scope";
```


## Repair disposition (chat-12)

- UX-SPILL: current assertion checks the shared disclosure summary's 44px inline style; no controls or accessibility checks weakened.
- Faculty CSV: generation guard, reset including preview issues and submit latch all present in the current source; original string expectation in CI was outdated.
- TPO Team: People bookmark redirect, requests redirect and scoped Messages query redirect are present; earlier CI source was stale.
- Super Admin CSV: outdated inline search.get expectations replaced by strict shared export parser assertions in commit 380a705.
- Lecture Halls: exact legacy unselected-college string restored in commit ec87394.
- Projects: archived rows excluded from active readiness override list/export in commit a9a0ca5.

Static inspection only; no CI execution claimed.
