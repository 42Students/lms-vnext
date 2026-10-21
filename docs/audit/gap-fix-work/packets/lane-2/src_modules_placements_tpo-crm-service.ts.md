# Work packet: edit src/modules/placements/tpo-crm-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u019-tpo-recruiter-lead-detail.md, docs/audit/gap2/lane-5/u012-tpo-calendar.md, docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md

## G2-11-019-042  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:152-169`
- vNext now: `src/modules/placements/tpo-crm-service.ts:293-391`
- Fix: Legacy `No answer` outcome triggers next-day10AM followup; vNext atomic service schedules Date.now+2 days if no active followup.

## G2-11-019-051  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:160-161`
- vNext now: `src/modules/placements/tpo-crm-service.ts:357-370`
- Fix: No answer follow-up schedule tomorrow at10AM vs +2days clock, could change workload SLA.

## G2-5-012-059  [P1] GAP  facet F10  effort M
- Legacy: Legacy markDone repeat is idempotent; Move locks row FOR UPDATE and rejects done state (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:239-264`)
- vNext now: vNext Done sets doneAt only if null but returns NOT_FOUND when repeated (`src/modules/placements/tpo-crm-service.ts:485-503`)
- Fix: Make repeated Done idempotent and distinguish already-done vs missing

## G2-5-012-096  [P1] GAP  facet F20  effort M
- Legacy: Legacy Done repeats harmlessly without re-writing done_at; Move checks under row lock (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:239-264`)
- vNext now: vNext conditional update returns NOT_FOUND on repeated Done (`src/modules/placements/tpo-crm-service.ts:485-503`)
- Fix: Return already-done success for duplicate POST; retain atomic move/final state

## G2-14-022-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy duplicate lead says This recruiter is already in your list. Search for them to open it. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:103-108`
- vNext now: New error code TPO_CRM_LEAD_DUPLICATE `src/modules/placements/tpo-crm-service.ts:215-215`
- Fix: Map to legacy actionable collision copy

## G2-14-022-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy moved completed followup says A finished follow-up cannot be moved `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:239-246`
- vNext now: New TPO_CRM_FOLLOWUP_ALREADY_DONE `src/modules/placements/tpo-crm-service.ts:453-483`
- Fix: Use exact completed reminder error
