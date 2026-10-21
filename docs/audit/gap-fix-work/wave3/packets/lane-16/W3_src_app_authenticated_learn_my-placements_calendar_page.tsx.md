# Work packet (wave 3): edit src/app/(authenticated)/learn/my-placements/calendar/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-calendar-redirect.md

## G2-19-005-011  [P1] MISSING  facet F04  effort L
- Legacy: Old day Drawer includes un-applied job deadlines and no-drive blocked dates `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-171`
- vNext now: vNext career Calendar events contain only workspace rounds `src/modules/placements/learner-career-calendar-model.ts:64-88` `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:24-35`
- Fix: Merge deadline and exam blocked day records with secure scoped reads.
