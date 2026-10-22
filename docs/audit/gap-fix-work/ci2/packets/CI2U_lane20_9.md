# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat6-auth-logout-revocation.test.ts (3 failing)
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > only reports success after the server token is revoked

  ```
  AssertionError: expected { ok: true, …(2) } to deeply equal { ok: true }
  - Expected
  + Received
  {
  +   "message": "Logged out",
  "ok": true,
  +   "reloginRequired": true,
  }
  ```
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > AUTH-sessions-05 DB outage reports 503, never ok:true; still expires this device's cookies

  ```
  AssertionError: expected { ok: false, …(4) } to deeply equal { ok: false, …(1) }
  - Expected
  + Received
  {
  "error": "LOGOUT_REVOKE_FAILED",
  +   "message": "Could not complete sign-out. Please retry.",
  "ok": false,
  +   "reloginRequired": true,
  ```
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > no prior token is an idempotent logout and never mutates device sessions

  ```
  AssertionError: expected { ok: true, …(2) } to deeply equal { ok: true }
  - Expected
  + Received
  {
  +   "message": "Logged out",
  "ok": true,
  +   "reloginRequired": true,
  }
  ```

## tests/unit/chat6-faculty-round2.test.ts (1 failing)
- chat-6 faculty assessments round 2 > FAC-assessments-24 submissions drawer shows quiz title count and legacy empty copy

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'title={quizTitle??"Submissions"}'
  - Expected
  + Received
  - title={quizTitle??"Submissions"}
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  + import {useEffect,useRef,useState} from "react";
  ```

## tests/unit/chat6-super-admin-session-route-breaker.test.ts (2 failing)
- AUTH-sessions-08 admin session route: origin, payload, tenancy and no-cache > AUTH-sessions-08 forwards only route-college and validated target to the persisted permission service

  ```
  AssertionError: expected { revoked: 2, ok: true, …(2) } to deeply equal { revoked: 2 }
  - Expected
  + Received
  {
  +   "ok": true,
  +   "partial": false,
  +   "refreshSessions": true,
  "revoked": 2,
  ```
- AUTH-sessions-08 admin session route: origin, payload, tenancy and no-cache > AUTH-sessions-08 GET requires target UUID, returns no-store sessions, never revokes

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```

## tests/unit/chat6-superadmin-people-verified-closure.test.ts (3 failing)
- chat-6 selected-college People gap verification > SA-academics-people-78 uses the legacy exact no-college title and contextual noun

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Choose a college in the header above …'
  - Expected
  + Received
  - Choose a college in the header above to see its
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
- chat-6 selected-college People gap verification > SA-academics-people-82 validates the 500-row faculty sample and preserves row result feedback

  ```
  AssertionError: expected 'import { z } from "zod";\nimport { pa…' to contain 'result.length > 500'
  - Expected
  + Received
  - result.length > 500
  + import { z } from "zod";
  + import { parseTpoImportCsvRecords } from "@/modules/placements/tpo-import-csv-parser";
  +
  + /** A legacy LECTURER remains a FACULTY. An explicit MENTOR also gains MENTOR
  ```
- chat-6 selected-college People gap verification > SA-academics-people-87 NOT-A-GAP prohibits impersonation per OD-23

  ```
  AssertionError: expected 'import {getCurrentRequestContext} fro…' not to contain 'Impersonate'
  - Expected
  + Received
  - Impersonate
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```

## tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts (4 failing)
- chat-7 final sprint Super Admin courses and content > SA-academics-people-50 validates short title, optional official code and colour independently from internal code

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-56 can edit archive reorder and open offering creation from the lesson directory

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Course / Offering'
  - Expected
  + Received
  - Course / Offering
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  +
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-64 connects assignments to publish archive and existing builder

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'assignment?"assignments":"quizzes"'
  - Expected
  + Received
  - assignment?"assignments":"quizzes"
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {Input} from "@/components/ui/input";
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-65 exposes quiz transitions, result releases and existing builder entry

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Export quizzes.csv'
  - Expected
  + Received
  - Export quizzes.csv
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```
