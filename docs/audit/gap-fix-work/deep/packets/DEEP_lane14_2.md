# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-11-004-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-004-086  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-004-094  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-004-096  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-004-121  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-009-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-009-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-009-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-009-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-11-010-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)

## Results

- G2-11-004-077 — FIXED: commit `2918ec896f293ed153bdcc53524178c45b4fda41`, `src/components/hr/hr-drive-draft-form.tsx` now checks PDF/DOC/DOCX extension against nonempty browser MIME before requesting a signed upload and enforces 1–5 MiB. Legacy comparison: `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363` restricts JD to PDF/Word <=5MB.
- G2-11-004-086 — FIXED: commit `2918ec896f293ed153bdcc53524178c45b4fda41`, `src/components/hr/hr-drive-draft-form.tsx` adds on-demand scoped signed private document preview directly in the always-visible right-side card, with same-tab link and safe read-grant checks. Legacy comparison: `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:424-429` presents JD link within student preview.
- G2-11-004-094 — OK: `src/components/hr/hr-drive-draft-form.tsx:807-810,866-902` renders draft title, description, employment, eligibility and rounds from live local state regardless of successful validation; legacy `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:424-445` previews the editable form before submission.
- G2-11-004-096 — OK: `src/components/hr/hr-drive-draft-form.tsx:113-128` focuses and scrolls the first invalid field; `:817-830` sends collected zod field errors to this handler; legacy `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:254-261` scrolls to the first validation error.
- G2-11-004-121 — OK: `src/components/hr/hr-drive-draft-form.tsx:807-810,866-902` mounts the sticky right-side live preview on initial render, not gated by the separate validation feedback at `:857-864`; legacy `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:424-429` shows a continuously visible right-side preview.
- G2-11-009-047 — OK: `src/app/(authenticated)/tpo/drive-day/page.tsx:38-47` resolves the TPO branch before the learner branch when an actor has both roles; `src/modules/placements/tpo-live-drive-day-service.ts:18-28` independently requires active TPO plus placement permissions. Legacy comparison: `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:15-30` selects the TPO view.
- G2-11-009-049 — OK: `src/modules/placements/tpo-live-drive-day-service.ts:11-57` selects all same-IST-day published on-campus rounds, with no current-start-time filter; `src/modules/placements/tpo-live-drive-day-model.ts:31-49` uses the IST day interval. Legacy comparison: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346` includes future same-day entries.
- G2-11-009-050 — OK: `src/modules/placements/tpo-live-drive-day-service.ts:48-57` includes earlier-in-day rounds without an end-time filter (excluding cancelled rounds), so completed earlier sessions remain in the day list. Legacy comparison: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346` retrieves all of today's on-campus schedule.
- G2-11-009-051 — OK: `src/modules/placements/tpo-live-drive-day-service.ts:30-57` projects duration but does not require it for today's list; only the optional instant-activity model (`src/modules/placements/tpo-live-drive-day-model.ts:6-13`) requires duration. Legacy comparison: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346` includes unsized same-day rounds.
- G2-11-010-002 — OK: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:44-59` maps `tab=overview` to `about`, preserves other valid tabs and defaults draft/request drives to About versus published/closed drives to Applicants. Legacy comparison: `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:49-62` uses lifecycle-dependent default and Overview alias.
