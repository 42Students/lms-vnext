# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-round9-legacy.test.ts (2 failing)
- chat-9 Round 9: legacy labels survive UX rollout > UX-admin-projects-labels-01 preserves the original College Project copy and scope recovery

  ```
  AssertionError: Target cannot be null or undefined.
  ❯ tests/unit/ux-admin-chat9-round9-legacy.test.ts:24:53
  22|     const workspaces=source("src/app/(authenticated)/college/projects/…
  23|     const risk=source("src/components/projects/project-admin-at-risk-p…
  24|     expect(workspaces.match(/title="Workspaces"/g)).toHaveLength(3);
  |                                                     ^
  25|     expect(workspaces).toContain('role="alert"');
  26|     expect(workspaces).toContain("Bulk reassign mentor");
  ```
- chat-9 Round 9: legacy labels survive UX rollout > UX-admin-tpo-settings-label-01 keeps the exact Recruiters settings tab

  ```
  AssertionError: expected [ Array(5) ] to include 'Placement Rules'
  ❯ tests/unit/ux-admin-chat9-round9-legacy.test.ts:40:20
  38|     const labels=TPO_SETTINGS_NAV_GROUPS.flatMap(group=>group.items.ma…
  39|     expect(labels).toContain("Recruiters");
  40|     expect(labels).toContain("Placement Rules");
  |                    ^
  41|     expect(labels).toContain("What Companies See");
  42|     expect(labels).toContain("Placement Branding");
  ```
