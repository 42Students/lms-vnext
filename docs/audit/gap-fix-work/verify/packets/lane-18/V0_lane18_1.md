# Verification packet (P0, do FIRST): 3 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-024-030 [P0] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy broadcasts immediately, showUntil hides after expiry; PlacementAnnouncementService.java:375-389,328-329
- Expected fix: Configure/verify durable due-time worker and user notice delivery before enabling schedule field, or remove schedule option.

## G2-6-016-059 [P0] MISSING facet F22
- Files: (none, new feature)
- Legacy: Legacy separate synonym DB and v2 free-text usage tracking (SkillRepository.java:93-105; SkillsSearchController.java:29-33).
- Expected fix: Register all three tables atomically and replay tests; do not turn on before verified.

## G2-7-034-001 [P0] GAP facet F01
- Files: src/app/(authenticated)/superadmin/[...legacy]/page.tsx
- Legacy: templates/[templateId]/index.js:14-21 redirects /superadmin/projects/templates/{id} to /superadmin/projects/templates/{id}/overview with same query
- Expected fix: Map legacy nested template root via authorized numeric/slug lookup to /admin/projects/templates/{UUID}
