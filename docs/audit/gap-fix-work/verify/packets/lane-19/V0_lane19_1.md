# Verification packet (P0, do FIRST): 2 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-002-009 [P0] MISSING facet F02
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Offers tab embeds send selection list form `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:509`
- Expected fix: Restore selection composer

## G2-5-016-001 [P0] GAP facet F01
- Files: src/app/api/skills/route.ts
- Legacy: Global skill alias entity behind skills search, no standalone route `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SkillSynonym.java:9-15`
- Expected fix: Register and replay verified DB10 skills migration, then enable catalog.
