# Work packet: edit src/modules/projects/college-readiness-releases-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-032-022  [P1] GAP  facet F05  effort L
- Legacy: readiness/index.js:491-510 workspace list backend page25 with search
- vNext now: college-readiness-releases-service.ts:13-26 list choices capped1000, picker.tsx:15-19 local page25
- Fix: Allow searching all workspaces beyond 1000 and page via API

## G2-7-032-051  [P1] GAP  facet F12  effort M
- Legacy: readiness/index.js:155-169 archived removed from picker but included when currently selected
- vNext now: college-readiness-releases-service.ts:24-26 excludes ARCHIVED globally; project-admin-readiness-page.tsx:108-110 rejects selected archived
- Fix: Keep archived override manageable from active overrides list

## G2-7-032-071  [P1] GAP  facet F19  effort L
- Legacy: readiness/index.js:57-64 25-row server paging for both overrides and workspaces
- vNext now: college-readiness-releases-service.ts:13-26 caps choices at1000; all overrides service reads latest events
- Fix: Add bounded server paging for workspace choice and overrides, prevent long page
