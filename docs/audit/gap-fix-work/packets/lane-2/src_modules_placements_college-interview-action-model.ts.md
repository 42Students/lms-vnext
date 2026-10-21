# Work packet: edit src/modules/placements/college-interview-action-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u030-interview-form.md

## G2-12-030-016  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:252-259 — type required, five enum values
- vNext now: src/modules/placements/college-interview-action-model.ts:3-13 — schema omits separate interview type
- Fix: Carry type field with validation and migration or explicitly map old values.

## G2-12-030-017  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:266-275 — round description required whitespace, >=10, max 500 and count
- vNext now: src/modules/placements/college-interview-action-model.ts:3-13 — schema has no round description
- Fix: Restore description validators server-side, ensure reminders consume it.

## G2-12-030-023  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:358-365 — Please enter the meeting link; Meeting link must be a valid https:// URL
- vNext now: src/modules/placements/college-interview-action-model.ts:11-12 — Enter a secure interview meeting URL.
- Fix: Use precise legacy meeting-link inline messaging.
