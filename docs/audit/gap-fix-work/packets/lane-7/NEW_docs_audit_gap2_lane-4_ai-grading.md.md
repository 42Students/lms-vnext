# Work packet: NEW / MISSING items from docs/audit/gap2/lane-4/ai-grading.md

8 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/ai-grading.md

## G2-4-001-020  [P3] MISSING  facet F07  effort M
- Legacy: Client rejects no questions: `Exam must contain at least one question.` (`docs/legacy-source/frontend/src/pages/ai-grading.js:61-64`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No vNext validation needed for excluded route; if restored show this text in status.

## G2-4-001-021  [P3] MISSING  facet F07  effort M
- Legacy: Client rejects incomplete question with `Question N needs question number, question text, max marks, and rubric.` (`docs/legacy-source/frontend/src/pages/ai-grading.js:65-72`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not carry obsolete grading validation into assignment forms.

## G2-4-001-022  [P3] MISSING  facet F07  effort M
- Legacy: Invalid JSON says `Exam JSON is not valid. Fix the JSON or switch to Form mode.` (`docs/legacy-source/frontend/src/pages/ai-grading.js:49-59`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep obsolete JSON-specific error removed; reinstate only if JSON mode returns.

## G2-4-001-023  [P3] MISSING  facet F07  effort M
- Legacy: Without PDF the page says `Upload an answer booklet PDF first.` even after exam validates. (`docs/legacy-source/frontend/src/pages/ai-grading.js:529-534`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not expose grading-PDF validation from other upload surfaces.

## G2-4-001-024  [P3] MISSING  facet F07  effort M
- Legacy: Server non-JSON error includes HTTP status and first 240 normalized body chars. (`docs/legacy-source/frontend/src/pages/ai-grading.js:98-111`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Retire custom grading JSON error parser; retain only if endpoint is explicitly restored.

## G2-4-001-025  [P3] MISSING  facet F08  effort M
- Legacy: Initial status `Idle`; load example `Example loaded. Upload a PDF and run grading.`; clear `Inputs cleared.` (`docs/legacy-source/frontend/src/pages/ai-grading.js:453; docs/legacy-source/frontend/src/pages/ai-grading.js:478-492`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep retired run-status strings out of active UI.

## G2-4-001-026  [P3] MISSING  facet F08  effort M
- Legacy: Run stages `Validating questions...`, then `Uploading PDF and running extraction + grading. This can take a few minutes.` (`docs/legacy-source/frontend/src/pages/ai-grading.js:529-545`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not surface AI processing status in non-AI workflows.

## G2-4-001-027  [P3] MISSING  facet F08  effort M
- Legacy: Success text `Booklet graded. Review flagged questions before using final marks.` (`docs/legacy-source/frontend/src/pages/ai-grading.js:554-555`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep grading-success wording excluded; preserve manual review requirements independently.
