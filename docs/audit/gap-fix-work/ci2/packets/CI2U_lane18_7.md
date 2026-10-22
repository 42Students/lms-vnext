# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-tpo-campaign-hardening-02.test.ts (1 failing)
- chat-16 campaign suppression, cross-college and tamper hardening > campaign-cap-01 counts unique eligible recipients, never all suppressed roster entries

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

## tests/unit/chat19-legacy-mobile-footer.test.ts (3 failing)
- chat-19 legacy learner/faculty mobile footer > retains original bottom height and phone safe-area geometry

  ```
  AssertionError: expected '/* Source: docs/design/legacy-styles/…' to contain 'border-top:1px solid #f1f4f9'
  - Expected
  + Received
  - border-top:1px solid #f1f4f9
  + /* Source: docs/design/legacy-styles/components___antddesign.scss:912-936;
  +  * original 42Students/lms2-fe/src/components/MobileFooter/mobileFooter.scss:1-11.
  +  * Icon sizes/order: lms2-fe/src/components/MobileFooter/MobileFooter.jsx:21-149.
  +  */
  ```
- chat-19 legacy learner/faculty mobile footer > anchors the original AntD small badge to the bell with a red 14px indicator

  ```
  AssertionError: box-shadow:0 0 0 1px #fff;: expected '/* Source: docs/design/legacy-styles/…' to contain 'box-shadow:0 0 0 1px #fff;'
  - Expected
  + Received
  - box-shadow:0 0 0 1px #fff;
  + /* Source: docs/design/legacy-styles/components___antddesign.scss:912-936;
  +  * original 42Students/lms2-fe/src/components/MobileFooter/mobileFooter.scss:1-11.
  +  * Icon sizes/order: lms2-fe/src/components/MobileFooter/MobileFooter.jsx:21-149.
  +  */
  ```
- chat-19 legacy learner/faculty mobile footer > retains learner and faculty icon order without mixing portal links

  ```
  AssertionError: expected '"use client";\n\nimport Image from "n…' to contain 'if (!learner && !faculty && !recruite…'
  - Expected
  + Received
  - if (!learner && !faculty && !recruiter && !college && !mentor) return null
  + "use client";
  +
  + import Image from "next/image";
  + import Link from "next/link";
  ```

## tests/unit/chat2-campaign-recipient-snapshot-boundaries.test.ts (2 failing)
- TPO-campaigns-public-12 recruiter recipient identity and consent boundaries > deduplicates both the physical recruiter ID and normalized email

  ```
  AssertionError: expected { recipientIds: [ 'a', 'c' ], …(3) } to deeply equal { recipientIds: [ 'a', 'c' ], …(1) }
  - Expected
  + Received
  @@ -1,10 +1,12 @@
  {
  +   "eligibleCount": 2,
  "recipientIds": [
  "a",
  ```
- TPO-campaigns-public-12 recruiter recipient identity and consent boundaries > counts suppressed leads without giving them recipient slots

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

## tests/unit/chat2-join-form-state.test.ts (1 failing)
- TPO-campaigns-public-R03 TPO-campaigns-public-R06 join states > supports Enter submit, editable details and one-time-code autocomplete

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'You already have an account. Sign in …'
  - Expected
  + Received
  - You already have an account. Sign in on
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  ```

## tests/unit/chat2-team-message-change-notifications.test.ts (1 failing)
- TPO Team message mutations and actor notifications > TPO-inbox-team-24 enforces author-only immutable message deletion and 15-minute edit CAS

  ```
  AssertionError: expected 'import {hasPlacementTeamMembership} f…' to contain 'base.extend({action:z.literal("EDIT")…'
  - Expected
  + Received
  - base.extend({action:z.literal("EDIT"),body:z.string().trim().min(1).max(4000)})
  + import {hasPlacementTeamMembership} from "./placement-team-access-model";
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,eq,inArray,isNull,or,sql} from "drizzle-orm";
  ```

## tests/unit/chat2-tpo-public-link-settings.test.ts (1 failing)
- TPO-settings-audit-55 recruiter link > TPO-settings-audit-55 is reachable through settings navigation

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
