# Work packet: edit src/modules/admin-scope/service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md

## G2-1-002-029  [P2] GAP  facet F07  effort S
- Legacy: `AuthController.java:587-596,634-637` superadmin scope 400 `Invalid collegeId`/`collegeId does not belong to organizationId`, generic 500 `SCOPE_SET_FAILED`.
- vNext now: `src/modules/admin-scope/service.ts:16-25,104-156` returns `ADMIN_SCOPE_NOT_FOUND` for unknown/archived selected UUID; `src/app/api/auth/admin-scope/route.ts:75-78` uses generic apiErrorResponse.
- Fix: Provide accessible human validation of mismatched college/org and invalid selection, not only code.
