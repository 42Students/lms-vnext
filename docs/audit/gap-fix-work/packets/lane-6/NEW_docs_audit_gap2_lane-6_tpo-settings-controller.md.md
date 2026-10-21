# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/tpo-settings-controller.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/tpo-settings-controller.md

## G2-6-022-026  [P1] GAP  facet F07  effort M
- Legacy: Legacy invalid countsAsPlacedAt exact Counts as placed must be when the offer is released or accepted (TpoSettingsService.java:33-35).
- vNext now: vNext Zod enum includes SELECTED (tpo-policy-validation.ts:14-18) and DB permits SELECTED (tpo-policy.ts:48-51).
- Fix: Reject SELECTED for this college rules API or document approved new business state.

## G2-6-022-057  [P1] GAP  facet F18  effort M
- Legacy: Legacy How sharing works 5 exact bullets on columns/verified marks/phone/never-shown/90-day retention (settings.js:480-487).
- vNext now: vNext 5 generalized bullets omitting specific stage and 90-day rule (tpo-company-visibility-editor.tsx:38-42).
- Fix: Restore literal privacy promises and verify backend enforces them before display.

## G2-6-022-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy uplift invalid exact The uplift must be 0 to 200% (TpoSettingsService.java:37).
- vNext now: vNext generic combined validation error (tpo-college-rules-control.tsx:65-69).
- Fix: Restore per-field exact uplift message.

## G2-6-022-029  [P2] GAP  facet F07  effort S
- Legacy: Legacy response invalid exact Time to respond must be 12 to 168 hours (TpoSettingsService.java:38).
- vNext now: vNext generic combined validation error (tpo-college-rules-control.tsx:65-69).
- Fix: Show exact response time validation.

## G2-6-022-031  [P3] GAP  facet F08  effort S
- Legacy: Legacy RulesTab toast Placement rules saved (settings.js:345).
- vNext now: vNext inline notice Placement rules saved. with final period (tpo-college-rules-control.tsx:80-85,124-125).
- Fix: Match legacy exact toast wording, placement and duration.

## G2-6-022-032  [P3] GAP  facet F08  effort S
- Legacy: Legacy SeeTab success Saved (settings.js:478).
- vNext now: vNext inline notice Saved (tpo-company-visibility-editor.tsx:28-36,54-56).
- Fix: Match UI notification style/duration, not only text.
