# Verification packet (P0, do FIRST): 3 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-030-038 [P0] GAP facet F11
- Files: src/app/(authenticated)/admin/placements/page.tsx
- Legacy: GLOBAL placement policy superadmin only and prompts clear selection before editing; DrivesLanding.js:264-270
- Expected fix: Ensure no-college global override editor is actually available and save guarded as GLOBAL, not acting-college setting.

## G2-15-005-078 [P0] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy verified/applied gate and durable reference/preview, error Retry (VerifiedJobDetailContent.jsx:38-112; JobDetailContent.jsx:911-1071)
- Expected fix: Close duplicate-apply unknown outcome before UI clone, add durable receipt and status recheck

## G2-7-029-001 [P0] GAP facet F01
- Files: src/app/(authenticated)/superadmin/[...legacy]/page.tsx
- Legacy: superadmin/projects/at-risk/index.js:60-63 route /superadmin/projects/at-risk uses selected Super Admin college scope
- Expected fix: Add exact protected redirect /superadmin/projects/at-risk -> /admin/projects/at-risk preserving safe query
