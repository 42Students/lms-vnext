# Notice for lane 12 (read and apply FIRST)

CI (GitHub Actions) now checks every push to main. TOP PRIORITY: work docs/orchestrator/queues/clone/lane-12-ci1.md (real type-check, lint and build errors reported by CI) BEFORE anything else. Pause the verify2 queue until your ci1 queue is done. Never silence errors (no any, @ts-ignore, @ts-expect-error, eslint-disable). Then continue lane-12-verify.md and lane-12-verify2.md.
