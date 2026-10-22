# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-fixed-on-main-verified.test.ts (1 failing)
- Chat-5 FIXED-ON-MAIN evidence revalidation > TPO-batches-29 redirects legacy tab deep links to the registered workspace routes

  ```
  AssertionError: expected 'import { StackedMetricBar } from "@/c…' to contain 'redirect("/tpo/batches/"+encodeURICom…'
  - Expected
  + Received
  - redirect("/tpo/batches/"+encodeURIComponent(batchId)+"/"+aliases[selected])
  + import { StackedMetricBar } from "@/components/ui/stacked-metric-bar";
  + import batchStyles from "@/components/tpo/legacy-batch-eligibility.module.css";
  + import Link from "next/link";
  + import {tpoBatchReturnHref} from "@/modules/placements/tpo-batch-return-model";
  ```

## tests/unit/chat6-admin-second-third-placements.test.ts (2 failing)
- /admin placements second-third: scoping, filtering, counts, links > CHAT6-ADMIN-DRIVES-01 maps only published drives to active and caps paginated results

  ```
  AssertionError: expected [ 'cancelled', 'closed' ] to deeply equal [ 'closed', 'cancelled' ]
  - Expected
  + Received
  [
  -   "closed",
  "cancelled",
  +   "closed",
  ]
  ```
- /admin placements second-third: scoping, filtering, counts, links > CHAT6-ADMIN-APPLICATIONS-01 rejects duplicate query selectors and forged tenant IDs

  ```
  AssertionError: expected { q: '', status: 'ALL', …(8) } to be null
  - Expected:
  null
  + Received:
  {
  "attention": "ALL",
  "page": 1,
  "q": "",
  ```

## tests/unit/chat6-faculty-assignment-batch-101.test.ts (1 failing)
- SA-academics-people-101 multi-course faculty assignment > shows legacy Course(s) multi-selection within one class and retains inputs after a failed save

  ```
  AssertionError: expected '"use client";\n\nimport {useState, ty…' to contain 'item.sectionId===selected.sectionId'
  - Expected
  + Received
  - item.sectionId===selected.sectionId
  + "use client";
  +
  + import {useState, type FormEvent} from "react";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat6-people-legacy-copy-round11.test.ts (1 failing)
- Super Admin People legacy wording > SA-academics-people-91 preserves registered faculty headings, OTP help and create edit feedback

  ```
  AssertionError: expected 'import {getCurrentRequestContext} fro…' to contain 'Used for OTP login'
  - Expected
  + Received
  - Used for OTP login
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {ScopedMembershipLifecycleActions} from "@/components/admin/scoped-membership-lifecycle-actions";
  + import {CollegePersonEditAction} from "@/components/college/college-person-edit-action";
  + import {CollegePersonAuditModal} from "@/components/college/college-person-audit-modal";
  ```

## tests/unit/chat6-superadmin-middle-lessons-role-25.test.tsx (2 failing)
- SA-middle-lessons-25 scoped authoring role journey > supports an unselected platform scope without reading private lessons

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'Select a college to continue'
  Expected: "Select a college to continue"
  Received: "<div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[-
  ```
- SA-middle-lessons-25 scoped authoring role journey > authorized selected-college listing renders a meaningful empty state

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ LessonPageSizePreference src/components/courses/lesson-page-size-preference.tsx:13:18
  11|   storageKey:"admin-lessons-page-size"|"college-lessons-page-size";
  12| }) {
  13|   const router = useRouter();
  |                  ^
  14|   useEffect(() => {
  ```

## tests/unit/chat7-college-assessment-export-service-weak.test.ts (4 failing)
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > rejects extra query keys, invalid filters and custom page parameters before making an authorized service read

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
  Received:
  1st vi.fn() call:
  Array [
  Object {},
  "QUIZ",
  Object {
  "duePresence": "ALL",
  ```
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns quoted spreadsheet and bounded pagination

  ```
  AssertionError: expected undefined to be 'QUIZ' // Object.is equality
  - Expected:
  "QUIZ"
  + Received:
  undefined
  ```
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and never fetches page 41

  ```
  AssertionError: expected "vi.fn()" to be called 40 times, but got 41 times
  ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:63:24
  61|   expect(out.truncated).toBe(true);
  62|   expect(out.cap).toBe(1000);
  63|   expect(state.reader).toHaveBeenCalledTimes(40);
  |                        ^
  64|   expect(out.csv).toContain("EXPORT TRUNCATED");
  65|   expect(out.csv).toContain("Only the first 1000 matching records");
  ```
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and never fetches page 41

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:56:51
  54|  it("cannot silently export more than 1000 rows, labels truncated set …
  55|   state.reader.mockImplementation(async (_ctx,_kind,query)=>({
  56|    items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
  |                                                   ^
  57|    total:1001,totalPages:41,
  58|   }));
  ```
