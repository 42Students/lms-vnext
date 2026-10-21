# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

5 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-19-024-022  [P2] GAP  facet F09  effort M
- Legacy: 600px AsyncModal `New announcement to placement cells`, Edit announcement with Save; superadmin/announcements.js:78-81
- vNext now: Disclosure plus separate consent confirmation `Approve announcement to placement cells`; broadcast-form.tsx:57-59,102-109
- Fix: Use 600px dialog, exact dynamic title and footer; keep consent as confirmation without replacing modal layout.

## G2-19-024-037  [P2] GAP  facet F16  effort M
- Legacy: Legacy detached modal width600, Antd Form/Select/DatePicker; superadmin/announcements.js:78-109
- vNext now: Inline mobile-first Disclosure; 2-column md local date fields; form.tsx:57-103
- Fix: Compare modal width, phone scroll and DatePicker breakpoint at 320/768/1280; restore old geometry.

## G2-19-024-040  [P2] GAP  facet F18  effort S
- Legacy: Old title `New announcement`, body `Announcement`, placeholder `Links starting with https:// become clickable.`; superadmin/announcements.js:68,82-85
- vNext now: vNext `New announcement to placement cells` disclosure, `Message` and 200/8000 counter; broadcast-form.tsx:57-78
- Fix: Use old exact labels and helpers for equivalent controls.

## G2-19-024-041  [P2] GAP  facet F18  effort S
- Legacy: Old send buttons `Send to every placement cell (N)`/`Send to the picked placement cells`; superadmin/announcements.js:78-81
- vNext now: New `Review placement-cell announcement`, `Consent and publish`; broadcast-form.tsx:100-109
- Fix: Restore old call-to-action wording in primary composer, retain compliance consent copy as secondary step.

## G2-19-024-043  [P2] GAP  facet F20  effort M
- Legacy: Legacy selected IDs filtered/deduped, link trim and `futureOrNull` UTC parsing with one-minute grace; PlacementAnnouncementService.java:360-368,568-603
- vNext now: vNext reviewed set validation UUID, ISO offset dates, local picker conversions; broadcast-model.ts:1-35; broadcast-form.tsx:26-38
- Fix: Test concurrent review target changes, UTC/IST DST and boundary; keep strict scope/fail-closed behavior.
