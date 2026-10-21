# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-4/ai-grading.md (part 1 of 2)

40 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/ai-grading.md

## G2-4-001-001  [P3] MISSING  facet F01  effort M
- Legacy: Direct signed-in `/ai-grading` page (`AiGradingPage`), not an ordinary course/assignment route. (`docs/legacy-source/frontend/src/pages/ai-grading.js:445; docs/legacy-source/frontend/src/proxy.js:11-15`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not restore `/ai-grading`; retain explicit scope-exception in parity matrix.

## G2-4-001-002  [P3] MISSING  facet F01  effort M
- Legacy: Legacy page has no internal breadcrumbs or back link; standalone hero instead. (`docs/legacy-source/frontend/src/pages/ai-grading.js:592-618`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Retain absence of page; if restored, use the standalone URL rather than inventing breadcrumb hierarchy.

## G2-4-001-003  [P3] MISSING  facet F02  effort M
- Legacy: Hero/health pill followed by Step 1 Questions + Rubric, Step 2 Upload, Step 3 Run Stats, Step 4 Run Output. (`docs/legacy-source/frontend/src/pages/ai-grading.js:603-756`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Preserve excluded four-step workflow; on re-scope rebuild in exactly this order.

## G2-4-001-004  [P3] MISSING  facet F02  effort M
- Legacy: Within Step 4, Quality Summary precedes Grading Results, Review Queue, Extraction Evidence. (`docs/legacy-source/frontend/src/pages/ai-grading.js:720-754`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Preserve intentionally absent ordered output sections; if reinstated, restore these four blocks.

## G2-4-001-005  [P3] MISSING  facet F03  effort M
- Legacy: Hero heading `AI Grading MVP`, eyebrow `Handwritten answer booklet evaluator`, service status pill. (`docs/legacy-source/frontend/src/pages/ai-grading.js:605-617`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not expose AI-grading hero or a nonfunctional status pill.

## G2-4-001-006  [P3] MISSING  facet F03  effort M
- Legacy: Form/JSON segmented buttons, Load Example and Clear toolbar actions. (`docs/legacy-source/frontend/src/pages/ai-grading.js:628-644`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep former mode/toolbar controls excluded; if restored, reproduce both segmented states and actions.

## G2-4-001-007  [P3] MISSING  facet F03  effort M
- Legacy: Question editor includes indexed `Question N`, disabled-at-one `Remove`, plus `Add Question` button. (`docs/legacy-source/frontend/src/pages/ai-grading.js:280-317`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not add removed question editor; if re-scoped preserve indexed controls and one-row remove lock.

## G2-4-001-008  [P3] MISSING  facet F03  effort M
- Legacy: Upload box shows `Current PDF`, filename or `No PDF uploaded yet`; adjacent status and Grade Booklet button. (`docs/legacy-source/frontend/src/pages/ai-grading.js:671-685`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not show dummy upload/status controls; restore complete upload-run semantics only on new authorization.

## G2-4-001-009  [P3] MISSING  facet F03  effort M
- Legacy: Step 4 has `Export JSON` and `Download Report PDF` buttons, both disabled without results. (`docs/legacy-source/frontend/src/pages/ai-grading.js:703-718`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not add inert export buttons; if restored gate both on successful results.

## G2-4-001-010  [P3] MISSING  facet F04  effort M
- Legacy: Stat values: marks / total, rounded score percentage, review count, extraction confidence, referenced pages. (`docs/legacy-source/frontend/src/pages/ai-grading.js:39-47; docs/legacy-source/frontend/src/pages/ai-grading.js:121-155; docs/legacy-source/frontend/src/pages/ai-grading.js:695-700`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep retired stat data absent; if restored compute the exact legacy formulas and placeholders.

## G2-4-001-011  [P3] MISSING  facet F04  effort M
- Legacy: Quality summary: overall grading confidence, mean grading confidence, mean extraction confidence. (`docs/legacy-source/frontend/src/pages/ai-grading.js:720-729`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not add synthetic grading confidence data in vNext.

## G2-4-001-012  [P3] MISSING  facet F04  effort M
- Legacy: Extraction evidence shows question ID, matched label (`-` fallback), pages (`-` fallback), confidence and issue list. (`docs/legacy-source/frontend/src/pages/ai-grading.js:367-399`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep retired extraction evidence absent; do not infer equivalent data from manual grading.

## G2-4-001-013  [P3] MISSING  facet F05  effort M
- Legacy: Grading table columns in order: Question, Marks, Confidence, Review, Feedback; array order preserved, no sorting/paging. (`docs/legacy-source/frontend/src/pages/ai-grading.js:334-366`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not silently merge grading results into existing assignment tables; when re-scoped maintain column order.

## G2-4-001-014  [P3] MISSING  facet F05  effort M
- Legacy: Review queue filters by review flag, grading confidence under .7, extraction confidence under .7, or issues. (`docs/legacy-source/frontend/src/pages/ai-grading.js:402-441`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Retain scope exclusion; if restored use exact 0.7 threshold and union predicates.

## G2-4-001-015  [P3] MISSING  facet F05  effort M
- Legacy: Extraction evidence is stacked cards, not a paged table; one section per `question_id`. (`docs/legacy-source/frontend/src/pages/ai-grading.js:370-399`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No extraction cards needed; if restored keep order and per-answer issue text.

## G2-4-001-016  [P3] MISSING  facet F06  effort M
- Legacy: Initial example exam has ID `semester-exam-demo` and sample questions 1a/1b/2 with 5/5/10 marks. (`docs/legacy-source/frontend/src/pages/ai-grading.js:5-30; docs/legacy-source/frontend/src/pages/ai-grading.js:446-449`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not seed demo grading exams in vNext.

## G2-4-001-017  [P3] MISSING  facet F06  effort M
- Legacy: Form mode is initial; Exam ID text input placeholder `semester-exam-demo`; question number, marks minimum 1, text, rubric fields. (`docs/legacy-source/frontend/src/pages/ai-grading.js:247-317; docs/legacy-source/frontend/src/pages/ai-grading.js:446-449`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep retired editor omitted; if restored implement these exact field types and defaults.

## G2-4-001-018  [P3] MISSING  facet F06  effort M
- Legacy: JSON mode provides raw textarea, spellcheck false, schema helper, form↔JSON sync on running. (`docs/legacy-source/frontend/src/pages/ai-grading.js:517-527; docs/legacy-source/frontend/src/pages/ai-grading.js:653-660`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not implement partial JSON editor; if restored synchronize both modes and validate before POST.

## G2-4-001-019  [P3] MISSING  facet F06  effort M
- Legacy: Load Example resets exam and question rows but not uploaded PDF; Clear resets questions/result but does not clear the `pdf` state. (`docs/legacy-source/frontend/src/pages/ai-grading.js:478-492`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Document this legacy retained-PDF quirk; do not accidentally replicate it in unrelated uploads.

## G2-4-001-028  [P3] MISSING  facet F09  effort M
- Legacy: No application modal or drawer; `Download Report PDF` opens printable browser popup (1100×900). (`docs/legacy-source/frontend/src/pages/ai-grading.js:576-590`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not add legacy print-popup workflow; on new scope restore popup-blocked handling.

## G2-4-001-029  [P3] MISSING  facet F10  effort M
- Legacy: Mount fetches GET `/api/ai-grading/health` and displays availability or service error. (`docs/legacy-source/frontend/src/pages/ai-grading.js:510-515; docs/legacy-source/frontend/src/pages/api/ai-grading/health.js:3-17`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Ensure excluded health endpoint remains unavailable; no polling needed.

## G2-4-001-030  [P3] MISSING  facet F10  effort M
- Legacy: Run uses POST multipart `/api/ai-grading/grade-booklet`, fields `exam_json` and `pdf`. (`docs/legacy-source/frontend/src/pages/ai-grading.js:529-555; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:413-516`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not restore paid processing API; if re-scoped rebuild multipart payload and checks.

## G2-4-001-031  [P3] MISSING  facet F10  effort M
- Legacy: Successful result remains client state (`setResult`); no application DB writes in page. (`docs/legacy-source/frontend/src/pages/ai-grading.js:445-459; docs/legacy-source/frontend/src/pages/ai-grading.js:554-555`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not invent database persistence for excluded experiments.

## G2-4-001-032  [P3] MISSING  facet F10  effort M
- Legacy: On failed POST reports `FILE_UPLOAD_FAILURE` with name/path/status/message before status error. (`docs/legacy-source/frontend/src/pages/ai-grading.js:548-552; docs/legacy-source/frontend/src/utils/clientErrorReporting.js:102-104`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not wire grading-specific telemetry endpoint into vNext.

## G2-4-001-033  [P3] MISSING  facet F11  effort M
- Legacy: Proxy treats `/ai-grading` as protected page; backend entitlement check is staff-only and validated server-side for API. (`docs/legacy-source/frontend/src/proxy.js:11-15; docs/legacy-source/frontend/src/utils/apiAuth.js:1-10; docs/legacy-source/frontend/src/utils/apiAuth.js:24-47`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not expose retired route or paid endpoint to any role.

## G2-4-001-034  [P3] MISSING  facet F11  effort M
- Legacy: Auth forwards `lms_authenticated` cookie; backend verifies JWT, type, usage allowance; missing/invalid cookie yields 401. (`docs/legacy-source/frontend/src/utils/apiAuth.js:24-42`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No entitlement parity work while deleted; if reopened enforce backend-confirmed authentication.

## G2-4-001-035  [P3] MISSING  facet F12  effort M
- Legacy: Stats round clamped [0,1] percentage to whole integer; absent/non-numeric confidence renders `n/a`. (`docs/legacy-source/frontend/src/pages/ai-grading.js:39-47`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Avoid copying AI confidence rounding into unrelated grade metrics.

## G2-4-001-036  [P3] MISSING  facet F12  effort M
- Legacy: Score uses awarded/max, max fallback sum of exam max marks; flags use OR of review, two confidences <.7 and issues. (`docs/legacy-source/frontend/src/pages/ai-grading.js:113-147`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Preserve formulas in archived spec only, not active product logic.

## G2-4-001-037  [P3] MISSING  facet F12  effort M
- Legacy: Page permits max marks as positive numeric; server separately bounds max marks at 1000 and questions at 60. (`docs/legacy-source/frontend/src/pages/ai-grading.js:65-84; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:13-26; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:88-124`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not port limits to manual assignments without product decision.

## G2-4-001-038  [P3] MISSING  facet F13  effort M
- Legacy: Initial output sections explicitly show `No grading results yet.`, `No review queue yet.`, `No extraction evidence yet.` (`docs/legacy-source/frontend/src/pages/ai-grading.js:334-339; docs/legacy-source/frontend/src/pages/ai-grading.js:402-414; docs/legacy-source/frontend/src/pages/ai-grading.js:370-373`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep empty-state copy archived for intentionally excluded screen.

## G2-4-001-039  [P3] MISSING  facet F13  effort M
- Legacy: Health pill starts `Checking service`, becomes `Grading service online` or displays health error. (`docs/legacy-source/frontend/src/pages/ai-grading.js:614-617; docs/legacy-source/frontend/src/pages/ai-grading.js:510-515`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No grading-service health UI in vNext.

## G2-4-001-040  [P3] MISSING  facet F13  effort M
- Legacy: During run button disables and says `Grading...`; on finish re-enables; failure message stays in status box. (`docs/legacy-source/frontend/src/pages/ai-grading.js:539-560; docs/legacy-source/frontend/src/pages/ai-grading.js:677-683`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not reuse grading-specific loading logic in active routes.

## G2-4-001-041  [P3] MISSING  facet F14  effort M
- Legacy: Upload accepts `application/pdf` at file-picker level; server validates `%PDF-` signature and 25 MiB file limit. (`docs/legacy-source/frontend/src/pages/ai-grading.js:675; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:13-16; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:450-458`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep PDF-only grading upload excluded; do not apply 25 MiB to all LMS storage.

## G2-4-001-042  [P3] MISSING  facet F14  effort M
- Legacy: JSON export is client Blob named `ai-grading-export-${Date.now()}.json`; PDF report uses window.print rather than server-generated file. (`docs/legacy-source/frontend/src/pages/ai-grading.js:563-590`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not expose JSON/PDF export for removed grading model.

## G2-4-001-043  [P3] MISSING  facet F14  effort M
- Legacy: Print report contains scores, review flags, confidence, grading and extraction tables with cautionary footer. (`docs/legacy-source/frontend/src/pages/ai-grading.js:157-236`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep printable grading template retired; if restored include caution and rows.

## G2-4-001-045  [P3] MISSING  facet F16  effort M
- Legacy: Standalone `.shell` max-width 1480 and padded 30px 22px 70px; responsive media rules at 1120px and 680px. (`docs/legacy-source/frontend/src/pages/ai-grading.js:792-800; docs/legacy-source/frontend/src/pages/ai-grading.js:1236-1277`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No responsive clone of excluded page needed; avoid accidental CSS inheritance into app shell.

## G2-4-001-047  [P3] MISSING  facet F18  effort M
- Legacy: Page uses exact labels `Questions + Rubric`, `Upload Answer Booklet + Run`, `Run Stats`, `Run Output`. (`docs/legacy-source/frontend/src/pages/ai-grading.js:620-708`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not add excluded wording to vNext nav or legacy-copy parity fixes.

## G2-4-001-048  [P3] MISSING  facet F18  effort M
- Legacy: Results use `Quality Summary`, `Grading Results`, `Review Queue`, `Extraction Evidence`. (`docs/legacy-source/frontend/src/pages/ai-grading.js:720-754`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Preserve labels in archival audit only.

## G2-4-001-049  [P3] MISSING  facet F19  effort M
- Legacy: All four output sections render full response arrays client-side without pagination/virtualization. (`docs/legacy-source/frontend/src/pages/ai-grading.js:334-441; docs/legacy-source/frontend/src/pages/ai-grading.js:720-754`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No active scale requirement for removed surface; on revival benchmark 60-question upper limit.

## G2-4-001-050  [P3] MISSING  facet F19  effort M
- Legacy: Processing warning says it can take minutes; server enforces upstream 180,000ms per paid request. (`docs/legacy-source/frontend/src/pages/ai-grading.js:543; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:13-26`)
- vNext now: NONE — intentionally removed (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No AI timeout integration required in vNext.
