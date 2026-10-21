# Work packet: NEW / MISSING items from docs/audit/gap2/lane-4/api-ai-grading-grade-booklet.md

7 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/api-ai-grading-grade-booklet.md

## G2-4-002-013  [P3] MISSING  facet F07  effort M
- Legacy: Non-POST yields 405 `Method not allowed` and Allow POST. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:413-417`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep API absent; if reinstated restore 405/Allow contract.

## G2-4-002-014  [P3] MISSING  facet F07  effort M
- Legacy: Without OpenAI key returns 500 `AI grading service is not configured on this deployment.` (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:421-423`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not retain API key checks while AI features excluded.

## G2-4-002-015  [P3] MISSING  facet F07  effort M
- Legacy: Unparsable multipart boundary 400 `Missing multipart boundary.`; missing PDF returns 400 `Missing answer booklet PDF.` (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:303-306; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:450-454`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If API restored return exact field-specific 400 messages.

## G2-4-002-016  [P3] MISSING  facet F07  effort M
- Legacy: Invalid JSON returns 400 `The questions could not be read. Check the exam JSON.`; oversized question JSON 413 with shorten-text message. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:440-450`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No retained grader validation endpoint under current scope.

## G2-4-002-017  [P3] MISSING  facet F07  effort M
- Legacy: Non-PDF signature fails with 400 `The answer booklet must be a PDF file.` even if upload claims PDF MIME. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:451-458`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If restored keep PDF magic-byte verification, not MIME-only checking.

## G2-4-002-018  [P3] MISSING  facet F07  effort M
- Legacy: Timeout/abort returns 504 `AI grading took too long. Try again, or split the booklet.` (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:517-522`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Exclude paid upstream timeout messaging with retired route.

## G2-4-002-020  [P3] MISSING  facet F08  effort M
- Legacy: Errors surface as `{error: string}` with 400/401/403/405/413/429/500/503/504 statuses depending cause. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:413-462; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:517-522`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not fabricate success toasts; if re-scoped keep exact HTTP semantics.
