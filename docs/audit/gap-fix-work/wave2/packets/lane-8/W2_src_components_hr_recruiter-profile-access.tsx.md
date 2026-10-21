# Work packet (wave 2): edit src/components/hr/recruiter-profile-access.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-profile.md

## G2-1-035-012  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:179: College access card and explanation about placement-cell managed grant.
- vNext now: src/components/hr/recruiter-profile-access.tsx:55-56: novel manage/remove access explanation.
- Fix: Maintain old managed-access warning when adding leaving capability.

## G2-1-035-015  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:188: 'No college access.'
- vNext now: src/components/hr/recruiter-profile-access.tsx:68: EmptyState 'No active college access.' and P:128 'No active grants'.
- Fix: Match original empty-state wording.

## G2-1-035-057  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:188: zero grants 'No college access.'
- vNext now: src/components/hr/recruiter-profile-access.tsx:68: 'No active college access.'; P:128 table No active grants.
- Fix: Match legacy empty state.
