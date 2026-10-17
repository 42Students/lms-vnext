# TPO campaigns-public

## Chat-2 gap closure current round

| ID | Status | Evidence |
|---|---|---|
| TPO-campaigns-public-09 | DONE (source, tests not run) | Bad batch IDs cause Next.js 404 before Zod parse/DB access, in `campaigns/[batchId]/page.tsx`. Named test `tests/unit/chat2-campaign-history-routes.test.ts`. |
| TPO-campaigns-public-10 | PARTIAL — OPEN | Emails title, truthful empty message, sent/skipped labels in `campaigns/page.tsx`. Delivery receipt vs successful delivery semantics remain explicit, and other copy gaps remain. Named unit test in same file. |
