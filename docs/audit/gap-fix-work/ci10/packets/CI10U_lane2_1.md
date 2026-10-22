# CI unit-test packet (round 10)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat14-sprint-task-routes.test.ts (1 failing)
- Sprint and task mutating routes under Mentor account > PROJ-BREAK-MENTOR-341 task-status passes route IDs to one authorized service call

  ```
  AssertionError: expected 403 to be less than 300
  ❯ tests/unit/PROJ-BREAK-chat14-sprint-task-routes.test.ts:128:28
  126|    const body={expectedUpdatedAt:"2099-01-01T00:00:00.000Z",title:"Spr…
  127|    const response=await route.invoke(request(route.method,body));
  128|    expect(response.status).toBeLessThan(300);
  |                            ^
  129|    expect(state.lastOperation).toBe(route.name);
  130|    expect(state.lastProjectId).toBe(projectId);
  ```
