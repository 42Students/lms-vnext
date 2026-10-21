# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-4/ai-grading.md (part 2 of 2)

4 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/ai-grading.md

## G2-4-001-051  [P3] MISSING  facet F20  effort M
- Legacy: Clear retains selected `pdf` even while status says inputs cleared; next run can reuse old upload. (`docs/legacy-source/frontend/src/pages/ai-grading.js:485-492; docs/legacy-source/frontend/src/pages/ai-grading.js:529-537`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not duplicate state-retention bug in new uploads; document if this feature returns.

## G2-4-001-052  [P3] MISSING  facet F20  effort M
- Legacy: Empty result data are handled by fallback arrays; reviewed questions flag even if only extraction issue exists. (`docs/legacy-source/frontend/src/pages/ai-grading.js:113-155; docs/legacy-source/frontend/src/pages/ai-grading.js:402-414`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No active remediation because feature excluded; keep exact edge rule recorded.

## G2-4-001-053  [P3] MISSING  facet F20  effort M
- Legacy: `new Date().toLocaleString()` report timestamp follows client locale, not fixed IST. (`docs/legacy-source/frontend/src/pages/ai-grading.js:184-187`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If report ever restored, explicitly decide client locale vs IST default.

## G2-4-001-054  [P3] MISSING  facet F21  effort M
- Legacy: Backend proxy auth check has 5-second timeout, paid processing calls OpenAI files/responses, cleanup is best-effort. (`docs/legacy-source/frontend/src/utils/apiAuth.js:12-48; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:352-399`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep AI provider integration removed; ensure no secrets/jobs reintroduced.
