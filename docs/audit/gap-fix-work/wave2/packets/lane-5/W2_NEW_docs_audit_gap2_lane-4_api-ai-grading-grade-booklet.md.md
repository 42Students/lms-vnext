# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-4/api-ai-grading-grade-booklet.md

32 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/api-ai-grading-grade-booklet.md

## G2-4-002-001  [P3] MISSING  facet F01  effort M
- Legacy: POST `/api/ai-grading/grade-booklet` invoked only by page `runGrading`; not a navigable page. (`docs/legacy-source/frontend/src/pages/ai-grading.js:529-548; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:413-416`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep retired API route absent; do not add it to vNext navigation.

## G2-4-002-004  [P3] MISSING  facet F04  effort M
- Legacy: Response JSON top-level `file_id`, `extracted`, `graded`; extraction has summary, question answers and `unassigned`. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:127-174; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:512-516`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not expose retired JSON shape; if restored keep typed fields and answer ordering.

## G2-4-002-005  [P3] MISSING  facet F04  effort M
- Legacy: Each extracted answer contains `question_id`, `matched_label` nullable, `answer_text`, 1-indexed `pages`, `extraction_confidence`, `issues`. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:141-154; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:240-244`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If re-scoped validate exact per-answer DTO and 1-indexed pages.

## G2-4-002-006  [P3] MISSING  facet F04  effort M
- Legacy: Grading summary exposes `total_awarded`, `total_max`, `overall_confidence`, `issues`. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:176-190`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Retire report response schema; avoid conflating with manual assignment scores.

## G2-4-002-007  [P3] MISSING  facet F04  effort M
- Legacy: Each grading result includes `question_id`, maximum/awarded marks, confidence, review recommendation, rubric breakdown and feedback. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:192-220`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If grading returns, restore all rubric criteria rather than collapsing to a single mark.

## G2-4-002-009  [P3] MISSING  facet F06  effort M
- Legacy: Expected request is multipart form body, `exam_json` string and `pdf` file; built-in Next body parser disabled. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:3-8; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:438-451`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep multipart grader endpoint retired; do not repurpose for standard assignment uploads.

## G2-4-002-010  [P3] MISSING  facet F06  effort M
- Legacy: Question JSON requires nonempty `questions` array, up to 60 entries, with id/text/rubric/max_marks; exam_id optional, truncated to 80 chars. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:13-21; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:88-102`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If restored enforce 60/80 caps on server, independent of frontend.

## G2-4-002-011  [P3] MISSING  facet F06  effort M
- Legacy: Question id limit 40 chars; question and rubric each 4000; maximum marks positive and <=1000; own label_hints trimmed to 20, IDs truncated 40. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:13-22; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:103-122`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not apply AI-only validation constraints to unrelated LMS authoring forms.

## G2-4-002-012  [P3] MISSING  facet F06  effort M
- Legacy: Automatically generates label variants (`Q2`, `Question 2`, `3(a)`, `3.a`) then deduplicates case-insensitively. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:40-85; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:113-122`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If re-scoped restore label-hint generation exactly, not only user-supplied hints.

## G2-4-002-022  [P3] MISSING  facet F10  effort M
- Legacy: Verifies signed-in staff via backend `GET /api/v1/auth/ai-grading-access` before touching paid model. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:418-420; docs/legacy-source/frontend/src/utils/apiAuth.js:24-48; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:118-140`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep retired paid route unavailable; if re-scoped require real backend validation.

## G2-4-002-023  [P3] MISSING  facet F10  effort M
- Legacy: After validating body and magic bytes, asks backend `?use=true` to spend one daily grading. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:438-462; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:118-140`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Preserve spend-after-validation ordering if grading is ever reinstated.

## G2-4-002-024  [P3] MISSING  facet F10  effort M
- Legacy: Uploads PDF via POST `https://api.openai.com/v1/files` (purpose=user_data), calls Responses API once for extraction and once for grading. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:352-387; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:464-510`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not reintroduce OpenAI API calls or paid processing.

## G2-4-002-026  [P3] MISSING  facet F10  effort M
- Legacy: Finally reduces in-flight counters and starts best-effort remote file DELETE. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:389-400; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:523-529`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If API returns, ensure cleanup even on failed extraction or grading.

## G2-4-002-027  [P3] MISSING  facet F11  effort M
- Legacy: Endpoint refuses missing/invalid 3-part `lms_authenticated` cookie with 401 `Authentication required.` (`docs/legacy-source/frontend/src/utils/apiAuth.js:24-28`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep deleted; if revived never trust decoded unsigned cookie.

## G2-4-002-028  [P3] MISSING  facet F11  effort M
- Legacy: Java backend allows faculty and superadmin, forbids learners; backend session verification checks JWT validity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:113-124; docs/legacy-source/frontend/src/utils/apiAuth.js:1-10`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Restore equivalent role and token-version checks only on approved re-scope.

## G2-4-002-029  [P3] MISSING  facet F11  effort M
- Legacy: Access check failures pass through status/error or fail closed with 503 when backend verification unavailable. (`docs/legacy-source/frontend/src/utils/apiAuth.js:29-48`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Maintain fail-closed requirement for any later paid integration.

## G2-4-002-030  [P3] MISSING  facet F12  effort M
- Legacy: Per user concurrent grading limit 1; server-wide in-flight limit 3; returns 429 or 503 when exceeded. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:13-29; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:425-435`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No grader semaphore needed in vNext under current scope.

## G2-4-002-031  [P3] MISSING  facet F12  effort M
- Legacy: Backend allowance 25 gradings per IST day, keyed role/id/date in memory per backend pod; reset on restart. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:108-140`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If reinstated replace per-pod soft cap with explicitly designed central quota.

## G2-4-002-032  [P3] MISSING  facet F12  effort M
- Legacy: Prompt tells model to grade conservatively, ensure marks in [0,max], rubric sums within 0.01, review low confidence. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:268-281`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not replicate AI-generated grading business logic in manual grading.

## G2-4-002-033  [P3] MISSING  facet F12  effort M
- Legacy: Extraction prompt explicitly supports out-of-order answers, illegible handwriting and 1-indexed evidence pages. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:227-249`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If resuming scope, preserve uncertain evidence instead of silently scoring missing text.

## G2-4-002-035  [P3] MISSING  facet F14  effort M
- Legacy: Multipart request total maximum 26 MiB, PDF 25 MiB; buffers stream with count guard even without Content-Length. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:13-16; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:285-301`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No grader upload limits to port; if reinstated cap stream before buffer allocation.

## G2-4-002-036  [P3] MISSING  facet F14  effort M
- Legacy: File must start `%PDF-`, rejects empty and oversized payload; OpenAI uploaded copy deletion best-effort. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:451-458; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:389-400`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If recreated enforce magic bytes and verified deletion; no legacy grader file in storage.

## G2-4-002-040  [P3] MISSING  facet F18  effort M
- Legacy: Exact error `You already have a booklet being graded. Wait for it to finish.` at per-user concurrency gate. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:425-429`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep old AI-only error text archived; do not reuse in unrelated busy states.

## G2-4-002-041  [P3] MISSING  facet F18  effort M
- Legacy: Exact overload `AI grading is busy right now. Try again in a few minutes.` when three requests in flight. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:430-432`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: No grading overload banner to port.

## G2-4-002-042  [P3] MISSING  facet F18  effort M
- Legacy: Daily quota error from Java `You have used today's AI grading allowance (25). Try again tomorrow.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:128-134`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Retain as historical contract only while all AI removed.

## G2-4-002-043  [P3] MISSING  facet F19  effort M
- Legacy: API waits synchronously for two upstream Responses calls; each has 180,000ms timeout and 32,000 max output tokens. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:13-26; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:372-386; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:464-510`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not implement worker/queue for a retired synchronous paid endpoint.

## G2-4-002-044  [P3] MISSING  facet F19  effort M
- Legacy: Concurrency is in-process `Map` and `total`, so cross-instance requests bypass limits. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:29; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:425-435`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If re-scope approved replace with distributed/atomic throttling.

## G2-4-002-045  [P3] MISSING  facet F20  effort M
- Legacy: Missing/incorrect `Content-Length` cannot evade 26 MiB limit; stream destroys request on overflow. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:285-301`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: N/A under current scope; if reopened preserve streaming guard.

## G2-4-002-046  [P3] MISSING  facet F20  effort M
- Legacy: Daily quota counts use IST boundary but per-process state can be lost on restart; no idempotency key protects repeats. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:108-140; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:460-464`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: If grading restored define idempotent spend-once semantics.

## G2-4-002-047  [P3] MISSING  facet F20  effort M
- Legacy: A parsed but malformed OpenAI JSON response throws and yields 500; deleted remote PDF cleanup is fire-and-forget. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:486-510; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:517-529`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: On future scope add structured schema validation and await/monitor cleanup.

## G2-4-002-048  [P3] MISSING  facet F21  effort M
- Legacy: External OpenAI Files/Responses REST integration uses bearer `OPENAI_API_KEY` and `gpt-5.5` model. (`docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:10; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:352-387; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:464-505`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Keep all AI vendor credentials/dependencies/routes retired.

## G2-4-002-049  [P3] MISSING  facet F21  effort M
- Legacy: Backend `AuthController` acts as entitlement/quota integration; no background job, webhook or mail template in this handler. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:108-140; docs/legacy-source/frontend/src/pages/api/ai-grading/grade-booklet.js:413-530`)
- vNext now: NONE — intentionally dropped (`docs/decisions/2026-10-14-orchestrator-defaults.md:18-21`).
- Fix: Do not add deprecated entitlement endpoint to new auth module.
