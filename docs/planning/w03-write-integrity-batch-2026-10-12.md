# W03 Projects / Mentor — write-integrity batch (2026-10-12)

**Lane:** W03 / Chat 3 · issue #23  
**Destination:** `main`, non-force  
**Legacy FE oracle:** `42Students/lms2-fe@prod-2026 e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Legacy BE oracle:** `42Students/lms@prod-2026 21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Release status:** NOT RELEASE READY.

This batch uses only already-registered DB07 tables. It does not edit the shared Drizzle journal, schema barrel, CI, storage/IAM or non-W03 feature ownership.

## Closed source/runtime gaps

### Project resource mutations
Commit `e662d084018f450647ba127cfd3926ed58ebd155`.

- create/update/archive lock the current project row inside the write transaction;
- archived state is rechecked at commit time;
- create serializes per-project sequence allocation rather than relying on a duplicate-key race;
- update/archive lock the exact same-project active resource before mutation.

### Task submission and review
Commits `3633949475b3882f8f300767537b95bde7ce126c` and cleanup `32e3ed25116e7cd57b8e6ef8eea10ec3eae2c498`.

- learner submit locks project, task and sprint before version allocation;
- one concurrent submit can move a task into review;
- review locks the exact submission and task before updating both;
- archived/completed execution state is rechecked in the transaction.

### Final delivery lifecycle
Commit `5ea9a2f9f91dcfcc5b91810193da16e37265cea3`.

- final-draft creation serializes open-version checks and version allocation;
- draft update, submit and review lock current project/submission state;
- submission rechecks current project status is `COMPLETED` in the same transaction.

### Evaluation
Commit `b8f3a2d90a3d52fb213893b46f452328076d164b`.

- evaluation creation locks the project and exact approved submission;
- archived projects fail closed;
- unique evaluation write remains the final duplicate guard.

### Mentor stalled-project accuracy
Commit `6f01433707b04e54624a64afc71c6783682a36b4`.

- activity lookup includes nested keys such as `project:<id>:task-submissions` and `project:<id>:evaluations`;
- nested group keys are mapped back to the canonical project ID;
- recent real project work no longer falsely produces a stale-project alert merely because `project_instances.updated_at` is old.

## Regression coverage authored

Commit `20455ef24d3e6368d7b42ffb2b6af7533188215f` extends `tests/integration/projects-adversarial.test.ts` with PostgreSQL witnesses for:

1. concurrent resource sequence allocation;
2. concurrent task submission with exactly one winner;
3. concurrent final-draft creation with exactly one open version;
4. concurrent evaluation creation with exactly one evaluation.

Commit `ced2e75c81313ea71ba182effd037c2f3a563328` adds a PostgreSQL regression proving a recent nested project activity event suppresses the stalled alert even when the workspace timestamp is older than seven days.

## Test execution evidence

GitHub Actions now allocates real runners on the public repository. However, rapid parallel pushes trigger the workflow concurrency policy and cancelled the W03 runs before completion. Run `38260531357` for `20455ef2` was cancelled after a newer push.

Therefore the new PostgreSQL scenarios are **AUTHORED, NOT COUNTED AS PASSING**. Do not use this batch to inflate runtime-semantic verification counts until a stable main CI run executes them.

## Remaining W03 blockers

- W01 still owns promotion/replay of staged `project_task_comment`, `project_meeting_history`, `project_resource_audit` and `project_delivery_event`.
- Legacy task allocation/ownership, blocker/due-date/estimate/type/approach and optimistic-version fields need registered DB07 persistence before Mentor Task Allocation can reach parity.
- Legacy recoverable delete/restore, readiness override and richer final-delivery lifecycle remain schema-backed gaps.
- Broad-announcement delivery remains a W06 dependency.
- The DB07 field ledger remains 358/358 `UNVERIFIED`, 0 runtime-semantic verified; source implementation is not semantic closure.


## Follow-up: persisted child-activity fallback

Commit `61388cf72cfbe2ff935a1808cdf2c10cbf6556e6` makes stalled detection resilient even when a W03 write does not yet emit a shared activity event. It aggregates the latest persisted `updated_at` for project final submissions, meetings and task submissions and takes the newest signal together with activity events.

Commit `4304a69c2908db573e395574eda46f3ca0fafae6` adds a PostgreSQL regression where the workspace timestamp is deliberately made eight days old, a meeting is then scheduled, and Mentor attention must not return a STALLED alert.

These tests are also authored-but-not-yet-counted-as-passing until a stable CI run executes them.
