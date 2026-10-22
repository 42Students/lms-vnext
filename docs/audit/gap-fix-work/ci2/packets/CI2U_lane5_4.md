# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-results-coverage-01.test.ts (1 failing)
- UX-teacher-results-01 /teacher/results keeps report scope and state contracts

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<PageHeader eyebrow="Faculty · Assess…'
  - Expected
  + Received
  - <PageHeader eyebrow="Faculty · Assessments" title="Assessment results"
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/UX-tpo-batches-batchid-rules-01.test.ts (1 failing)
- UX-tpo-batches-batchid-rules-01 /tpo/batches/[batchId]/rules > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {PageHeader} from \"@/components/ui/page-header\";
  import {batchRuleDate} from \"@/modules/placements/tpo-batch-labels-model\";
  import {TpoBatchRuleEditor} from \"@/components/tpo/tpo-batch-rule-editor\";
  import {tpoBatchRuleOverridesSchema} from \"@/modules/placements/tpo-batch-rules-model\";
  ```

## tests/unit/UX-tpo-first-cross-audit-chat6.test.ts (2 failing)
- Chat-6 independent TPO first-third cross-audit > UX-tpo-audit-21 audit grid uses mobile cards and retains selection and copy

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- Chat-6 independent TPO first-third cross-audit > UX-tpo-calendar-21 follow-up creation preserves native back and IST

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Discard this unfinished follow-up?'
  - Expected
  + Received
  - Discard this unfinished follow-up?
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/UX-verification-education-table-chat17.test.ts (2 failing)
- UX-UNOWNED-TABLE-06 private verification education grid > displays only five bounded, permitted fields with legacy fallback copy

  ```
  AssertionError: expected { id: '3', level: 'B.Tech', …(4) } to deeply equal { id: '3', level: 'B.Tech', …(4) }
  - Expected
  + Received
  {
  "id": "3",
  -   "institution": "",
  +   "institution": "Institute A",
  "level": "B.Tech",
  ```
- UX-UNOWNED-TABLE-06 private verification education grid > uses the reusable phone-accessible DataTable but leaves private document links guarded

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'Open {doc.purpose.toLowerCase()} (pri…'
  - Expected
  + Received
  - Open {doc.purpose.toLowerCase()} (private signed link)
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat11-college-projects-pages-adversarial.test.ts (4 failing)
- PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries > PROJ-BREAK-COL-PAGES-01 /workspaces/new/page.tsx refuses unselected/wrong-college navigation

  ```
  AssertionError: workspaces/new/page.tsx: expected 'import {redirect} from "next/navigati…' to contain 'getCurrentRequestContext()'
  - Expected
  + Received
  - getCurrentRequestContext()
  + import {redirect} from "next/navigation";
  + /** Retain team-creation bookmarks; the canonical create page now offers
  +  * single, team and cohort workspace modes side by side.
  +  */
  ```
- PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries > keeps malformed URL filters recoverable without loading projects

  ```
  AssertionError: expected 2450 to be less than -1
  ❯ tests/unit/chat11-college-projects-pages-adversarial.test.ts:31:19
  29|   const list=source.indexOf("listProjectAdminSnapshots(context, colleg…
  30|   expect(invalid).toBeGreaterThan(0);
  31|   expect(invalid).toBeLessThan(list);
  |                   ^
  32|   expect(source).toContain('href="/college/projects"');
  33|  });
  ```
- PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries > missing optional template labels must not hide actual project workspaces

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listProjectAdminSnapshots(context, co…'
  - Expected
  + Received
  - listProjectAdminSnapshots(context, collegeId, query)
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries > does not produce a class team when authority or published templates are unavailable

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'await requireTeamCreationAuthority(co…'
  - Expected
  + Received
  - await requireTeamCreationAuthority(context, collegeId)
  + import {redirect} from "next/navigation";
  + /** Retain team-creation bookmarks; the canonical create page now offers
  +  * single, team and cohort workspace modes side by side.
  +  */
  ```

## tests/unit/chat11-super-admin-module-metrics-scope.test.ts (1 failing)
- SA-tenants-modules-R01 module access overview only counts authorized students > counts only live learners' memberships and their membership-scoped rules

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'countDistinct(moduleAccessRules.id)'
  - Expected
  + Received
  - countDistinct(moduleAccessRules.id)
  + import "server-only";
  + import {and,countDistinct,eq,inArray} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,membershipRoles,moduleAccessRules,colleges,users} from "@/db/schema";
  ```
