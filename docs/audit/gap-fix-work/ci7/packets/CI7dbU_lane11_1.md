# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/db10-notification-guards.test.ts (5 failing)
- DB10 notification correctness and privacy > reports actual inserted deliveries, not eligible attempts on duplicate

  ```
  TypeError: Cannot read properties of undefined (reading 'user')
  ❯ tests/integration/db10-notification-guards.test.ts:117:22
  115|     };
  116|     const first = await deliverInAppNotification(
  117|       e.id, [learner.user.id, learner.user.id], message,
  |                      ^
  118|     );
  119|     expect(first).toEqual({
  ```
- DB10 notification correctness and privacy > counts all 105 unread rows, respects owner and updates after read

  ```
  TypeError: Cannot read properties of undefined (reading 'user')
  ❯ tests/integration/db10-notification-guards.test.ts:157:16
  155|         "from activity_events where subject_type = $2",
  156|       ].join(" "),
  157|       [learner.user.id, tag],
  |                ^
  158|     );
  159|
  ```
- DB10 notification correctness and privacy > rejects protocol-relative, backslash and control-character links

  ```
  TypeError: Cannot read properties of undefined (reading 'user')
  ❯ tests/integration/db10-notification-guards.test.ts:177:49
  175|     ]) {
  176|       await expect(
  177|         deliverInAppNotification(e.id, [learner.user.id], {
  |                                                 ^
  178|           title: "Unsafe link",
  179|           body: "Do not navigate here",
  ```
- DB10 notification correctness and privacy > redacts unsafe legacy-stored action URLs at read time

  ```
  TypeError: Cannot read properties of undefined (reading 'user')
  ❯ tests/integration/db10-notification-guards.test.ts:189:51
  187|   it("redacts unsafe legacy-stored action URLs at read time", async ()…
  188|     const e = await event();
  189|     await deliverInAppNotification(e.id, [learner.user.id], {
  |                                                   ^
  190|       title: "Existing notice",
  191|       body: "Old row",
  ```
- DB10 notification correctness and privacy > returns committed read state when multiple requests acknowledge concurrently

  ```
  TypeError: Cannot read properties of undefined (reading 'user')
  ❯ tests/integration/db10-notification-guards.test.ts:225:51
  223|   it("returns committed read state when multiple requests acknowledge …
  224|     const e = await event();
  225|     await deliverInAppNotification(e.id, [learner.user.id], {
  |                                                   ^
  226|       title: "Concurrency notice",
  227|       body: "Mark this once",
  ```

## tests/integration/projects-p5-lifecycle.test.ts (1 failing)
- Projects P5 lifecycle > requires un-shipping before reopening a completed sprint

  ```
  AssertionError: expected ProjectsServiceError: PROJECT_RELEASE_INV… { code: '…' } to match object { Object (code) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PROJECT_RELEASE_HAS_OPEN_SPRINTS",
  + ProjectsServiceError {
  +   "code": "PROJECT_RELEASE_INVALID_STATE",
  ```
