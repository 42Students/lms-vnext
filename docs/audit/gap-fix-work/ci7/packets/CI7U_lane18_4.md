# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-closing-drives-filter.test.ts (1 failing)
- Own published drive closing-soon filter > selects only non-expired persisted deadlines within inclusive seven days

  ```
  AssertionError: expected [ 'within', 'boundary', 'beyond' ] to deeply equal [ 'within', 'boundary' ]
  - Expected
  + Received
  [
  "within",
  "boundary",
  +   "beyond",
  ]
  ```

## tests/unit/mentor-projects-chat7-final-r7.test.ts (1 failing)
- mentor gaps round-seven behavior > MEN-projects-meetings-R08 preserves persisted truth and legacy controls

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain '!mentor || hasFilters'
  - Expected
  + Received
  - !mentor || hasFilters
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/super-admin-organizations-empty.test.ts (1 failing)
- Super Admin organization directory > does not expose create form without permission

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<OrganizationCreateForm />'
  - Expected
  + Received
  - <OrganizationCreateForm />
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```

## tests/unit/tpo-inbox-team-copy.test.ts (1 failing)
- TPO Messages copy parity > TPO-inbox-team-10 uses the exact legacy Messages subtitle without developer status jargon

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' to contain 'Conversations with recruiters, one fo…'
  - Expected
  + Received
  - Conversations with recruiters, one for each drive and a general one. Inside a drive, the same conversation is its Discussion tab.
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```
