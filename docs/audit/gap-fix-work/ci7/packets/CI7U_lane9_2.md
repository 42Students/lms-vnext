# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-reassigned-mentor-parity.test.ts (1 failing)
- chat-16 reassigned mentor legacy parity > MEN-projects-meetings-69 keeps meeting load failure inline with a Retry action

  ```
  AssertionError: expected '"use client";\n\nimport {useRouter} f…' to contain 'We couldn&apos;t load your meetings.'
  - Expected
  + Received
  - We couldn&apos;t load your meetings.
  + "use client";
  +
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat2-tpo-last-third-runtime-settings-pages.test.tsx (3 failing)
- chat-2 TPO last-third runtime settings pages > TPO-settings-team-page-02 shows empty state without converting empty rows into source-unavailable

  ```
  ReferenceError: readTpoUnownedWork is not defined
  ❯ Module.TpoPlacementTeamPage src/app/(authenticated)/tpo/settings/team/page.tsx:63:17
  61|
  62|   const { members, summary, sources } = data;
  63|   const unowned=await readTpoUnownedWork(context).catch(()=>({ready:fa…
  |                 ^
  64|   const workload=await readTpoTeamAskWorkload(context).catch(()=>({rea…
  65|   const workloadByMember=new Map(workload.items.map(item=>[item.member…
  ```
- chat-2 TPO last-third runtime settings pages > TPO-settings-team-page-03 preserves partial-source warnings instead of displaying invented zero totals

  ```
  ReferenceError: readTpoUnownedWork is not defined
  ❯ Module.TpoPlacementTeamPage src/app/(authenticated)/tpo/settings/team/page.tsx:63:17
  61|
  62|   const { members, summary, sources } = data;
  63|   const unowned=await readTpoUnownedWork(context).catch(()=>({ready:fa…
  |                 ^
  64|   const workload=await readTpoTeamAskWorkload(context).catch(()=>({rea…
  65|   const workloadByMember=new Map(workload.items.map(item=>[item.member…
  ```
- chat-2 TPO last-third runtime settings pages > TPO-settings-team-page-04 keeps roster PII unrendered and exposes phone labels in the table

  ```
  ReferenceError: readTpoUnownedWork is not defined
  ❯ Module.TpoPlacementTeamPage src/app/(authenticated)/tpo/settings/team/page.tsx:63:17
  61|
  62|   const { members, summary, sources } = data;
  63|   const unowned=await readTpoUnownedWork(context).catch(()=>({ready:fa…
  |                 ^
  64|   const workload=await readTpoTeamAskWorkload(context).catch(()=>({rea…
  65|   const workloadByMember=new Map(workload.items.map(item=>[item.member…
  ```

## tests/unit/chat4-college-projects-reassignment-gap-closure.test.ts (1 failing)
- chat-4 college project mentorship bulk reassignment > COL-projects-R02 searches all mentors on server and retains bulk evidence

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'isProjectMentorOverloaded'
  - Expected
  + Received
  - isProjectMentorOverloaded
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat5-final-faculty-discussion.test.ts (1 failing)
- chat-5 final sprint: Faculty course discussions > FAC-courses-R06 preserves latest successfully fetched discussion messages and exposes retry on refresh failure even when posting permission is revoked

  ```
  AssertionError: expected 22618 to be less than 20378
  ❯ tests/unit/chat5-final-faculty-discussion.test.ts:30:41
  28|   expect(page).toContain("onClick={()=>void load(true)}>Retry</Button>…
  29|   expect(page).toContain("onClick={()=>void load(true)}");
  30|   expect(page.indexOf(staleBannerGate)).toBeLessThan(page.indexOf("{pi…
  |                                         ^
  31|   expect(page).toContain('reconcileLatestDiscussionPage(previous, inco…
  32|   expect(page).toContain('if (learnerDiscussionRefreshIsCurrent(refres…
  ```
