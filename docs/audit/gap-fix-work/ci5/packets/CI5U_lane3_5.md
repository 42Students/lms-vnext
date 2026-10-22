# CI unit-test packet (round 5)

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

## tests/unit/mentor-projects-meetings-chat7-acceptance.test.ts (2 failing)
- Mentor Projects meeting and board acceptance > MEN-projects-meetings-26 preserves the reviewed mentor surface

  ```
  AssertionError: expected '"use client";\nimport { button } from…' to contain 'past meetings / meeting history'
  - Expected
  + Received
  - past meetings / meeting history
  + "use client";
  + import { button } from "@/components/ui/button";
  + import {useeffect,usestate} from "react";
  +
  ```
- Mentor Projects meeting and board acceptance > MEN-projects-meetings-34 preserves the reviewed mentor surface

  ```
  AssertionError: expected '"use client";\n\nimport { usestate } …' to contain 'ships in release'
  - Expected
  + Received
  - ships in release
  + "use client";
  +
  + import { usestate } from "react";
  + import { select } from "@/components/ui/select";
  ```

## tests/unit/projects-phase2-final-delivery-links-and-copy.test.ts (1 failing)
- PR-S2-07 registered 0091 final delivery links and Project page copy > keeps one account-level tab strip and legacy labels

  ```
  AssertionError: Target cannot be null or undefined.
  ❯ tests/unit/projects-phase2-final-delivery-links-and-copy.test.ts:21:71
  19|  });
  20|  it("keeps one account-level tab strip and legacy labels",()=>{
  21|   expect(workspace.match(/aria-label="Project workspace sections"/g)).…
  |                                                                       ^
  22|   expect(mentor).toContain("<MentorProjectTabs");
  23|   expect(learner).toContain("<LearnerProjectTabs");
  ```

## tests/unit/recruiter-chat14-round3.test.ts (4 failing)
- chat-14 recruiter reassigned batch 3 > REC-home-drives-34 retains scoped returnTo and job title, status and applicant-count framing

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '← Back to Drives'
  - Expected
  + Received
  - ← Back to Drives
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- chat-14 recruiter reassigned batch 3 > REC-home-drives-46 represents persisted round status and schedule without inventing slots

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Date to be decided'
  - Expected
  + Received
  - Date to be decided
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- chat-14 recruiter reassigned batch 3 > REC-home-drives-50 uses readable, scoped offer columns and employment outcomes

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Candidate'
  - Expected
  + Received
  - Candidate
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- chat-14 recruiter reassigned batch 3 > REC-home-drives-45 gives an honest empty state when the placement cell has not shared applicants

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'The placement cell has not shared the…'
  - Expected
  + Received
  - The placement cell has not shared the applicants yet
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/shell-switcher-wording.test.ts (2 failing)
- legacy workspace and scope switcher wording (Header.js, SuperAdminHeader.js) > workspace switcher says Switch workspace

  ```
  AssertionError: expected '"use client";\n\nimport { useState, u…' to contain 'if (!membershipId || membershipId ===…'
  - Expected
  + Received
  - if (!membershipId || membershipId === activeMembershipId) return;
  + "use client";
  +
  + import { useState, useTransition } from "react";
  + import { useRouter } from "next/navigation";
  ```
- legacy workspace and scope switcher wording (Header.js, SuperAdminHeader.js) > Super Admin scope placeholder is All colleges

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain '<option value="">All colleges</option>'
  - Expected
  + Received
  - <option value="">All colleges</option>
  + "use client";
  +
  + import {useEffect,useId,useState,useTransition} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/tpo-accreditation-students.test.ts (2 failing)
- TPO-calendar-reports-33 NAAC student evidence > emits one row per placed student, best accepted CTC and offer count

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```
- TPO-calendar-reports-33 NAAC student evidence > never exports duplicate accepted offers or spreadsheet formulas unsafely

  ```
  TypeError: Cannot read properties of undefined (reading 'offersHeld')
  ❯ tests/unit/tpo-accreditation-students.test.ts:22:18
  20|    {...base,offerId:"1",name:"=IMPORTXML()",status:"ACCEPTED",annualCt…
  21|   ]);
  22|   expect(rows[0].offersHeld).toBe(1);
  |                  ^
  23|   const csv=accreditationStudentCsv(rows);
  24|   expect(csv).toContain("Employer contact");
  ```

## tests/unit/tpo-drive-header.test.ts (1 failing)
- TPO-drive-workspace-03 header facts > distinguishes request, published, closed, cancelled and declined

  ```
  AssertionError: expected 'Open · Expired' to be 'Published' // Object.is equality
  Expected: "Published"
  Received: "Open · Expired"
  ```

## tests/unit/tpo-inbox-team-round5-parity-review.test.ts (2 failing)
- TPO inbox/team outstanding legacy contracts > TPO-inbox-team-30 routes the authenticated legacy c/m deep link and members alias

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'z.string().uuid().safeParse(threadId)'
  - Expected
  + Received
  - z.string().uuid().safeParse(threadId)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- TPO inbox/team outstanding legacy contracts > TPO-inbox-team-37 hides temporary coordinator assignments from permanent team roles

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'const activeTeam=team.members.filter(…'
  - Expected
  + Received
  - const activeTeam=team.members.filter(member=>member.roles.includes("TPO")
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
