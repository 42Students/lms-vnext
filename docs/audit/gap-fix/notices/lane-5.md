# Notice for lane 5 (read and apply FIRST)

CI (GitHub Actions) now checks every push to main. TOP PRIORITY, in this order: docs/orchestrator/queues/clone/lane-5-ci1.md, then docs/orchestrator/queues/clone/lane-5-ci2.md, then docs/orchestrator/queues/clone/lane-5-ci3.md (real type-check, lint, build and unit-test failures reported by CI) BEFORE anything else. Pause the verify2 queue until your CI queues are done. Never silence errors (no any, @ts-ignore, @ts-expect-error, eslint-disable, .skip). Then continue lane-5-verify.md and lane-5-verify2.md.
