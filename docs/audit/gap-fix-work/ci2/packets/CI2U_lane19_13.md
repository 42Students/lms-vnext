# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-batches-lifecycle-chat5-round4.test.ts (1 failing)
- TPO batch retirement and recovery > GR-35 and GR-90 confirm retirement by keyboard-reachable checkbox rather than window.confirm

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```

## tests/unit/tpo-drives-chat-3-open-verification.test.ts (9 failing)
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-27 JD upload stays disabled until private storage and scanner are connected

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' not to contain 'type="file"'
  - Expected
  + Received
  - type="file"
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-28 college job type is distinct from the fixed employment enum

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'name="employmentType"'
  - Expected
  + Received
  - name="employmentType"
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-30 the employer portal URL is clear without claiming a persisted portal name

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'A separate portal name is not saved b…'
  - Expected
  + Received
  - A separate portal name is not saved by this workflow.
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-39 round presets persist pending rounds after the draft with server readback before retry

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'venues and dates in the drive workspa…'
  - Expected
  + Received
  - venues and dates in the drive workspace
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-40 learner reach is deferred until persisted evidence can be counted

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'No reach estimate is fabricated on th…'
  - Expected
  + Received
  - No reach estimate is fabricated on this form.
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-48 published edits require the live applicant notification contract

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'editable:["DRAFT","PUBLISHED"].includ…'
  - Expected
  + Received
  - editable:["DRAFT","PUBLISHED"].includes(job.status)&&season?.status==="ACTIVE"
  + import "server-only";
  + import {and,asc,eq,sql,inArray,or} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementJobRoleOptions,placementJobRounds,placementJobs,placementSeasons,placementCompanyRelationships,placementCompanies,placementJobEligibilityPolicies,placementApplications,placementRecruiterDriveRequests,collegeMemberships,users,inAppNotifications,activityEvents,cohorts,programs,depar
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-09 persisted statuses use distinct accessible words and visual tones

  ```
  AssertionError: expected 'import { z } from "zod";\n\n/** TPO-d…' to contain 'status==="CANCELLED"?"Cancelled"'
  - Expected
  + Received
  - status==="CANCELLED"?"Cancelled"
  + import { z } from "zod";
  +
  + /** TPO-drives-03: "Closed" is a view of both normal closures and cancellations.
  +  * Do not include rejected recruiter requests: those are not placement jobs. */
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-38 employer skill tags are not misrepresented as persisted eligibility

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'Skills the employer requires are not …'
  - Expected
  + Received
  - Skills the employer requires are not configured on this form yet.
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 remaining Drives audit evidence — open unless explicitly closed > TPO-drives-47 recruiter lead invite is not misrepresented as a drive-level email

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to match /recruiter lead invitations are manag…/i
  - Expected:
  /recruiter lead invitations are managed separately under Engage\./i
  + Received:
  "\"use client\";
  import {
  useState,
  useRef,
  ```

## tests/unit/tpo-recruiters-13-invite-readiness.test.ts (1 failing)
- TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations > requires a work email and linked college company before rotating the token

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/tpo-recruiters-13-invite-readiness.test.ts:7:17
  5|   const service=readFileSync("src/modules/placements/tpo-recruiter-inv…
  6|   const pivot=service.indexOf("if(!lead.emailNorm||!lead.companyRelati…
  7|   expect(pivot).toBeGreaterThan(-1);
  |                 ^
  8|   expect(pivot).toBeLessThan(service.indexOf("let credential;",pivot));
  9|  });
  ```

## tests/unit/tracker-report-sa-placements-projects-100.test.ts (2 failing)
- SA-placements-projects-100 report intake contract > rejects spoofed actor fields, invalid location and unknown type

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- SA-placements-projects-100 report intake contract > preserves exact validation messages

  ```
  AssertionError: expected 'description is required' to be 'Describe what went wrong.' // Object.is equality
  Expected: "Describe what went wrong."
  Received: "description is required"
  ```

## tests/unit/ux-chat14-mentor-quality-04b.test.ts (5 failing)
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import { MentorProjectsUnavailable } …' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  + import Link from "next/link";
  ```
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-activity-history-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-board-review-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { StatTile } from "@/components/ui/stat-tile";
  ```
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-closeout-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- chat-14 mentor UX quality batch 04b > UX-mentor-projects-projectId-deliveries-submissionId-review-02 preserves link contrast and shared interaction contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
