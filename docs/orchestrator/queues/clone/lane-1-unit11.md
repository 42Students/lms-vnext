# Unit-test repair queue (unit11): lane chat-1

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-1-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` (2 failing)
- [x] `tests/unit/UX-kit-states-chat17.test.tsx` (1 failing)
- [x] `tests/unit/chat17-verify2-team-removal-and-agenda.test.ts` (1 failing)
- [x] `tests/unit/chat3-tpo-supplemental-round14.test.ts` (1 failing)
- [x] `tests/unit/chat7-meeting-migration-contract.test.ts` (1 failing)
- [x] `tests/unit/company-share-mobile-cards.test.ts` (1 failing)
- [x] `tests/unit/tpo-audit-actor-display.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/COURSES-BREAK-FACULTY-06.test.ts

```
 FAIL  tests/unit/COURSES-BREAK-FACULTY-06.test.ts > COURSES-BREAK-FACULTY-06 current-roster report anti-IDOR and consistency > FAC-assessments-01 filters foreign and unenrolled learner attempts before summary and per-question accuracy
AssertionError: expected [ { …(6) }, { …(6) }, { …(6) } ] to have a length of 2 but got 3

- Expected
+ Received

- 2
+ 3

 ❯ tests/unit/COURSES-BREAK-FACULTY-06.test.ts:80:27
     78|  it("FAC-assessments-01 filters foreign and unenrolled learner attempt…
     79|   const report=await getFacultyQuizReport(actor,quizId,deliveryId);
     80|   expect(report.attempts).toHaveLength(2);
       |                           ^
     81|   expect(report.latestAttempts).toHaveLength(1);
     82|   expect(report.metrics).toMatchObject({

 FAIL  tests/unit/COURSES-BREAK-FACULTY-06.test.ts > COURSES-BREAK-FACULTY-06 current-roster report anti-IDOR and consistency > FAC-assessments-01 excludes foreign submissions from published grades, missing counts and late statistics
AssertionError: expected [ { …(5) }, { …(5) } ] to have a length of 1 but got 2

- Expected
+ Received

- 1
+ 2

 ❯ tests/unit/COURSES-BREAK-FACULTY-06.test.ts:91:30
     89|  it("FAC-assessments-01 excludes foreign submissions from published gr…
     90|   const report=await getFacultyAssignmentReport(actor,assignmentId,del…
     91|   expect(report.submissions).toHaveLength(1);
       |                              ^
     92|   expect(report.metrics).toMatchObject({eligibleLearners:1,submitted:1,
     93|    missing:0,onTime:1,late:0,graded:1,gradePublished:1,averagePercent:…
```

### tests/unit/UX-kit-states-chat17.test.tsx

```
 FAIL  tests/unit/UX-kit-states-chat17.test.tsx > UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-STATES-14 HTTPS links display fallback; script, HTTP and credential-bearing URLs never link
AssertionError: expected '<span class="inline-flex min-w-0 flex…' to contain 'rel="noopener noreferrer"'

Expected: "rel="noopener noreferrer""
Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.test/meet" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 text-[14px] font-[650] leading-5 text-[var(--lms-link-text)] underline underline-offset-2 transition-colors duration-[var(--lms-motion-fast)] motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="mr-2 size-4 shrink-0"><rect x="3" y="5" width="13" height="14" rx="2"></rect><path d="m16 10 5-3v10l-5-3"></path></svg>Join meeting<span class="sr-only"> (external website)</span></a><span class="flex flex-wrap gap-3"><button data-slot="button" data-variant="link" data-size="sm" type="button" aria-expanded="false" class="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_3px_rgba(26,149,161,0.15)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-busy:cursor-progress aria-busy:pointer-events-none enabled:active:translate-y-px motion-reduce:active:translate-y-0 border-transparent bg-transparent text-[var(--lms-link-text)] underline-offset-4 enabled:hover:underline enabled:hover:text-[var(--lms-link-text)] min-h-[var(--lms-control-height)] px-[var(--lms-space-3)] text-[13px] min-h-11 md:min-h-[var(--lms-control-height)] px-2 text-[14px] font-[650] underline! hover:underline! focus-visible:underline! underline-offset-2 hover:bg-[var(--lms-primary-subtle)] aria-expanded:bg-[var(--lms-primary-subtle)] aria-expanded:text-[var(--lms-primary-text)]">Show link to copy</button><button data-slot="button" data-variant="link" data-size="sm" type="button" class="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0
```

### tests/unit/chat17-verify2-team-removal-and-agenda.test.ts

```
 FAIL  tests/unit/chat17-verify2-team-removal-and-agenda.test.ts > chat-17 Verify2 team impact and legacy recruiter calendar > keeps the original event-only agenda as default while weekly and monthly views remain opt-in
AssertionError: expected 'import { DateInput } from "@/componen…' to contain ') ?? "agenda";'

- Expected
+ Received

- ) ?? "agenda";
+ import { DateInput } from "@/components/ui/date-input";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { ErrorState } from "@/components/ui/error-state";
+ import { CalendarGrid } from "@/components/ui/calendar-grid";
+ import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
+ import styles from "@/components/hr/recruiter-calendar-legacy.module.css";
+ import { Tabs } from "@/components/ui/tabs";
+ import { SummaryStrip } from "@/components/ui/summary-strip";
+ import { ScrollCue } from "@/components/ui/scroll-cue";
```

### tests/unit/chat3-tpo-supplemental-round14.test.ts

```
 FAIL  tests/unit/chat3-tpo-supplemental-round14.test.ts > TPO supplemental job metadata > TPO-drives-29/30/38 read and write supplemental details in the scoped job JSONB
AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'href={safeHref} rel="noopener norefer…'

- Expected
+ Received

- href={safeHref} rel="noopener noreferrer"
+ "use client";
+
+ import { useId, useState } from "react";
+ import { Button } from "@/components/ui/button";
+
+ /** WebView-safe external navigation with a user-selectable, copyable fallback.
+  * Clipboard failures never hide the original validated HTTPS URL. */
+ export function ThirdPartyLink({ href, label, ariaLabel }: { href: string; label: string; ariaLabel?: string }) {
+   const [showFallback, setShowFallback] = useState(false);
```

### tests/unit/chat7-meeting-migration-contract.test.ts

```
 FAIL  tests/unit/chat7-meeting-migration-contract.test.ts [ tests/unit/chat7-meeting-migration-contract.test.ts ]
Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/docs/proposed-migrations/chat7-mentor-meeting-facilitation.sql'
 ❯ read tests/unit/chat7-meeting-migration-contract.test.ts:6:24
      4|   from "@/modules/projects/mentor-meeting-facilitation-model";
      5|
      6| const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url…
       |                        ^
      7|
      8| describe("MEN-projects-meetings-27 migration and schema parity",()=>{
 ❯ tests/unit/chat7-meeting-migration-contract.test.ts:10:17

```

### tests/unit/company-share-mobile-cards.test.ts

```
 FAIL  tests/unit/company-share-mobile-cards.test.ts > opens authorized external applicant links in a protected new tab with an accessible target
AssertionError: expected 'import authStyles from "@/components/…' to contain 'target="_blank" rel="noopener norefer…'

- Expected
+ Received

- target="_blank" rel="noopener noreferrer"
+ import authStyles from "@/components/public/public-auth-skin.module.css";
+ import Link from "next/link";
+ import { Button } from "@/components/ui/button";
+ import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
+ import { ErrorState } from "@/components/ui/error-state";
+ import { Input } from "@/components/ui/input";
+ import { Pagination } from "@/components/ui/pagination";
+ import { PageHeader } from "@/components/ui/page-header";
+ import {cookies} from "next/headers";
```

### tests/unit/tpo-audit-actor-display.test.ts

```
 FAIL  tests/unit/tpo-audit-actor-display.test.ts > TPO-settings-audit-90 actor column > keeps each union source tenant-bound with a single actor field
AssertionError: expected 9 to be 8 // Object.is equality

- Expected
+ Received

- 8
+ 9

 ❯ tests/unit/tpo-audit-actor-display.test.ts:13:58
     11|  });
     12|  it("keeps each union source tenant-bound with a single actor field",(…
     13|   expect((source.match(/as actor_user_id/g)??[]).length).toBe(8);
       |                                                          ^
     14|   expect(source).toContain("left join users actor on actor.id = record…
     15|   expect(source).toContain("actor.display_name::text as \"actorName\""…
```


## Deep rows (from DEEP_agent2_4.md, unfinished; do these FIRST)

Record each result under ## Results in docs/audit/gap-fix-work/deep/packets/DEEP_agent2_4.md as OK (vNext file:line + docs/legacy-source file) or FIXED. No DEFERRED.

- [ ] G2-16-005-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-4-017-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
