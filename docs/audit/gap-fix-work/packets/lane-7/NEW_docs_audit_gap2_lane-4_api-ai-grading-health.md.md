# Work packet: NEW / MISSING items from docs/audit/gap2/lane-4/api-ai-grading-health.md

4 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/api-ai-grading-health.md

## G2-4-003-010  [P3] MISSING  facet F07  effort S
- Legacy: Any non-GET receives status 405, `Allow: GET`, JSON `{error:"Method not allowed"}`. (`docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:4-7`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If restored, enforce GET-only gate and 405 response exactly.

## G2-4-003-011  [P3] MISSING  facet F07  effort S
- Legacy: Missing/invalid JWT cookie produces 401 `Authentication required.` from helper. (`docs/legacy-source/frontend/src/utils/apiAuth.js:24-28`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not create a publicly accessible paid-health probe.

## G2-4-003-012  [P3] MISSING  facet F07  effort S
- Legacy: Nonfaculty/nonadmin gets 403 `AI grading is for faculty and admins.` (or upstream error). (`docs/legacy-source/frontend/src/utils/apiAuth.js:38-42; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:119-124`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No entitlement parity work while deleted.

## G2-4-003-013  [P3] MISSING  facet F07  effort S
- Legacy: Auth backend unavailable/malformed response yields 503 `Sign-in can't be checked right now. Try again in a minute.` (`docs/legacy-source/frontend/src/utils/apiAuth.js:29-48`)
- vNext now: NONE — scope intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep fail-closed semantics if endpoint ever reinstated.
