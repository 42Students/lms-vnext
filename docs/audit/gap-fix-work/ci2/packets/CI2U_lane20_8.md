# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts (1 failing)
- SA-ACADEMICS-BATCH-COUNT-01 scoped active batch learner census > SA-ACADEMICS-BATCH-EMPTY-03 skips private learner reads when no scoped Sections exist

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat4-college-academics-people-weak-area.test.ts (2 failing)
- College academics/people weak-area behavioural ledger > COL-academics-CSV-01 uses neutralized formula cells, fixed field order, declared row cap and recorded data only

  ```
  TypeError: Cannot read properties of undefined (reading 'replace')
  ❯ safeCollegeCsvCell src/modules/academics/college-directory-export-model.ts:6:22
  4|  * invisible prefixes that some spreadsheet engines silently strip. */
  5| function safeCollegeCsvCell(value:string):string {
  6|  const visible=value.replace(/^[\s\p{Cf}\p{Mn}]*/u,"");
  |                      ^
  7|  return escapeActivityCsvCell(/^[-=+@]/u.test(visible)?"'"+value:value…
  8| }
  ```
- College academics/people weak-area behavioural ledger > COL-people-DIRECTORY-01 rejects duplicated, foreign, cross-role and out-of-range filters

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/chat4-college-academics-people-weak-area.test.ts:83:59
  81|    {sectionId:"javascript:alert(1)"},{q:"x".repeat(101)},
  82|   ]){
  83|    expect(()=>parseCollegeRoleDirectorySearchParams(raw)).toThrow();
  |                                                           ^
  84|   }
  85|   const faculty=collegeRoleDirectoryQuerySchema.parse({sectionId:colle…
  ```

## tests/unit/chat4-college-projects-reassignment-gap-closure.test.ts (1 failing)
- chat-4 college project mentorship bulk reassignment > COL-projects-R02 searches all mentors on server and retains bulk evidence

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain '{ q: mentorSearch, limit: 100 }'
  - Expected
  + Received
  - { q: mentorSearch, limit: 100 }
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-independent-findings-filters.test.ts (1 failing)
- SA-tenants-modules-48 persisted board filter states > SA-tenants-modules-48 calculates counts from SQL-scoped full matches, not one displayed page

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'const facetsWhere=and(searchPredicate…'
  - Expected
  + Received
  - const facetsWhere=and(searchPredicate,areaPredicate
  + import "server-only";
  + import {and,asc,count,desc,eq,ilike,inArray,or,sql,type SQL} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {db10AuditFindings,db10AuditFindingEvents,db10AuditFindingSyncs,db10AuditFindingFiles} from "@/db/schema/db10-audit-findings.draft";
  ```

## tests/unit/chat4-superadmin-college-subpages-role-audit.test.ts (2 failing)
- Super Admin college and tenant subpage threat and state audit > SA-COL-AUDIT-01 branding requires Super Admin scope and validates college before fetching stored URLs

  ```
  AssertionError: expected -1 to be greater than 1221
  ❯ tests/unit/chat4-superadmin-college-subpages-role-audit.test.ts:31:25
  29|     expect(guard).toBeGreaterThan(-1);
  30|     expect(id).toBeGreaterThan(guard);
  31|     expect(readPreview).toBeGreaterThan(id);
  |                         ^
  32|     expect(branding).toContain("if (!branding) notFound()");
  33|     expect(branding).toContain('can(context,"college.manage",{collegeI…
  ```
- Super Admin college and tenant subpage threat and state audit > SA-COL-AUDIT-03 verification protects college ID before reading queue and does not fabricate availability

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Invalid verification filters.'
  - Expected
  + Received
  - Invalid verification filters.
  + import Link from "next/link";
  + import {eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {profileVerificationSettings} from "@/db/schema/profile-verification";
  ```
