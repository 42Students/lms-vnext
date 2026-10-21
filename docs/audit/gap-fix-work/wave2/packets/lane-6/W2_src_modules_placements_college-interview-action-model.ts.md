# Work packet (wave 2): edit src/modules/placements/college-interview-action-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u030-interview-form.md

## G2-12-030-018  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:283-285 — interviewer maxLength=255
- vNext now: src/modules/placements/college-interview-action-model.ts:7 — max=200
- Fix: Align 255 chars or migrate and warn truncation.

## G2-12-030-019  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:371-379 — location maxLength=500; notes maxLength=1000
- vNext now: src/modules/placements/college-interview-action-model.ts:6-13 — venue max400, meetingUrl max2000, notes absent
- Fix: Reconcile max lengths per mode and notes, avoid silently rejecting valid old entries.

## G2-12-030-020  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:25-33,355-369 — online requires parseable HTTPS URL with real hostname; inline validation
- vNext now: src/modules/placements/college-interview-action-model.ts:7,11-12 — URL Zod and /^https:\/\//i test
- Fix: Test hostname/protocol parity, return field-level error in form.

## G2-12-030-053  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:275-283 — duration bounds from global interview settings with default 60
- vNext now: src/modules/placements/college-interview-action-model.ts:5 — hard min5 max480 with default 30 in UI
- Fix: Reconcile configurable duration minima/maxima with hard-coded Zod limits.
