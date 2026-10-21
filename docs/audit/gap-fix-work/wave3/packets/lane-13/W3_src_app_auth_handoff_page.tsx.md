# Work packet (wave 3): edit src/app/auth/handoff/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md

## G2-1-002-003  [P1] MISSING  facet F01  effort L
- Legacy: `AuthController.java:494-551` POST `/handoff/consume` for cross-parent-domain switch.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` redirects to `/?auth=handoff-retired`; no vNext consumable handoff route mapped.
- Fix: Replace retired handoff with re-auth-at-target UX and update every legacy cross-domain link; never restore raw refresh-token persistence.
