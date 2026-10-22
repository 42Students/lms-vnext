# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-tpo-campaign-live-consent-recheck-16.test.ts (2 failing)
- chat-16 TPO campaign live recipient recheck > TPO-campaigns-public-12 validates stored draft HMAC before claiming a recipient for provider delivery

  ```
  AssertionError: expected -1 to be greater than 7775
  ❯ tests/unit/chat16-tpo-campaign-live-consent-recheck-16.test.ts:39:16
  37|   expect(draftKey).toBeGreaterThan(-1);
  38|   expect(claim).toBeGreaterThan(draftKey);
  39|   expect(send).toBeGreaterThan(claim);
  |                ^
  40|   expect(source).toContain("recipientKey:placementTpoEmailCampaignReci…
  41|  });
  ```
- chat-16 TPO campaign live recipient recheck > TPO-campaigns-public-12 dispatch reads live college-scoped recipient after claim, before provider call

  ```
  AssertionError: expected -1 to be greater than 9053
  ❯ tests/unit/chat16-tpo-campaign-live-consent-recheck-16.test.ts:61:16
  59|   expect(live).toBeGreaterThan(claim);
  60|   expect(gate).toBeGreaterThan(live);
  61|   expect(send).toBeGreaterThan(gate);
  |                ^
  62|   const section=source.slice(live,send);
  63|   expect(section).toContain("eq(placementTpoLeads.collegeId,college.id…
  ```

## tests/unit/chat19-north-star-hr-sweep.test.ts (3 failing)
- NORTH-STAR-HR-01: legacy shell color, focus, radius and shadow sweep > audits all 22 HR portal routes from the checked-in owner inventory

  ```
  AssertionError: src/app/(authenticated)/hr/conversations/page.tsx: expected 'import inboxStyles from "@/components…' not to match /(?:bg|text|border)-\[#[0-9a-fA-F]{3,8…/
  - Expected:
  /(?:bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/
  + Received:
  "import inboxStyles from \"@/components/hr/recruiter-conversations-legacy.module.css\";
  import { EmptyState } from \"@/components/ui/empty-state\";
  import {NeedsDoingChips} from \"@/components/ui/needs-doing-chips\";
  import { Tabs } from \"@/components/ui/tabs\";
  ```
- NORTH-STAR-HR-01: legacy shell color, focus, radius and shadow sweep > aligns HR widget focus and notification overlays to legacy tokens

  ```
  AssertionError: hr-proposal-history-grid.tsx uses text-[var(--lms-link-text)]: expected '"use client";\n\nimport Link from "ne…' not to contain 'text-[var(--lms-link-text)]'
  - Expected
  + Received
  - text-[var(--lms-link-text)]
  + "use client";
  +
  + import Link from "next/link";
  + import {TpoGrid} from "@/components/tpo/grid/tpo-grid";
  ```
- NORTH-STAR-HR-01: legacy shell color, focus, radius and shadow sweep > preserves the existing HR sections and shared PageHeader instead of replacing the content

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'outline-[var(--lms-primary)]'
  - Expected
  + Received
  - outline-[var(--lms-primary)]
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```

## tests/unit/chat2-college-learner-calendar-break-08.test.ts (2 failing)
- TPO-BREAK-calendar-08 query access, ICS injection, scheduled dates and private learner data > college interview filter rejects array ambiguity, invalid UUIDs and page overflow

  ```
  AssertionError: expected 20 to be 25 // Object.is equality
  - Expected
  + Received
  - 25
  + 20
  ```
- TPO-BREAK-calendar-08 query access, ICS injection, scheduled dates and private learner data > college appointment actions need a secure location, deliberate confirmation and CAS

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts (2 failing)
- TPO-campaigns-public-12 / T-S2-04 campaign safety ledger > deduplicates recipients by case-insensitive email without returning email addresses

  ```
  AssertionError: expected { recipientIds: [ 'a', 'd' ], …(3) } to deeply equal { recipientIds: [ 'a', 'd' ], …(1) }
  - Expected
  + Received
  @@ -1,10 +1,12 @@
  {
  +   "eligibleCount": 2,
  "recipientIds": [
  "a",
  ```
- TPO-campaigns-public-12 / T-S2-04 campaign safety ledger > limits unique deliverable recipients while permitting large suppressed rosters

  ```
  Error: TPO_CAMPAIGN_RECIPIENT_LIMIT
  ❯ assertCampaignRecipientCap src/modules/messaging/tpo-campaign-send-policy.ts:33:11
  31| export function assertCampaignRecipientCap(total:number):number {
  32|   if(!Number.isSafeInteger(total)||total<0||total>TPO_CAMPAIGN_MAX_REC…
  33|     throw new Error("TPO_CAMPAIGN_RECIPIENT_LIMIT");
  |           ^
  34|   return total;
  35| }
  ```

## tests/unit/chat2-team-people-workload-links.test.ts (1 failing)
- Team People persisted workload destinations > TPO-inbox-team-31 links each of five real workload categories to tenant-scoped list pages

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '["Live drives",member.liveDrives,"/tp…'
  - Expected
  + Received
  - ["Live drives",member.liveDrives,"/tpo/placements"]
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat2-tpo-public-links.test.ts (1 failing)
- TPO-companies-01 public company link contract > preserves legacy labels exactly

  ```
  AssertionError: expected 'A new public link; the old one stoppe…' to be 'The old link stops working.' // Object.is equality
  Expected: "The old link stops working."
  Received: "A new public link; the old one stopped working."
  ```
