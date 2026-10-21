# Verification packet (P0, do FIRST): 5 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-012-028 [P0] GAP facet F10
- Files: src/modules/notifications/zeptomail-email.ts
- Legacy: Legacy default token is hardcoded in source and reused if runtime blank; active secret exposure risk `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:31-31` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:109-114`
- Expected fix: Rotate compromised ZeptoMail credential immediately, revoke old key, purge code default in future fixes and scan history; never quote secret in audit

## G2-14-012-053 [P0] GAP facet F20
- Files: src/modules/notifications/zeptomail-email.ts
- Legacy: Legacy token blank falls back to hardcoded secret `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:31-31` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:109-114`
- Expected fix: Rotate leaked credential and prohibit hardcoded fallback

## G2-6-016-043 [P0] MISSING facet F13
- Files: src/modules/skills/catalog-readiness.ts
- Legacy: Legacy v1 search returns HTTP 200 or 500 (SkillController.java:57-75).
- Expected fix: Register/verify migrations before enabling functionality, leaving safe 503 while blocked.

## G2-18-022-034 [P0] GAP facet F12
- Files: src/modules/placements/tpo-offer-lifecycle-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:210-227 external acceptance reserves 48h dispute before cascade
- Expected fix: Add EXTERNAL_IMPORT pending dispute state + delayed acceptance cascade and student dispute prevention

## G2-18-022-050 [P0] GAP facet F21
- Files: src/modules/placements/tpo-offer-lifecycle-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:230-237 scheduled finalization external acceptance every30m
- Expected fix: Restore 48h external acceptance dispute/finalization scheduled job and idempotency
