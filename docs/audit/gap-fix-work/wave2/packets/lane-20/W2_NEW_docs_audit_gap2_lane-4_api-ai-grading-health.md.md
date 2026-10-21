# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-4/api-ai-grading-health.md

19 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/api-ai-grading-health.md

## G2-4-003-001  [P3] MISSING  facet F01  effort S
- Legacy: GET `/api/ai-grading/health`, fetched automatically when `/ai-grading` mounts, not separately linked. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:3-17; docs/legacy-source/frontend/src/pages/ai-grading.js:510-515`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep retired health endpoint unavailable; no navigation entry.

## G2-4-003-002  [P3] MISSING  facet F01  effort S
- Legacy: The parent page is a protected signed-in route, while `/api` is excluded from page proxy gating; handler authenticates itself. (`docs/legacy-source/frontend/src/proxy.js:11-35; docs/legacy-source/frontend/src/utils/apiAuth.js:1-10`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not add unauthenticated probe for an excluded paid provider.

## G2-4-003-004  [P3] MISSING  facet F03  effort S
- Legacy: No buttons/icons/tooltips rendered server-side; client page shows online/error pill. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:12-16; docs/legacy-source/frontend/src/pages/ai-grading.js:613-617`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep former grading status pill absent.

## G2-4-003-005  [P3] MISSING  facet F04  effort S
- Legacy: Response field `ok` is literal `true` for authenticated staff even when API key absent. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:12-15`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not treat removed `ok` flag as global service health indicator.

## G2-4-003-006  [P3] MISSING  facet F04  effort S
- Legacy: `has_api_key` is boolean presence of `process.env.OPENAI_API_KEY`, not a live provider ping. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:12-15`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not leak provider-key configuration through a new endpoint.

## G2-4-003-007  [P3] MISSING  facet F04  effort S
- Legacy: `remaining_today` uses `access.user.remainingToday ?? null` from Java quota endpoint. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:12-16; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:134-140`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If approval to restore, retain numeric/null allowance response.

## G2-4-003-016  [P3] MISSING  facet F10  effort S
- Legacy: Every GET makes backend `GET /api/v1/auth/ai-grading-access` without `use=true`; does NOT spend daily grading. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:9-10; docs/legacy-source/frontend/src/utils/apiAuth.js:24-34; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:118-135`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not restore paid-feature entitlement check; if returned, keep read-only quota query.

## G2-4-003-018  [P3] MISSING  facet F11  effort S
- Legacy: JWT presence/shape checked in Next helper; real token signature and role verification delegated to Java backend. (`docs/legacy-source/frontend/src/utils/apiAuth.js:1-10; docs/legacy-source/frontend/src/utils/apiAuth.js:24-48`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not substitute unsigned JWT payload for authorization.

## G2-4-003-019  [P3] MISSING  facet F11  effort S
- Legacy: Java controller permits faculty and superadmin; learner receives 403; remaining count based on authenticated principal. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:118-140`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If re-scoped require staff principal before exposing key metadata.

## G2-4-003-020  [P3] MISSING  facet F12  effort S
- Legacy: Quota is 25 per staff principal per Asia/Kolkata day; health call does not decrement count. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:108-140`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Preserve no-charge read-only semantics if feature returns.

## G2-4-003-021  [P3] MISSING  facet F12  effort S
- Legacy: `ok:true` means auth/handler success, not a verified OpenAI response; key presence signaled separately. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:12-16`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If a future provider health exists, distinguish configured from reachable.

## G2-4-003-022  [P3] MISSING  facet F13  effort S
- Legacy: Client health starts null and displays `Checking service` warning until fetch completes. (`docs/legacy-source/frontend/src/pages/ai-grading.js:455; docs/legacy-source/frontend/src/pages/ai-grading.js:510-515; docs/legacy-source/frontend/src/pages/ai-grading.js:613-617`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not show retired loading pill in vNext.

## G2-4-003-023  [P3] MISSING  facet F13  effort S
- Legacy: On HTTP error `readJsonResponse` resolves JSON; since `.then(setHealth)` ignores response.ok, `{error}` displays in warning pill. (`docs/legacy-source/frontend/src/pages/ai-grading.js:98-111; docs/legacy-source/frontend/src/pages/ai-grading.js:510-515; docs/legacy-source/frontend/src/pages/ai-grading.js:613-617`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Retain this historical failure state only in audit; avoid adopting non-2xx handling flaw.

## G2-4-003-024  [P3] MISSING  facet F13  effort S
- Legacy: Network/parse failure `catch` populates `{error:error.message}`; no retry or offline queue. (`docs/legacy-source/frontend/src/pages/ai-grading.js:510-515`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No retry or polling for excluded endpoint.

## G2-4-003-027  [P3] MISSING  facet F16  effort S
- Legacy: No mobile breakpoint/viewport/touch target in HTTP route; client pill resides in responsive page hero. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:3-17; docs/legacy-source/frontend/src/pages/ai-grading.js:603-618; docs/legacy-source/frontend/src/pages/ai-grading.js:1236-1277`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No responsive grader hero needed while excluded.

## G2-4-003-029  [P3] MISSING  facet F18  effort S
- Legacy: Exact text passed to page: `Grading service online`, fallback `Checking service`; unauthenticated errors use `Authentication required.` (`docs/legacy-source/frontend/src/pages/ai-grading.js:613-617; docs/legacy-source/frontend/src/utils/apiAuth.js:24-42`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Preserve deleted AI-only copy in source audit, not vNext labels.

## G2-4-003-030  [P3] MISSING  facet F19  effort S
- Legacy: One backend round-trip per page visit; 5-second auth timeout; no caching headers/ETag in handler. (`docs/legacy-source/frontend/src/utils/apiAuth.js:12; docs/legacy-source/frontend/src/utils/apiAuth.js:24-48; docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:3-17`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No need for health caching of disabled integration.

## G2-4-003-031  [P3] MISSING  facet F20  effort S
- Legacy: Missing `OPENAI_API_KEY` still responds `ok:true, has_api_key:false`; page may incorrectly show service online. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:12-16; docs/legacy-source/frontend/src/pages/ai-grading.js:614-616`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not propagate this legacy false-positive health state into other vNext health views.

## G2-4-003-033  [P3] MISSING  facet F21  effort S
- Legacy: No direct OpenAI request; reads presence of `OPENAI_API_KEY` and calls backend entitlement endpoint. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:9-16; docs/legacy-source/frontend/src/utils/apiAuth.js:29-34`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep AI secret checks removed; no external integration to retain.
