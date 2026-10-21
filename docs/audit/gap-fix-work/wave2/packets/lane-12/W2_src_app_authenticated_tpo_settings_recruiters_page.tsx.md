# Work packet (wave 2): edit src/app/(authenticated)/tpo/settings/recruiters/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u024-tpo-settings.md

## G2-11-024-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:718-739 recruiter access table includes Joined through, Access, Extend and Remove
- vNext now: src/app/(authenticated)/tpo/settings/recruiters/page.tsx:136-280 normalized grants table and disclosures; row control locations differ
- Fix: Match legacy columns, badges and inline actions.

## G2-11-024-024  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:732-736 Extend recruiter dropdown and Give name N months more confirmation
- vNext now: src/app/(authenticated)/tpo/settings/recruiters/page.tsx:12-15 uses TpoRecruiterExtend within disclosure
- Fix: Restore row Extend dropdown and original modal text.

## G2-11-024-029  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:131-150 fail-closed access check waiting for getTeam
- vNext now: src/app/(authenticated)/tpo/settings/recruiters/page.tsx:59-66 checks generic TPO membership
- Fix: Enforce admin-only mutation, no unauthorized flash.

## G2-11-024-045  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:139 getTeam once then loads selected panel
- vNext now: src/app/(authenticated)/tpo/settings/rules/page.tsx:94 plus policy/jobs and src/app/(authenticated)/tpo/settings/recruiters/page.tsx:98-103 multiple independent reads
- Fix: Lazy-load job-specific data and sections.
