# Unit-test repair queue (unit11): lane chat-18

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-18-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-kit-projects-hardening-chat17.test.tsx` (2 failing)
- [x] `tests/unit/chat16-mentor-calendar-status-r5.test.ts` (2 failing)
- [x] `tests/unit/chat3-legacy-course-short-title-limit.test.ts` (2 failing)
- [x] `tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts` (1 failing)
- [ ] `tests/unit/college-placement-student-resume-access.test.ts` (1 failing)
- [ ] `tests/unit/super-admin-legacy-wording.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/UX-kit-projects-hardening-chat17.test.tsx

```
 FAIL  tests/unit/UX-kit-projects-hardening-chat17.test.tsx > UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states > UX-kit-HARDEN-14 link refuses HTTP/credentials and keeps valid URL copy fallback
AssertionError: expected '<span class="inline-flex min-w-0 flex…' to contain 'rel="noopener noreferrer"'

Expected: "rel="noopener noreferrer""
Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.org/" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 text-[14px] font-[650] leading-5 text-[var(--lms-link-text)] underline underline-offset-2 transition-colors duration-[var(--lms-motion-fast)] motion-reduce:transition-none hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="mr-2 size-4 shrink-0"><rect x="3" y="5" width="13" height="14" rx="2"></rect><path d="m16 10 5-3v10l-5-3"></path></svg>Open meeting<span class="sr-only"> (external website)</span></a><span class="flex flex-wrap gap-3"><button data-slot="button" data-variant="link" data-size="sm" type="button" aria-expanded="false" class="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_3px_rgba(26,149,161,0.15)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-busy:cursor-progress aria-busy:pointer-events-none enabled:active:translate-y-px motion-reduce:active:translate-y-0 border-transparent bg-transparent text-[var(--lms-link-text)] underline-offset-4 enabled:hover:underline enabled:hover:text-[var(--lms-link-text)] min-h-[var(--lms-control-height)] px-[var(--lms-space-3)] text-[13px] min-h-11 md:min-h-[var(--lms-control-height)] px-2 text-[14px] font-[650] underline! hover:underline! focus-visible:underline! underline-offset-2 hover:bg-[var(--lms-primary-subtle)] aria-expanded:bg-[var(--lms-primary-subtle)] aria-expanded:text-[var(--lms-primary-text)]">Show link to copy</button><button data-slot="button" data-variant="link" data-size="sm" type="button" class="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shado
```

### tests/unit/chat16-mentor-calendar-status-r5.test.ts

```
 FAIL  tests/unit/chat16-mentor-calendar-status-r5.test.ts > chat-16 mentor calendar persisted statuses > MEN-projects-meetings-69 shows DRAFT and RESCHEDULED without guessing missing states
AssertionError: expected 'https://meet.example.org/room' to be null

- Expected:
null

+ Received:
"https://meet.example.org/room"

 ❯ tests/unit/chat16-mentor-calendar-status-r5.test.ts:24:50
     22|     expect(mentorMeetingDisplayStatus(rescheduled, now)).toBe("RESCHED…
     23|     // Only scheduled or rescheduled meetings within their live window…
     24|     expect(safeMentorMeetingJoinUrl(draft, now)).toBeNull();
       |                                                  ^
     25|     expect(safeMentorMeetingJoinUrl(rescheduled, now)).toBe("https://m…
     26|   });

 FAIL  tests/unit/chat16-mentor-calendar-status-r5.test.ts > chat-16 mentor calendar persisted statuses > MEN-projects-meetings-69 does not allow a past rescheduled or cancelled meeting join
AssertionError: expected 'https://meet.example.org/room' to be null

- Expected:
null

+ Received:
"https://meet.example.org/room"

 ❯ tests/unit/chat16-mentor-calendar-status-r5.test.ts:30:78
     28|     const past = new Date("2099-10-17T08:01:00Z");
     29|     expect(mentorMeetingDisplayStatus({...base, status: "RESCHEDULED"}…
     30|     expect(safeMentorMeetingJoinUrl({...base, status: "RESCHEDULED"}, …
       |                                                                              ^
     31|     expect(safeMentorMeetingJoinUrl({...base, status: "CANCELLED"}, pa…
     32|     expect(safeMentorMeetingJoinUrl({...base, status: "REQUESTED"}, pa…
```

### tests/unit/chat3-legacy-course-short-title-limit.test.ts

```
 FAIL  tests/unit/chat3-legacy-course-short-title-limit.test.ts > legacy course short display name length > enforces 255-character title in both create and edit validation
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ tests/unit/chat3-legacy-course-short-title-limit.test.ts:10:17
      8|     expect(createCourseInputSchema.safeParse({
      9|       departmentId:courseId,name:"Data Structures",code:"CS101",shortT…
     10|     }).success).toBe(true);
       |                 ^
     11|     expect(createCourseInputSchema.safeParse({
     12|       departmentId:courseId,name:"Data Structures",code:"CS101",shortT…

 FAIL  tests/unit/chat3-legacy-course-short-title-limit.test.ts > legacy course short display name length > does not prefill more than 255 characters in edit, duplicate and restore paths
AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'maxLength={255} placeholder="e.g. DSA"'

- Expected
+ Received

- maxLength={255} placeholder="e.g. DSA"
+ "use client";
+
+ import Link from "next/link";
+ import Image from "next/image";
+ import {
+   useEffect,
+   useState,
+ } from "react";
+ import { useRouter } from "next/navigation";
```

### tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts

```
 FAIL  tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts > SA-academics-people-52/53 selected-course retry integrity > SA-academics-people-52 accepts the 100-course page but refuses unbounded bulk actions
AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'selected.length!==input.courseIds.len…'

- Expected
+ Received

- selected.length!==input.courseIds.length
+ import "server-only";
+ import {and,eq,inArray,sql} from "drizzle-orm";
+ import {z} from "zod";
+ import {getDb} from "@/db/client";
+ import {academicPeriods,courseLessons,courseLearningPaths,courseOfferings,courses,departments,lessonContents} from "@/db/schema";
+ import type {RequestContext} from "@/modules/identity/context";
+ import {resolveActingCollege} from "@/modules/permissions/acting-college";
+ import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
+ import {bulkSuperAdminLessonVisibility} from "./super-admin-lesson-bulk-visibility";
```

### tests/unit/college-placement-student-resume-access.test.ts

```
 FAIL  tests/unit/college-placement-student-resume-access.test.ts > G2-15-002-030: college placement learner resume privacy > exposes only a verified, short-lived authorized redirect and no raw object path
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'rel="noopener noreferrer"'

- Expected
+ Received

- rel="noopener noreferrer"
+ import Link from "next/link";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { PageBackLink } from "@/components/ui/page-back-link";
+ import { StatusBadge } from "@/components/ui/status-badge";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { ErrorState } from "@/components/ui/error-state";
+ import { AdminPlacementStudentSearch } from "@/components/placements/admin-placement-student-search";
+ import { AdminPlacementStudentProfileEditor } from "@/components/placements/admin-placement-student-profile-editor";
```

### tests/unit/super-admin-legacy-wording.test.ts

```
 FAIL  tests/unit/super-admin-legacy-wording.test.ts > Super Admin legacy label fixes that do not orphan pages (superAdminNavigationMenuFlat) > page headings use the legacy titles
AssertionError: expected 'import SuperAdminTenantSetup from "./…' to contain 'title="Tenant Setup"'

- Expected
+ Received

- title="Tenant Setup"
+ import SuperAdminTenantSetup from "./setup/page";
+ import TenantDirectory from "./directory/page";
+
+ /** Old Tenant Setup lands in the two-step structure/launch workspace.
+  * The independent college directory remains reachable as a secondary route.
+  * Keep existing filtered directory deep links working after the route split.
+  */
+ export default async function SuperAdminTenantLanding({searchParams}:{
+  searchParams:Promise<Record<string,string|string[]|undefined>>;
```

