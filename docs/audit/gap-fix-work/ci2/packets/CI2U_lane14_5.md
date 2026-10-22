# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-bulk-force-include-14.test.ts (1 failing)
- TPO forced student drive inclusion > TPO-students-14 exposes a reasoned Add-to-Drive option but keeps the existing confirmation and per-row outcomes

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'runGuarded(submit)'
  - Expected
  + Received
  - runGuarded(submit)
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-round19-roster-responsive-counts.test.ts (1 failing)
- TPO Students phone presentation and scoped selection summary > TPO-students-51 shows two-column phone journey, focused row summary and collapsible details/actions

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'className="mt-5 grid grid-cols-2 gap-…'
  - Expected
  + Received
  - className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Student placement journey"
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  ```

## tests/unit/chat12-students-round2.test.ts (1 failing)
- chat-12 round-2 students compatibility and layout > TPO-students-R04 only has one journey and branch selector

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' not to contain 'key:"branchId"'
  - Expected
  + Received
  - key:"branchId"
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-tpo-verification-workflows.test.ts (1 failing)
- TPO-requests-verification-25 reviews each waiting request in sequence with next and finish

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Review one by one ('
  - Expected
  + Received
  - Review one by one (
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {useRouter,useSearchParams} from "next/navigation";
  ```

## tests/unit/chat13-ci-r1-repair-guards.test.ts (2 failing)
- chat-13 stale cloud CI report regression fences > SA-placements-projects-21 keeps current eligibility and nonfabricated match score copy

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'No fabricated public resume URL or ma…'
  - Expected
  + Received
  - No fabricated public resume URL or match score is shown.
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
- chat-13 stale cloud CI report regression fences > SA-placements-projects-36 preserves recruiter lifecycle labels even when controls change

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain '<h2 className="text-base font-semibol…'
  - Expected
  + Received
  - <h2 className="text-base font-semibold">Recruiter account lifecycle</h2>
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/chat13-north-star-hr-secondary-sweep.test.ts (3 failing)
- chat-13 NORTH STAR adjacent HR portal shared form chrome > reuses the shared Select/Button on employer-scoped drives

  ```
  AssertionError: expected 'import {StatusBadge} from "@/componen…' to contain '<Input name="q"'
  - Expected
  + Received
  - <Input name="q"
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- chat-13 NORTH STAR adjacent HR portal shared form chrome > keeps employer conversations' GET+POST workflows while normalizing controls

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain '<Button type="submit">Open general co…'
  - Expected
  + Received
  - <Button type="submit">Open general conversation</Button>
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- chat-13 NORTH STAR adjacent HR portal shared form chrome > keeps read-only bell inbox searching, and company team and reports forms

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain '<Button variant="secondary" type="sub…'
  - Expected
  + Received
  - <Button variant="secondary" type="submit">Search</Button>
  + import { Tabs } from "@/components/ui/tabs";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  ```
