# Work packet: edit src/components/placements/tpo-college-rules-control.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md, docs/audit/gap2/lane-6/tpo-settings-controller.md

## G2-11-024-017  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:107-114 route/beforeunload dirty warning
- vNext now: src/components/placements/tpo-college-rules-control.tsx:35-52 intercepts anchors/unload only in rules, not hub-wide
- Fix: Shared unsaved guard covering every form and browser Back.

## G2-11-024-047  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:102-129 dirty guard includes route changes and beforeunload
- vNext now: src/components/placements/tpo-college-rules-control.tsx:35-52 intercepts click and unload, browser history unknown
- Fix: Cover popstate/Back and all editor sections.

## G2-6-022-027  [P2] GAP  facet F07  effort S
- Legacy: Legacy maxHeldOffers invalid exact Offers a student can hold must be 1 to 5 (TpoSettingsService.java:36).
- vNext now: vNext generic Zod integer limits and client Held offers: 1–5... (tpo-policy-validation.ts:19; tpo-college-rules-control.tsx:65-69).
- Fix: Surface literal field-specific error on client/server.

## G2-11-024-018  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:127-129 leave confirmation title Leave without saving, choices Leave and discard/Stay
- vNext now: src/components/placements/tpo-college-rules-control.tsx:131-137 alternative title Discard unsaved placement settings and button
- Fix: Use exact legacy modal copy.

## G2-11-024-020  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:345 success toast Placement rules saved
- vNext now: src/components/placements/tpo-college-rules-control.tsx:80-83 inline success notice with trailing period
- Fix: Restore legacy toast wording and position.
