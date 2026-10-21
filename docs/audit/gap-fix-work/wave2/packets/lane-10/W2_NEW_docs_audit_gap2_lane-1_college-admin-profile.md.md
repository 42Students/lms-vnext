# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-1/college-admin-profile.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/college-admin-profile.md

## G2-1-026-032  [P2] GAP  facet F06  effort S
- Legacy: src/components/college/college-admin-profile-editor.tsx:20: blanket 500 char max; S:10,15-31 server fields mostly max150.
- vNext now: docs/legacy-source/frontend/src/components/profile/about/contacts.js:138-169 and PD:95-130 legacy field-specific limits.
- Fix: Mirror server max values client-side per field.

## G2-1-026-047  [P2] GAP  facet F12  effort S
- Legacy: src/modules/people/college-admin-profile-edit-service.ts:63-65: failed JSON parsing silently defaults every optional field.
- vNext now: docs/legacy-source/frontend/src/components/profile/about.js:181-185: failed source leaves last known profile untouched.
- Fix: Record invalid field warning, retain valid keys.

## G2-1-026-048  [P2] GAP  facet F12  effort M
- Legacy: src/components/college/college-admin-profile-editor.tsx:58-160: save all fields even if only one changes.
- vNext now: docs/legacy-source/frontend/src/components/profile/about.js:104-140: each section independently edited with unsaved flag.
- Fix: Add conflict-aware per-field update or section dirty diff.
