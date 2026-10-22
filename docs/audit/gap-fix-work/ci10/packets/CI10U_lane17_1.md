# CI unit-test packet (round 10)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-admin-second-third-drives-page.test.ts (1 failing)
- Super Admin drives: page-level behavior, denial and friendly recovery > CHAT6-ADMIN-DRIVES-PAGE-04 passes only authenticated college and displays visible results/actions

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ SuperAdminDriveDirectoryFilters src/components/placements/super-admin-drive-directory-filters.tsx:16:15
  14| export function SuperAdminDriveDirectoryFilters({q:initialQ,status:ini…
  15|  pageSize:initialSize}:{q:string;status:DriveStatusFilter;pageSize:num…
  16|  const router=useRouter();
  |               ^
  17|  const [q,setQ]=useState(initialQ);
  ```
