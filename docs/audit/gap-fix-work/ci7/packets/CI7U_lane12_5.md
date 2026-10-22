# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-legacy-people-chat2.test.ts (1 failing)
- TPO People roster legacy copy > TPO-inbox-team-32 keeps the number of displayed team members consistent with the filtered roster

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'rows={members}'
  - Expected
  + Received
  - rows={members}
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {TpoTeamAwayForm} from "@/components/tpo/tpo-team-away-form";
  + import {listTpoTeamAway} from "@/modules/placements/tpo-team-away-service";
  + import { TpoSettingsTeamManage, TpoSettingsTeamRemove } from "@/components/tpo/tpo-settings-team-manage";
  ```
