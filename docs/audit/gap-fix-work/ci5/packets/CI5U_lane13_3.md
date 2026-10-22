# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-super-admin-session-hardening.test.ts (1 failing)
- Super Admin tenant sessions adversarial management > SA-colleges-sessions-RETRY-01 a zero-revocation retry never appends a duplicate security audit

  ```
  AssertionError: expected -1 to be greater than 9528
  ❯ tests/unit/chat4-super-admin-session-hardening.test.ts:28:16
  26|   expect(persisted).toBeGreaterThan(tx);
  27|   expect(update).toBeGreaterThan(persisted);
  28|   expect(noOp).toBeGreaterThan(update);
  |                ^
  29|   expect(audit).toBeGreaterThan(noOp);
  30|   expect(s).toContain("AND revoked_at IS NULL");
  ```

## tests/unit/chat5-placements-ux-workflows.test.ts (10 failing)
- chat-5 placement selection accessibility and recovery > UX-placements-scroll-motion-01 names and cues scrollable results while trapping overscroll

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to match /<fieldset[^>]*overflow-auto overscrol…/
  - Expected:
  /<fieldset[^>]*overflow-auto overscroll-contain[^>]*mask-image:/
  + Received:
  "\"use client\";
  import { Checkbox } from \"@/components/ui/checkbox\";
  import {useRef,useState} from \"react\";
  import {useRouter} from \"next/navigation\";
  ```
- chat-5 placement selection accessibility and recovery > UX-placements-selection-targets-01 keeps Select matching and Clear selection 44px tall

  ```
  AssertionError: expected -1 to be greater than or equal to 0
  ❯ tests/unit/chat5-placements-ux-workflows.test.ts:19:18
  17|   for(const label of ["Select matching (max 100)","Clear selection"]){
  18|    const start=selection.lastIndexOf("<button",selection.indexOf(label…
  19|    expect(start).toBeGreaterThanOrEqual(0);
  |                  ^
  20|    expect(selection.slice(start,selection.indexOf(">",start))).toConta…
  21|   }
  ```
- chat-5 placement selection accessibility and recovery > PLACEMENTS-SELECTION-ERROR-01 masks raw API codes and retains chosen selections on failure

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'if(!mode||!chosen.length||pending)ret…'
  - Expected
  + Received
  - if(!mode||!chosen.length||pending)return
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```
- chat-5 placement selection accessibility and recovery > UX-tpo-placements-jobs-jobid-waitlist-02 protects ranked release

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'empty={<p role="status">No applied wa…'
  - Expected
  + Received
  - empty={<p role="status">No applied waitlist results in the final round.</p>}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {Alert} from "@/components/ui/alert";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```
- chat-5 placement selection accessibility and recovery > UX-tpo-placements-jobs-jobid-offers-02 binds export to validated filters and ownership

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Offer register pages"'
  - Expected
  + Received
  - aria-label="Offer register pages"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 placement selection accessibility and recovery > UX-tpo-placements-jobs-jobid-offers-offerid-02 never infers employer acceptance from letter delivery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'inline-flex min-h-11 items-center'
  - Expected
  + Received
  - inline-flex min-h-11 items-center
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 placement selection accessibility and recovery > PLACEMENTS-JOINING-CONFIRM-01 does not mutate before confirmation, and retains corrected draft

  ```
  AssertionError: expected -1 to be greater than 2064
  ❯ tests/unit/chat5-placements-ux-workflows.test.ts:81:20
  79|   const mutation=form.indexOf("await fetch(");
  80|   expect(gate).toBeGreaterThan(0);
  81|   expect(mutation).toBeGreaterThan(gate);
  |                    ^
  82|   expect(form).toContain("setConfirmOpen(true)");
  83|   expect(form).toContain("onConfirm={()=>void save(true)}");
  ```
- chat-5 placement selection accessibility and recovery > UX-placements-bulk-round-targets-01 makes mass-selection a full touch target

  ```
  AssertionError: expected '"use client";\nimport { Disclosure } …' to contain 'className="inline-flex min-h-11 items…'
  - Expected
  + Received
  - className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)]">Select first 25 unmarked
  + "use client";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- chat-5 placement selection accessibility and recovery > UX-tpo-placements-jobs-jobid-rounds-roundid-results-02 filters before loading learner data

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'Bulk staging is unavailable when the …'
  - Expected
  + Received
  - Bulk staging is unavailable when the eligible roster exceeds 500
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Select } from "@/components/ui/select";
  ```
- chat-5: report mobile overlay scroll > UX-PLACEMENTS-REPORT-SCROLL-27 exposes keyboard, cue and safe-area for both report pickers

  ```
  AssertionError: expected 0 to be greater than or equal to 2
  ❯ tests/unit/chat5-placements-ux-workflows.test.ts:122:55
  120|   expect(markup).toContain('aria-label="Report column filters, scroll …
  121|   expect(markup).toContain('aria-label="Report columns, scroll for mor…
  122|   expect(markup.split("overscroll-contain").length-1).toBeGreaterThanO…
  |                                                       ^
  123|   expect(markup.split("mask-image:linear-gradient(to_bottom").length-1…
  124|   expect(markup.split("tabIndex={0}").length-1).toBeGreaterThanOrEqual…
  ```

## tests/unit/chat6-college-placements-round3-ui.test.ts (1 failing)
- College Admin drive UI and graceful failure > COL-placements-25 renders selectable action-capable mobile application and drive cards

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'caption="College placement drives"'
  - Expected
  + Received
  - caption="College placement drives"
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/chat6-recruiter-lifecycle-round3.test.ts (1 failing)
- Super Admin recruiter legacy lifecycle > SA-academics-people-114 restores recruiter accounts page search and college access copy

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

## tests/unit/chat6-superadmin-teaching-role-edit-101.test.ts (1 failing)
- SA-academics-people-101 role edit transactional contract > SA-academics-people-101 guards PATCH origin and offers create, edit, and end actions on the tab

  ```
  AssertionError: expected '"use client";\n\nimport {useState, ty…' to contain 'Save role'
  - Expected
  + Received
  - Save role
  + "use client";
  +
  + import {useState, type FormEvent} from "react";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat7-learner-course-discussion-coverage.test.ts (1 failing)
- chat-7 learner course Discussion capability and concurrency > UX-learn-discussion-limit-03 bounds persisted text at 3900 characters, rejecting whitespace-only input

  ```
  AssertionError: expected 4000 to be 3900 // Object.is equality
  - Expected
  + Received
  - 3900
  + 4000
  ```

## tests/unit/chat7-project-workspace-legacy-heading.test.ts (1 failing)
- Project workspace legacy title-only headings across roles > renders the real project title and optional persisted summary without invented eyebrow

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'title={workspace.project.title}'
  - Expected
  + Received
  - title={workspace.project.title}
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts (6 failing)
- Super Admin assessment export service scoped pagination > SA-academics-people-64/65 rejects duplicate, foreign-tenant, invalid status and assignment-only result filters before reading

  ```
  AssertionError: expected 403 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 403
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-64 passes the acting session and selected assignment filters to the authorized reader

  ```
  AssertionError: expected 403 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 403
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-65 never drops quiz results filters as later pages are read

  ```
  AssertionError: expected 403 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 403
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-65 never drops quiz results filters as later pages are read

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:49:21
  47|  it("SA-academics-people-65 never drops quiz results filters as later …
  48|   state.reader.mockImplementation(async (_context,_kind,query)=>{
  49|    const page=query.page as number;
  |                     ^
  50|    return {items:[row(page)],total:2,totalPages:2};
  51|   });
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-64 hard caps CSV at 500 rows and explicitly marks omitted records

  ```
  AssertionError: expected 403 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 403
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-64 hard caps CSV at 500 rows and explicitly marks omitted records

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:66:51
  64|  it("SA-academics-people-64 hard caps CSV at 500 rows and explicitly m…
  65|   state.reader.mockImplementation(async (_context,_kind,query)=>({
  66|    items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
  |                                                   ^
  67|    total:501,totalPages:21,
  68|   }));
  ```
