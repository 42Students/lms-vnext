# Lane chat-3 — GAP v2 fix evidence

Branch: `chatgpt/chat-3-b`. Source: `docs/orchestrator/queues/clone/lane-3-fix.md`.
Validation mode: static source review only. No application execution, tests, lint, typecheck or CI.

## IN PROGRESS — `docs/audit/gap2/lane-3/job-types.md`

- **P0/P1 implementation advanced, NOT complete or live verified:** `G2-3-011-028` and `-054` have transactional scoped rename/placed-rule propagation and guarded unused-custom deletion. `-034` has per-drive snapshot, report fact and held-offer gate integration, but other eligibility and reporting callers still require audit. `-009` and `-044` read grouped, tenant-scoped nonarchived drive usage counts; `-046` adds a lowercased unique index; `-018` supports deletion of unused custom types.
- **Settings parity advanced:** `-003`, `-005`, `-006`, `-007`, `-008`, `-014`, `-015`, `-017`, `-023`, `-024`, `-025`, `-026`, `-027`, `-040`, `-042`, `-043`, `-045` now have a staged five-column legacy-style editor, whole-list PUT, change impact confirmation, names, row toggle/add/delete and dirty state. Browser beforeunload warning added; client-router unsaved navigation guard and error/loading-state equivalence need further work.
- **Consumer parity advanced:** `-031`, `-033`, `-048`, `-050` pass the scoped visible choices to TPO drive create; historic hidden values remain stored on jobs; placement reports and employer figures start using the per-drive placed flag. Additional read consumers must be inspected.
- **Changed files:** `drizzle/0138_job_type_drive_policy.sql`, `drizzle/meta/_journal.json`, `src/db/schema/{placements,tpo-configuration}.ts`, `src/modules/placements/{tpo-configuration-model,tpo-configuration-read-service,tpo-job-type-write-service,validation,errors,job-service,recruiter-approved-draft-job-service,report-model,report-service,held-offer-facts-service,company-placed-count-policy,tpo-company-memory-service}.ts`, `src/app/api/placements/tpo/settings/job-types/{route.ts,[jobTypeId]/route.ts}`, `src/app/(authenticated)/tpo/settings/job-types/page.tsx`, `src/components/tpo/tpo-unified-job-types-editor.tsx`, `src/components/placements/{placement-job-create-workspace,placement-job-create-form}.tsx`.
- **Remaining before ticking:** review every remaining GAP/MISSING audit row against latest branch; fix choice consumers, derived reports/eligibility across all entrypoints, specific error/confirmation behavior, loading skeleton/retry and unsaved route navigation, check migration vs current main. Do not mark this document [x] without complete proof.
- **Skipped rows:** none formally skipped yet. Existing membership model and virtual built-in defaults intentionally retained.

## Queue
All 28 documents remain unticked pending full GAP/MISSING closure and static syntax review. Never infer runtime parity from authored code alone.
