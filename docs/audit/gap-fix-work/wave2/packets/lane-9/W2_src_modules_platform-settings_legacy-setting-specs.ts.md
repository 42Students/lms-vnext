# Work packet (wave 2): edit src/modules/platform-settings/legacy-setting-specs.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md

## G2-17-029-011  [P2] GAP  facet F04  effort M
- Legacy: legacy TenantSettings.js:75-124 platform baseDomain/globalHost/cookieDomain/cookieSameSite/IP allowlist help and placeholders
- vNext now: vNext tenant-settings-editor.tsx:73-87 renders names/ranges but not full help; legacy-setting-specs.ts:3-65 lists keys
- Fix: Show exact hints/placeholder examples; distinguish deployment-managed settings as non-immediate

## G2-17-003-045  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:50 'Video policy', :55 'Video "watched" threshold', :56 help text.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 no video policy text, src/modules/platform-settings/legacy-setting-specs.ts:97-105 specifies different label 'Video watched threshold (%)'.
- Fix: Restore policy card's full wording, subtitle and % suffix.
