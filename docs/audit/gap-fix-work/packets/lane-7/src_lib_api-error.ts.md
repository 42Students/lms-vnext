# Work packet: edit src/lib/api-error.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-2-036-020  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:64-82 recruiter 403 role denied, 404 foreign college
- vNext now: src/lib/api-error.ts:84-88 generic 403
- Fix: Return 404 for foreign HR data and 403 for role-denied.

## G2-2-037-022  [P2] GAP  facet F07  effort M
- Legacy: docs/audit/legacy-copy-A.md:1-10 exact frontend text indexed by component
- vNext now: src/lib/api-error.ts:31-55 generic friendly error + field errors
- Fix: Map route-specific actual server messages to correct help and toast text.

## G2-2-036-019  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:100 'You do not teach this course or class'
- vNext now: src/lib/api-error.ts:214-221 generic 403 for teaching scope
- Fix: Use precise user-facing teaching denial.
