# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l15-u024-super-admin-e2e.md

7 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l15-u024-super-admin-e2e.md

## G2-15-024-002  [P2] GAP  facet F02  effort M
- Legacy: One endpoint returns full SeedResult nested in Response status OK (SuperAdminE2eController.java:37-48; E2eSeedService.java:128-162).
- vNext now: Identity resolver returns UID/null, no multi-entity fixture result (src/auth/e2e-identity.ts:21-50).
- Fix: Expose typed fixture ID map to E2E harness with strict secret.

## G2-15-024-007  [P2] GAP  facet F06  effort M
- Legacy: app.e2e.seed.enabled false by default, enabled only explicit APP_E2E_SEED_ENABLED=true (SuperAdminE2eController.java:26-36; E2eSeedService.java:91-92,164-168).
- vNext now: DEV E2E identity separate env enabled true plus long secret (src/auth/e2e-identity.ts:24-38).
- Fix: Separate seed flag from identity override, default off and no prod route.

## G2-15-024-015  [P2] GAP  facet F12  effort M
- Legacy: Seed upsert reuse by college.uniqueId and name case insensitive (E2eSeedService.java:320-363).
- vNext now: Contact-based SHA256 UID, no college/entity dedupe (src/modules/people/e2e-identity-directory.ts:27-33).
- Fix: Replicate stable database uniqueness for reruns and parallel CI.

## G2-15-024-016  [P2] GAP  facet F13  effort M
- Legacy: Flag disabled throws IllegalStateException, controller no custom catch (SuperAdminE2eController.java:37-48; E2eSeedService.java:164-168).
- vNext now: Fail-closed identity returns null, login page redirects (src/auth/e2e-identity.ts:21-50; superadmin-login/page.tsx:3-6).
- Fix: Define safe 403/503 structured seed unavailable response without leaking secrets.

## G2-15-024-017  [P2] MISSING  facet F14  effort M
- Legacy: Fixture contains real sample video flower.mp4 and YouTube, no upload endpoint (E2eSeedService.java:198-216).
- vNext now: No seed fixture video content; no file writes (src/modules/people/e2e-identity-directory.ts:85-100).
- Fix: Seed playable signed/sample media fixture URLs for content tests.

## G2-15-024-018  [P2] MISSING  facet F15  effort M
- Legacy: Seeds notification, announcement, discussion but sends no bulk external email (E2eSeedService.java:230-234).
- vNext now: No notification/announcement fixture creation from identity directory (src/modules/people/e2e-identity-directory.ts:50-125).
- Fix: Add isolated in-app alerts fixtures; suppress production outbound delivery.

## G2-15-024-021  [P2] GAP  facet F18  effort S
- Legacy: Docs label Create minimal deterministic E2E seed data (UAT/dev only when enabled) (SuperAdminE2eController.java:39).
- vNext now: Legacy E2E login redirect comment says does not bypass sign-in (superadmin-login/page.tsx:3-6).
- Fix: Provide precise E2E setup/status copy without promising unsupported seed.
