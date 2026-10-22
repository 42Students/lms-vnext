# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat14-final-col-academic-setup-21.test.ts (1 failing)
- chat-14 final sprint > COL-academic-setup-21 WRONG: department sort, search counter and page-size controls already exist

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'setNameOrder(nameOrder === "ASC" ? "D…'
  - Expected
  + Received
  - setNameOrder(nameOrder === "ASC" ? "DESC" : "ASC")
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
  ```

## tests/unit/chat16-final-col-placements-12.test.ts (1 failing)
- COL-placements-12 College Admin drive create field mapping > COL-placements-12 validates and persists assessment URL, deadline, dated milestones and custom eligibility

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'assessmentUrl:String(data.get("assess…'
  - Expected
  + Received
  - assessmentUrl:String(data.get("assessmentUrl")??"").trim()||null
  + "use client";
  +
  + import {
  +   useState,
  ```

## tests/unit/chat16-recruiter-email-inbound-gates-16.test.ts (1 failing)
- chat-16 authenticated inbound recruiter email failure gates > email-bridge-inbound-gate-17 rejects malformed JSON and invalid From/To before database access

  ```
  AssertionError: promise rejected "TypeError: Cannot read properties of unde…" instead of resolving
  ❯ tests/unit/chat16-recruiter-email-inbound-gates-16.test.ts:47:75
  45|   ];
  46|   for(const raw of cases){
  47|    await expect(acceptAuthenticatedRecruiterEmailReply(raw,sign(raw),e…
  |                                                                           ^
  48|     .resolves.toEqual(deny);
  49|   }
  ```

## tests/unit/chat2-UX-tpo-overlay-coverage.test.ts (5 failing)
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-new-followup-modal.tsx keeps a named shared overlay and scoped interaction

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
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-public-join-link-card.tsx keeps a named shared overlay and scoped interaction

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'PUBLIC_JOIN_LINK_COPY.replaceExplanat…'
  - Expected
  + Received
  - PUBLIC_JOIN_LINK_COPY.replaceExplanation
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-student-quick-panel.tsx keeps a named shared overlay and scoped interaction

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'Retry loading student details'
  - Expected
  + Received
  - Retry loading student details
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay-tpo-students-bulk-debar.tsx keeps a named shared overlay and scoped interaction

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'Confirm bulk debarment'
  - Expected
  + Received
  - Confirm bulk debarment
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Select } from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```
- UX-tpo-overlay component coverage: accessible dialogs, names and guarded actions > UX-tpo-overlay shared modal title/focus/escape and safe viewport cues have direct evidence

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'showModal()'
  - Expected
  + Received
  - showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat2-safe-deviations-open-gap-decisions.test.ts (1 failing)
- Safety justified deviations from legacy TPO UI > TPO-inbox-team-42 uses directly linked accessible mobile conversation pages rather than an inaccessible miniature three-pane view

  ```
  AssertionError: expected 'import { StatusBadge } from "@/compon…' to contain 'max-w-[88%]'
  - Expected
  + Received
  - max-w-[88%]
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import Link from "next/link";
  + import {listTpoTeamAsks} from "@/modules/placements/tpo-team-asks-service";
  + import {listTpoTeamAway} from "@/modules/placements/tpo-team-away-service";
  ```

## tests/unit/chat2-tpo-round-route-journeys-break-04.test.ts (2 failing)
- TPO-BREAK-round-route-04 actual handlers: hostile origins, spoofed identities and stale tabs > denies forged cross-origin interview reschedule before looking up a TPO session

  ```
  AssertionError: expected { Object (message) } to deeply equal { error: 'INVALID_ORIGIN' }
  - Expected
  + Received
  {
  -   "error": "INVALID_ORIGIN",
  +   "message": "Your session could not be verified. Refresh the page and try again.",
  }
  ```
- TPO-BREAK-round-route-04 actual handlers: hostile origins, spoofed identities and stale tabs > uses persisted session identity and scoped round params for bulk round decision

  ```
  AssertionError: expected 409 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 409
  ```

## tests/unit/chat3-superadmin-academics-people-audit-r2.test.ts (1 failing)
- Chat-3 second-eye Super Admin academics and people audit > SA3-PEOPLE-04 directory has explicit no-scope state, read-only masking, URL filter and pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'page=>adminUsersHref({...data.query,p…'
  - Expected
  + Received
  - page=>adminUsersHref({...data.query,page})
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-college-groups-directory-query-and-ux.test.ts (2 failing)
- College Admin Student groups directory query and role journey > COL-GROUPS-DIRECTORY-03 checks college manage permission before even parsing malformed filters or listing groups

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'Showing {offset + 1}'
  - Expected
  + Received
  - Showing {offset + 1}
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College Admin Student groups directory query and role journey > UX-COL-GROUPS-ONE-CANVAS-01 uses an unboxed filter area and existing responsive table actions

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'className="flex flex-wrap items-end g…'
  - Expected
  + Received
  - className="flex flex-wrap items-end gap-3 border-t border-border pt-4"
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
