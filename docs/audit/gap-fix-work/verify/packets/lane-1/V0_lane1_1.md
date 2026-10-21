# Verification packet (P0, do FIRST): 2 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-025-009 [P0] GAP facet F05
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:89-101 — successful password grants full Super Admin session
- Expected fix: Do not reintroduce full-admin password bypass; require attributable named privileged identity

## G2-11-002-054 [P0] MISSING facet F09
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: CTC unusual warning inside selection confirmation `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:734`
- Expected fix: Implement confirmation
