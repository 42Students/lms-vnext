# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/tpo-settings-controller.md

11 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/tpo-settings-controller.md

## G2-6-022-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy TPO settings tabs rules and see within /tpo/settings.js (settings.js:51-74,97-99,152).
- vNext now: vNext what-companies-see separate /tpo/settings/see page with settings nav (see/page.tsx:19-49).
- Fix: Mirror legacy tab/nav order and direct link semantics, or document intentional route separation.

## G2-6-022-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy rules use sentence-inline selects/number inputs separated by Divider (settings.js:332-342).
- vNext now: vNext uses labeled 2-column field grid and separate sentence summary (tpo-college-rules-control.tsx:94-119).
- Fix: Clone inline sentence blanks, dividers and control widths.

## G2-6-022-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy Save changes button only enabled when form changed (settings.js:209-211,345).
- vNext now: vNext Review and confirm rules button disabled only busy, not dirty (tpo-college-rules-control.tsx:34,120-123).
- Fix: Disable save when unchanged and preserve original Save changes CTA where permitted.

## G2-6-022-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy SeeTab has three AntD Switch controls (settings.js:473-478).
- vNext now: vNext renders three Checkbox controls and two additional under disclosure (tpo-company-visibility-editor.tsx:42-53).
- Fix: Use shared Switch, align row height, switch affordance and disabled states.

## G2-6-022-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy RulesRequest nullable countsAsPlacedAt/maxHeldOffers/upliftPct/minResponseHours for partial PUT (TpoSettingsController.java:32-42; TpoSettingsService.java:39-45).
- vNext now: vNext patch schema optional same four, but requires expectedVersion and at least one change (tpo-policy-validation.ts:10-29).
- Fix: Document expectedVersion protocol; maintain client read-before-write and preserve partial values.

## G2-6-022-023  [P2] GAP  facet F06  effort S
- Legacy: Legacy response InputNumber min12 max168, explanatory extension48 hours (settings.js:340-341).
- vNext now: vNext input 12–168 but omits full extension sentence from visible summary (tpo-college-rules-control.tsx:105-118).
- Fix: Restore exact extension-by-48-hours explanatory text.

## G2-6-022-025  [P2] GAP  facet F06  effort S
- Legacy: Legacy SeeTab Save changes disabled unless changed (settings.js:209-211,478).
- vNext now: vNext Save disabled only busy, not values changed (tpo-company-visibility-editor.tsx:21-25,54-55).
- Fix: Disable Save for unchanged booleans, unless explicit reapply semantics intended.

## G2-6-022-055  [P2] GAP  facet F18  effort S
- Legacy: Legacy 'A student may hold [N] offer(s)' sentence and example singular/plural (settings.js:336-344).
- vNext now: vNext separate Maximum held offers field; summary always 'offers' and example assumes a 5 LPA offer (tpo-college-rules-control.tsx:105-118).
- Fix: Match singular/plural grammar and N-held example for 1–5.

## G2-6-022-056  [P2] GAP  facet F18  effort S
- Legacy: Legacy Save changes button, success Placement rules saved (settings.js:209-211,345).
- vNext now: vNext Review and confirm rules and Placement rules saved. notice (tpo-college-rules-control.tsx:120-125).
- Fix: Clone exact CTA and feedback copy, keep safe confirm sequence if intended.

## G2-6-022-062  [P2] GAP  facet F20  effort S
- Legacy: Legacy LocalDateTime.now stamps writes (TpoSettingsService.java:43-45,56-59).
- vNext now: vNext new Date stores timezone timestamp (tpo-policy-service.ts:85-87,162-164).
- Fix: Specify UTC storage, IST rendering, and round-trip optimistic token type.

## G2-6-022-065  [P2] GAP  facet F22  effort M
- Legacy: Legacy college_placement_rules PK integer college, 4 core fields, version Long, LocalDateTime updatedAt (CollegePlacementRules.java:26-49).
- vNext now: vNext placement_college_rules UUID college FK, bigint version, timestamptz, check constraints (tpo-policy.ts:22-57).
- Fix: Document schema mapping, enum mismatch and missing DB upper bounds.
