# Work packet (wave 2): edit src/components/placements/public-recruit-from-us.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-006  [P2] GAP  facet F02  effort S
- Legacy: Second Ant Card titled Recruit from us. `docs/legacy-source/frontend/src/pages/placements/index.js:83`
- vNext now: Inline section with top border. `src/components/placements/public-recruit-from-us.tsx:40`
- Fix: Render second card with same gap.

## G2-11-001-024  [P2] GAP  facet F06  effort S
- Legacy: Work email validated with required/email field errors. `docs/legacy-source/frontend/src/pages/placements/index.js:90`
- vNext now: Native input + generic page error. `src/components/placements/public-recruit-from-us.tsx:51`
- Fix: Use exact field-level messages.

## G2-11-001-027  [P2] GAP  facet F06  effort S
- Legacy: Phone maxLength14; inputMode tel/autocomplete tel. `docs/legacy-source/frontend/src/pages/placements/index.js:96`
- vNext now: Mobile maxLength30; no autocomplete. `src/components/placements/public-recruit-from-us.tsx:65`
- Fix: Use 14-char limit and tel autocomplete.

## G2-11-001-028  [P2] GAP  facet F06  effort S
- Legacy: Note max 1000, three rows, optional. `docs/legacy-source/frontend/src/pages/placements/index.js:97`
- vNext now: HiringFor max 1500, no rows count. `src/components/placements/public-recruit-from-us.tsx:69`
- Fix: Use 1000/rows=3.

## G2-11-001-030  [P2] GAP  facet F06  effort S
- Legacy: Email becomes readOnly post-code. `docs/legacy-source/frontend/src/pages/placements/index.js:92`
- vNext now: Email disabled post-code. `src/components/placements/public-recruit-from-us.tsx:52`
- Fix: Make readonly not disabled.

## G2-11-001-031  [P2] GAP  facet F06  effort S
- Legacy: OTP numeric input + one-time-code autocomplete. `docs/legacy-source/frontend/src/pages/placements/index.js:104`
- vNext now: OTP pattern/numeric, autocomplete omitted. `src/components/placements/public-recruit-from-us.tsx:74`
- Fix: Set one-time-code autocomplete.

## G2-11-001-062  [P2] GAP  facet F16  effort S
- Legacy: Form vertical at all widths. `docs/legacy-source/frontend/src/pages/placements/index.js:89`
- vNext now: Two-column fields at sm breakpoint. `src/components/placements/public-recruit-from-us.tsx:55`
- Fix: Keep single vertical column.

## G2-11-001-063  [P2] GAP  facet F17  effort M
- Legacy: Ant Form.Item label and field error pairing. `docs/legacy-source/frontend/src/pages/placements/index.js:90`
- vNext now: Only global role=alert error. `src/components/placements/public-recruit-from-us.tsx:78`
- Fix: Field-associated errors/aria-invalid.

## G2-11-001-064  [P2] GAP  facet F17  effort S
- Legacy: OTP one-time-code autofill. `docs/legacy-source/frontend/src/pages/placements/index.js:104`
- vNext now: OTP autocomplete absent. `src/components/placements/public-recruit-from-us.tsx:74`
- Fix: Add autocomplete.

## G2-11-001-065  [P2] GAP  facet F17  effort S
- Legacy: Loading button visibly shows spinner. `docs/legacy-source/frontend/src/pages/placements/index.js:99`
- vNext now: Disabled only, no loading prop. `src/components/placements/public-recruit-from-us.tsx:80`
- Fix: Use loading indicator/aria-busy.

## G2-4-026-007  [P2] GAP  facet F02  effort M
- Legacy: Recruit from us second distinct Card under summary (`docs/legacy-source/frontend/src/pages/placements/index.js:83-113`)
- vNext now: Recruit form section separated by border inside same large canvas (`src/components/placements/public-recruit-from-us.tsx:40-87`)
- Fix: Separate Recruit card within public 760px column.

## G2-4-026-009  [P2] GAP  facet F03  effort M
- Legacy: Recruit section title and on-error alert icon (`docs/legacy-source/frontend/src/pages/placements/index.js:83-88`)
- vNext now: Heading plus plain alert paragraph, no icon (`src/components/placements/public-recruit-from-us.tsx:40-47,78`)
- Fix: Use legacy Card heading and Alert style/icon.

## G2-4-026-011  [P2] GAP  facet F03  effort M
- Legacy: AntD Result status=success with check icon (`docs/legacy-source/frontend/src/pages/placements/index.js:84-85`)
- vNext now: Plain text Thank you with role=status (`src/components/placements/public-recruit-from-us.tsx:42-45`)
- Fix: Recreate Result success icon/alignment/subtitle.

## G2-4-026-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy work email + required name visible before send code (`docs/legacy-source/frontend/src/pages/placements/index.js:90-94`)
- vNext now: Name only shown after send code (`src/components/placements/public-recruit-from-us.tsx:50-59`)
- Fix: Show name before sending and validate email+name together.

## G2-4-026-026  [P2] GAP  facet F06  effort S
- Legacy: Mobile optional maxLength=14, tel/autoComplete tel (`docs/legacy-source/frontend/src/pages/placements/index.js:96`)
- vNext now: Mobile maxLength=30, tel; no autocomplete (`src/components/placements/public-recruit-from-us.tsx:64-66`)
- Fix: Restore max14 and autocomplete tel.

## G2-4-026-027  [P2] GAP  facet F06  effort S
- Legacy: Note optional textarea rows3 maxLength=1000 (`docs/legacy-source/frontend/src/pages/placements/index.js:97`)
- vNext now: HiringFor maxLength=1500 (`src/components/placements/public-recruit-from-us.tsx:68-71`)
- Fix: Restore 1000 max and 3 rows.

## G2-4-026-028  [P2] GAP  facet F06  effort S
- Legacy: Code required six digits with `one-time-code` autofill (`docs/legacy-source/frontend/src/pages/placements/index.js:102-105`)
- vNext now: Six-digit pattern but no one-time-code autofill (`src/components/placements/public-recruit-from-us.tsx:73-77`)
- Fix: Add autoComplete=one-time-code to code input.

## G2-4-026-030  [P2] GAP  facet F06  effort S
- Legacy: Email readonly after code sent (`docs/legacy-source/frontend/src/pages/placements/index.js:90-92`)
- vNext now: Email disabled after code sent (`src/components/placements/public-recruit-from-us.tsx:50-52`)
- Fix: Prefer readOnly for form submission/assistive text; preserve email serialization.

## G2-4-026-066  [P2] GAP  facet F16  effort S
- Legacy: AntD form single-column vertical regardless viewport (`docs/legacy-source/frontend/src/pages/placements/index.js:90-109`)
- vNext now: Two-column on sm; full-width on mobile (`src/components/placements/public-recruit-from-us.tsx:55-72`)
- Fix: Keep single-column form consistent with old public page.

## G2-4-026-067  [P2] GAP  facet F17  effort M
- Legacy: AntD Form.Item associates labels, error messages and OTP autofill (`docs/legacy-source/frontend/src/pages/placements/index.js:89-105`)
- vNext now: Native input labels, page-level error; missing OTP autofill (`src/components/placements/public-recruit-from-us.tsx:47-78`)
- Fix: Link per-field errors with aria-describedby and autofill.
