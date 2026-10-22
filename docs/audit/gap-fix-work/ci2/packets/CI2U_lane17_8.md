# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-unconfirmed-campaign-decisions.test.ts (1 failing)
- TPO public campaign ambiguous lifecycle decisions > TPO-campaigns-public-25 gives the public link an explicit audited on/off/replacement lifecycle rather than silent expiry

  ```
  AssertionError: expected 'import "server-only";\n\nimport { cre…' to contain 'expiresAt: new Date("9999-12-31T00:00…'
  - Expected
  + Received
  - expiresAt: new Date("9999-12-31T00:00:00.000Z")
  + import "server-only";
  +
  + import { createHash, randomBytes } from "node:crypto";
  + import { and, desc, eq, gt, isNull, inArray, sql } from "drizzle-orm";
  ```

## tests/unit/chat3-learner-round12-parity-contracts.test.ts (1 failing)
- chat-3 learner misc second-source verification > LEARNER-learning-misc-20 quiz cancellation warns before leaving

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'confirmLabel="Leave quiz"'
  - Expected
  + Received
  - confirmLabel="Leave quiz"
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Drawer} from "@/components/ui/drawer";
  + import {isSafeInternalHref} from "@/lib/safe-internal-href";
  ```

## tests/unit/chat4-college-academic-export-service.test.ts (1 failing)
- COL-academic-export-service-01 academic CSV export boundaries > caps batch CSV at 1000 rows, stops before page 41 and discloses truncation

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

## tests/unit/chat4-college-people-responsive-directory.test.tsx (4 failing)
- COL-UX-PEOPLE-TABLE-03 mobile privacy and desktop People directory > keeps learner actions and active academic context accessible without a wide native table

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ CollegeStudentBulkModuleAccess src/components/college/college-student-bulk-module-access.tsx:18:15
  16|  students:readonly Student[];
  17| }){
  18|  const router=useRouter();
  |               ^
  19|  const [selected,setSelected]=useState<string[]>([]);
  ```
- COL-UX-PEOPLE-TABLE-03 mobile privacy and desktop People directory > preserves faculty employment actions and never infers a nonexistent academic enrollment

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ CollegeFacultyScheduleReassign src/components/college/college-faculty-schedule-reassign.tsx:16:15
  14|  membershipId:string;name:string;
  15| }){
  16|  const router=useRouter(),[open,setOpen]=useState(false),
  |               ^
  17|  [busy,setBusy]=useState(false),[options,setOptions]=useState<Faculty[…
  ```
- COL-UX-PEOPLE-TABLE-03 mobile privacy and desktop People directory > does not render people from a rejected or revoked college role

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-6"
  + >
  ```
- COL-UX-PEOPLE-TABLE-03 mobile privacy and desktop People directory > removes the desktop-only raw table without removing the existing native phone cards

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'className="space-y-3 p-3 md:hidden"'
  - Expected
  + Received
  - className="space-y-3 p-3 md:hidden"
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts (3 failing)
- chat-4 final sprint TPO recruiter gaps A > TPO-recruiters-06 includes the Emails campaign view and count-bearing companies tab

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '["campaigns","Emails"]'
  - Expected
  + Received
  - ["campaigns","Emails"]
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- chat-4 final sprint TPO recruiter gaps A > TPO-recruiters-11 has company-aware invite, drive creation, and team talk

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'lead.manualStage === "NEW"'
  - Expected
  + Received
  - lead.manualStage === "NEW"
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```
- chat-4 final sprint TPO recruiter gaps A > TPO-recruiters-21 has company-required add, future follow-up and dirty-draft confirmation

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Choose a future follow-up date (IST).'
  - Expected
  + Received
  - Choose a future follow-up date (IST).
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat4-superadmin-college-domain-page-journey.test.tsx (4 failing)
- SA-colleges-domains-page-01 verified domain admin scope > allows managing only the selected authorized college and renders an empty state without fabricated hosts

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4" aria-b…' to contain 'IIT Dharwad'
  Expected: "IIT Dharwad"
  Received: "<div class="min-w-0 space-y-4" aria-busy="true" aria-label="Loading web address"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--l
  ```
- SA-colleges-domains-page-01 verified domain admin scope > passes persisted tenant domain facts and host ownership to the manager

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4" aria-b…' to contain 'lms.college.example.edu'
  Expected: "lms.college.example.edu"
  Received: "<div class="min-w-0 space-y-4" aria-busy="true" aria-label="Loading web address"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--l
  ```
- SA-colleges-domains-page-01 verified domain admin scope > denies a non-Super Admin role before domain metadata or tokens are queried

  ```
  TypeError: You must provide a Promise to expect() when using .rejects, not 'object'.
  ❯ tests/unit/chat4-superadmin-college-domain-page-journey.test.tsx:77:41
  75|    membership:{id:"learner",collegeId,organizationId:org,status:"ACTIV…
  76|   });
  77|   await expect(CollegeWebAddress(props)).rejects.toBeDefined();
  |                                         ^
  78|   expect(mocks.domains).not.toHaveBeenCalled();
  79|   expect(mocks.managed).not.toHaveBeenCalled();
  ```
- SA-colleges-domains-page-01 verified domain admin scope > 404s an unknown or out-of-scope tenant before reading domain metadata

  ```
  TypeError: You must provide a Promise to expect() when using .rejects, not 'object'.
  ❯ tests/unit/chat4-superadmin-college-domain-page-journey.test.tsx:83:41
  81|  it("404s an unknown or out-of-scope tenant before reading domain meta…
  82|   mocks.tenant.mockRejectedValueOnce(new CollegeServiceError("COLLEGE_…
  83|   await expect(CollegeWebAddress(props)).rejects.toThrow("NEXT_NOT_FOU…
  |                                         ^
  84|   expect(mocks.notFound).toHaveBeenCalledOnce();
  85|   expect(mocks.domains).not.toHaveBeenCalled();
  ```
