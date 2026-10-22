# Notice for lane 2 (read and apply FIRST)

CI (GitHub Actions) now checks every push to main. TOP PRIORITY, in this order: docs/orchestrator/queues/clone/lane-2-ci1.md, then docs/orchestrator/queues/clone/lane-2-ci2.md (real type-check, lint, build and unit-test failures reported by CI) BEFORE anything else. Pause the verify2 queue until your CI queues are done. Never silence errors (no any, @ts-ignore, @ts-expect-error, eslint-disable, .skip). Then continue lane-2-verify.md and lane-2-verify2.md.
