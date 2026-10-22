# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-round5-contracts.test.ts (2 failing)
- Learner Placements chat-7 round-5 grouped source contracts > LEARNER-placements-13 retains the reviewed learner journey behavior

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'learnerSavedDriveCopy(false).toast'
  - Expected
  + Received
  - learnerSavedDriveCopy(false).toast
  + "use client";
  + import {useRef,useState} from "react";
  + import {usePathname,useRouter} from "next/navigation";
  + import {apiFetch} from "@/lib/api-fetch";
  ```
- Learner Placements chat-7 round-5 grouped source contracts > LEARNER-placements-55 retains the reviewed learner journey behavior

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'id="registration"'
  - Expected
  + Received
  - id="registration"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/mentor-projects-chat7-round7.test.ts (2 failing)
- Chat-7 mentor Projects round-seven gaps > MEN-projects-meetings-01 retains the reviewed mentor legacy and resilience contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Projects could not be loaded'
  - Expected
  + Received
  - Projects could not be loaded
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  +
  ```
- Chat-7 mentor Projects round-seven gaps > MEN-projects-meetings-38 retains the reviewed mentor legacy and resilience contract

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'mode==="ADMIN"?"Execution":"Releases …'
  - Expected
  + Received
  - mode==="ADMIN"?"Execution":"Releases and Sprints"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/projects-phase2-exact-tabs.test.ts (1 failing)
- Phase2 exact legacy Projects labels + single tab strip > has one workspace-level Admin tab strip, not the list-level strip too

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'ProjectAdminNav'
  - Expected
  + Received
  - ProjectAdminNav
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  ```

## tests/unit/recruiter-chat14-round2.test.ts (3 failing)
- chat-14 recruiter reassignment batch 2 > REC-home-drives-16 sorts placement-cell unanswered requests before recent or deadline rows

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'border-warning bg-surface-secondary'
  - Expected
  + Received
  - border-warning bg-surface-secondary
  + import Link from "next/link";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
  ```
- chat-14 recruiter reassignment batch 2 > REC-home-drives-32 protects all unsent drafts with an accessible discard confirmation

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'title="Discard this drive draft?"'
  - Expected
  + Received
  - title="Discard this drive draft?"
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useToast } from "@/components/ui/toast";
  ```
- chat-14 recruiter reassignment batch 2 > REC-calendar-messages-profile-23 avoids marking older unseen notifications as read

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'state.items.filter(item=>item.unread)…'
  - Expected
  + Received
  - state.items.filter(item=>item.unread).length>=state.unread
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/shell-page-titles.test.ts (1 failing)
- legacy browser titles (dev format `<title> · 42LMS`) > uses the bare 42LMS fallback when no title is known

  ```
  AssertionError: expected 'Home · 42LMS' to be '42LMS' // Object.is equality
  Expected: "42LMS"
  Received: "Home · 42LMS"
  ```

## tests/unit/tenant-domain-validation.test.ts (1 failing)
- tenant-domain validation > normalizes configured DNS hosts deterministically

  ```
  AssertionError: expected { …(3) } to deeply equal { …(2) }
  - Expected
  + Received
  {
  "collegeId": "11111111-1111-4111-8111-111111111111",
  "host": "portal.example.edu",
  +   "isPrimary": false,
  }
  ```

## tests/unit/tpo-drive-graceful-chat5-round4.test.ts (2 failing)
- Drive action resilience and accessibility > TPO-drive-workspace-70 and GR-35 require an explicit reviewed destructive-action confirmation

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  ```
- Drive action resilience and accessibility > GR-90 and GR-91 expose persistent alert copy and a keyboard confirmation control

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/tpo-inbox-team-round4-graceful.test.ts (6 failing)
- TPO Inbox and Team round-4 failure recovery > TPO-inbox-team-64 keeps clickable bell rows and accessible error feedback

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'focus-visible:outline-primary'
  - Expected
  + Received
  - focus-visible:outline-primary
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- TPO Inbox and Team round-4 failure recovery > TPO-inbox-team-09 keeps recruiter drafts after failed sends or stalled network

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO Inbox and Team round-4 failure recovery > GR-70 isolates Everyone history failure to a retryable in-page section

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- TPO Inbox and Team round-4 failure recovery > GR-90 announces friendly errors from Everyone, bell, recruiter and announcement widgets

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```
- TPO Inbox and Team round-4 failure recovery > GR-91 keeps retry and dismissal actions reachable by keyboard

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'focus-visible:outline-primary'
  - Expected
  + Received
  - focus-visible:outline-primary
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```
- TPO Inbox and Team round-4 failure recovery > GR-92 does not depend on color alone for failures

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```
