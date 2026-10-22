# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-unread-notices.test.ts (2 failing)
- Unread learner placement notifications > LEARNER-placements-01 uses a persisted and tenant-scoped unread count

  ```
  AssertionError: expected '"use client";\n\nimport { Tabs } from…' to contain 'title="Unread personal placement aler…'
  - Expected
  + Received
  - title="Unread personal placement alerts"
  + "use client";
  +
  + import { Tabs } from "@/components/ui/tabs";
  + import { usePathname,useRouter } from "next/navigation";
  ```
- Unread learner placement notifications > LEARNER-placements-46 does not confuse loaded preview size with all unread alerts

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'href="#college-notices"'
  - Expected
  + Received
  - href="#college-notices"
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
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

## tests/unit/project-class-team-workspace-admin-controls.test.ts (1 failing)
- managed Project team affordances > does not render learner member edit controls for group-managed Projects

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'member.role !== "LEARNER"'
  - Expected
  + Received
  - member.role !== "LEARNER"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/rec-notification-bell.test.ts (1 failing)
- REC-calendar-messages-profile-21 recruiter notification bell > polls every 30 s, and scopes mark-read to caller and employer grants

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Loading notifications…'
  - Expected
  + Received
  - Loading notifications…
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/sa-semester-management-route.test.ts (1 failing)
- SA-academics-people-14 semester admin workspace > mounts the existing create, edit and delete controls on the Super Admin page

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'listCollegeSemesters(context, parsed.…'
  - Expected
  + Received
  - listCollegeSemesters(context, parsed.data)
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { SemesterRefreshBoundary } from "@/components/admin/semester-refresh-boundary";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/super-admin-template-create-model.test.ts (1 failing)
- Super Admin template creation > attaches one HTTP(S) resource with stable key and rejects partial or unsafe URL

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/super-admin-template-create-model.test.ts:25:79
  23|   expect(result.blueprint.resources[0].key).toBe("resource-1");
  24|   expect(result.blueprint.resources[0].title).toBe("Guide");
  25|   expect(()=>initialSuperAdminTemplateDraft({...base,resourceTitle:"Gu…
  |                                                                               ^
  26|   expect(()=>initialSuperAdminTemplateDraft({...base,resourceTitle:"Gu…
  27|  });
  ```
