# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-final-sprint-tpo-batches.test.ts (1 failing)
- chat-15 final sprint: TPO batch workflow parity and adversarial boundaries > TPO-batches-44 sends audited bounded learner nudges and offers scoped private notes

  ```
  AssertionError: expected [ 'Register for placements', …(5) ] to deeply equal [ 'Register', 'Upload resume', …(4) ]
  - Expected
  + Received
  @@ -1,7 +1,7 @@
  [
  -   "Register",
  +   "Register for placements",
  "Upload resume",
  ```

## tests/unit/chat16-public-auth-error-states-05.test.tsx (1 failing)
- chat-16 public/auth route-level error, recovery and responsive states > UX-chat16-public-route-errors-07 renders retry fallbacks rather than exposing server exceptions

  ```
  TypeError: Cannot read properties of null (reading 'toString')
  ❯ RouteError src/app/quiz/error.tsx:12:37
  10|  const pathname=usePathname();
  11|  const search=useSearchParams();
  12|  const routeKey=pathname+"?"+search.toString();
  |                                     ^
  13|  const previous=useRef(routeKey);
  14|  // Quiz, review and embedded destinations cannot retain a previous qu…
  ```

## tests/unit/chat16-tpo-notification-preferences-write-16.test.ts (4 failing)
- chat-16 TPO personal notification preferences live mutation authorization > TPO-notifications-preferences-18 rechecks persisted active TPO inside the locked college transaction

  ```
  AssertionError: expected [Function] to throw error including 'placements.manage' but got 'NOT_READY'
  Expected: "placements.manage"
  Received: "NOT_READY"
  ```
- chat-16 TPO personal notification preferences live mutation authorization > TPO-notifications-preferences-19 refuses stale versions without rewriting preferences or audit

  ```
  AssertionError: expected [Function] to throw error including 'STALE' but got 'NOT_READY'
  Expected: "STALE"
  Received: "NOT_READY"
  ```
- chat-16 TPO personal notification preferences live mutation authorization > TPO-notifications-preferences-21 treats an identical stale retry as a no-op, without duplicate activity

  ```
  AssertionError: promise rejected "Error: NOT_READY { code: 'NOT_READY' }" instead of resolving
  ❯ tests/unit/chat16-tpo-notification-preferences-write-16.test.ts:84:60
  82|   const previous=new Date("2026-10-18T09:00:00Z");
  83|   const f=mockDb({...input,updatedAt:previous});
  84|   await expect(saveMyTpoNotificationPreferences(tpo,input)).resolves.t…
  |                                                            ^
  85|    saved:true,version:"2026-10-18T09:00:00.000Z",
  86|   });
  ```
- chat-16 TPO personal notification preferences live mutation authorization > TPO-notifications-preferences-20 makes one versioned first write and scoped audit event

  ```
  Error: NOT_READY
  ❯ src/modules/placements/tpo-my-notification-preferences-write.ts:30:46
  28|   const [locked]=await tx.select({id:colleges.id,status:colleges.statu…
  29|    .where(eq(colleges.id,collegeId)).for("update").limit(1);
  30|   if(!locked||locked.status!=="ACTIVE")throw new TpoPreferenceSaveErro…
  |                                              ^
  31|   // Lock and reconstruct the actor's real roles inside the transactio…
  32|   // a suspended/reassigned TPO cannot update preferences from a stale…
  ```

## tests/unit/chat2-company-trust-and-navigation.test.ts (2 failing)
- Chat-2 Company relationship and legacy Companies navigation > TPO-companies-20 defaults bare Companies to legacy Engage but preserves named and filtered company views

  ```
  AssertionError: expected 'import {TpoCompaniesSpreadsheet} from…' to contain 'redirect("/tpo/recruiters?view=compan…'
  - Expected
  + Received
  - redirect("/tpo/recruiters?view=companies")
  + import {TpoCompaniesSpreadsheet} from "@/components/tpo/tpo-companies-spreadsheet";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```
- Chat-2 Company relationship and legacy Companies navigation > TPO-companies-29 keeps accessible phone cards and per-company data without a second roster

  ```
  AssertionError: expected 'import {TpoCompaniesSpreadsheet} from…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import {TpoCompaniesSpreadsheet} from "@/components/tpo/tpo-companies-spreadsheet";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat2-tpo-last-third-policy-break-01.test.ts (1 failing)
- TPO-BREAK-last-third-01 verification, published stats and export filters > interprets waiting windows in IST and never treats UTC midnight as an India day boundary

  ```
  AssertionError: expected '2026-10-13T18:29:59.999Z' to be '2026-10-13T18:30:00.000Z' // Object.is equality
  Expected: "2026-10-13T18:30:00.000Z"
  Received: "2026-10-13T18:29:59.999Z"
  ```

## tests/unit/chat2-ux-tpo-report-pages.test.ts (9 failing)
- TPO report route UX contracts > UX-tpo-tpo-reports-ctc-01 uses accessible filter loading and 44px actions

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
  + import {ReportBarChart} from "@/components/placements/report-bar-chart";
  ```
- TPO report route UX contracts > UX-tpo-tpo-reports-intelligence-01 uses accessible filter loading and 44px actions

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- TPO report route UX contracts > UX-tpo-tpo-reports-failure-reasons-01 uses accessible filter loading and 44px actions

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import {ReportBarChart} from "@/components/placements/report-bar-chart";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- TPO report route UX contracts > UX-tpo-tpo-reports-by-branch-01 uses accessible filter loading and 44px actions

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
  + import {LEGACY_TPO_BRANCH_COLUMNS,legacyTpoBranchReportRow} from "@/modules/placements/tpo-branch-report-view-model";
  ```
- TPO report route UX contracts > UX-tpo-tpo-reports-by-company-01 uses accessible filter loading and 44px actions

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  ```
- TPO report route UX contracts > UX-tpo-tpo-reports-joining-status-01 uses accessible filter loading and 44px actions

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import {ReportBarChart} from "@/components/placements/report-bar-chart";
  + import Link from "next/link";
  ```
- TPO report route UX contracts > UX-tpo-tpo-reports-offers-acceptance-01 uses accessible filter loading and 44px actions

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import {ReportBarChart} from "@/components/placements/report-bar-chart";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- TPO report route UX contracts > UX-tpo-tpo-reports-placement-summary-01 shows accessible loading while report filters resolve

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  ```
- TPO report route UX contracts > UX-tpo-tpo-reports-unplaced-01 shows accessible loading while report filters resolve

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'fallback={<Skeleton variant="form" />…'
  - Expected
  + Received
  - fallback={<Skeleton variant="form" />}>
  + import { Input } from "@/components/ui/input";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { TpoReportPresentation } from "@/components/placements/tpo-report-presentation";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-admin-college-readiness-journey.test.ts (1 failing)
- SA-colleges-readiness-R01 authorized and accurate tenant launch journey > rejects invalid/ambiguous URL filters before reading the persisted readiness data

  ```
  AssertionError: expected -1 to be greater than 2511
  ❯ tests/unit/chat4-admin-college-readiness-journey.test.ts:28:20
  26|     expect(auth).toBeGreaterThan(-1);
  27|     expect(validate).toBeGreaterThan(auth);
  28|     expect(reject).toBeGreaterThan(validate);
  |                    ^
  29|     expect(read).toBeGreaterThan(reject);
  30|     expect(page).toContain('title="Invalid readiness filter"');
  ```

## tests/unit/chat4-college-ux-redirect-coverage.test.ts (1 failing)
- chat-4 College UX canonical redirects and shared-kit coverage > COL-ux-redirect-01 People entry lands on read-only contacts rather than privileged account management

  ```
  AssertionError: expected 'import CollegeContactsPage from "../c…' to contain '<CollegeContactsPage'
  - Expected
  + Received
  - <CollegeContactsPage
  + import CollegeContactsPage from "../contacts/page";
  +
  + /** Keep the historical /college-admin/people destination on the canonical
  +  * college workspace URL. The old shared directory maps to role-specific
  ```
