# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-scoped-directory-states.test.tsx (2 failing)
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-105 optional summary failure keeps filtered primary records reachable

  ```
  AssertionError: expected 'Registered Students Scoped list Direc…' to contain '0 of 0 students'
  Expected: "0 of 0 students"
  Received: "Registered Students Scoped list Directory totals are temporarily unavailable. The filtered records below remain visible. Search Status Any status Active Suspended Ended Filter Filters Rows per page 0 matching records  · showing  0 – 0  · page  1  of  1"
  ```
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-106 legitimate empty list remains a distinct zero-state

  ```
  AssertionError: expected 4 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 4
  ```

## tests/unit/UX-teacher-scroll-motion-pass.test.ts (1 failing)
- Faculty scroll and motion cues > UX-teacher-scroll-motion-02 cues horizontal attendance and retains sticky learner column

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'className="sticky left-0 z-10 bg-surf…'
  - Expected
  + Received
  - className="sticky left-0 z-10 bg-surface px-3 py-3"
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/chat12-tpo-persisted-private-read-boundaries.test.ts (1 failing)
- PROJ-BREAK-TPO-READ-07 expired/revoked role cannot open student and company data routes > requires persisted actor before reading private student or company data: src/app/api/placements/tpo/students/export/route.ts

  ```
  AssertionError: expected 1320 to be less than -1
  ❯ tests/unit/chat12-tpo-persisted-private-read-boundaries.test.ts:19:22
  17|    const persisted=src.indexOf("await requireTpoBatchActor(context)");
  18|    expect(persisted).toBeGreaterThanOrEqual(0);
  19|    expect(persisted).toBeLessThan(src.indexOf(access));
  |                      ^
  20|    expect(src).not.toContain("readPublicCompanyDirectory(");
  21|   });
  ```

## tests/unit/chat15-hr-legacy-parity-54-55.test.ts (1 failing)
- HR legacy inventory B explicit UNKNOWN routes, source parity audit > HR-PARITY-55 legacy job Requests tab is mapped after the scoped hiring read

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'requestsTab&&requestData?.party==="CO…'
  - Expected
  + Received
  - requestsTab&&requestData?.party==="COMPANY"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
