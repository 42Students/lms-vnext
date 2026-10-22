# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/t-s2-04-campaign-send-policy.test.ts (1 failing)
- T-S2-04 campaign send policy > produces a bounded, PII-free preview with stable contact deduplication

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

## tests/unit/ux-chat14-mentor-01.test.ts (1 failing)
- chat-14 mentor UX rollout batch 01 > UX-mentor-mentor-01 preserves route layout, wording, and touch/scroll source contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'mx-auto flex min-h-[320px] w-full max…'
  - Expected
  + Received
  - mx-auto flex min-h-[320px] w-full max-w-[700px]
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```
