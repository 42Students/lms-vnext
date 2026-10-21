# Lane chat-7 — wave 1 gap-fix proof

Changes are on `chatgpt/chat-7-b`; each commit is prefixed `[chat-7]`. Static review only, as instructed: no application run, typecheck, tests, CI or side-by-side screenshots. Existing membership scope and the one-workspace-per-role model are preserved.

- `NEW_docs_audit_gap2_lane-14_l19-u026-module-access-controller.md.md` | 0 code changes in module-access (existing shared owner paths) | 17/17 findings triaged and sent as exact file+ID lines to `docs/audit/gap-fix/handoff-lane-7.md`. P0 Placements college-only vs learner hierarchy and atomic-vs-partial bulk are conflicting product contracts; no fabricated owner decision, no silent contract change. Also handed off full tree, limit, audit, messaging and endpoint concerns. **Processed as a handoff, not asserted fixed**.
- `NEW_docs_audit_gap2_lane-2_admin-college-dashboard-controller.md.md` | G2-2-012-032, -052, -057, -011, -017, -033, -034 and -049 addressed in dashboard read services/page: denominator now all MARKED sessions × active enrolled roster (missing sparse record = present), scoped to selected membership college; true totals separate from eight-row previews; lowest attendance ratio ordered first; roll/class included; pending marked-session seven-day IST range; grading totals and staffing totals independent of preview limits. G2-2-012-054 **partial**: roster/implicit present relation corrected; grading inclusion of unpublished assignments is policy-dependent, handed off. G2-2-012-029 **handoff**: Super Admin acting-college read path must be authorized consistently across all dashboard services; not bypassed at page layer. G2-2-012-023 **intentional divergence**: UUID membership-derived scope and safe not-assigned EmptyState instead of accepting legacy numeric `collegeId` requests. **Static only; DB and rendering not executed**.

## Static re-read

Re-fetched edited `college-dashboard-risk-service.ts`, `college-dashboard-attendance-service.ts`, `college-dashboard-grading-service.ts`, `college-dashboard-staffing-service.ts`, `college/page.tsx` from the working branch. Checked imports/exports referenced by the page and balanced delimiter counts for all five; no packages added or shared exports renamed. Exact query semantics still require runtime validation with an implicit-present case (9 present, 1 absent = 90%), foreign-college/locked users, and a backlog larger than eight.

- `NEW_docs_audit_gap2_lane-7_u017-college-admin-workspace-team.md.part1of2.md` | 0 project code edits: 20/20 G2-7-017 findings routed to exact existing `src/components/projects`/`src/modules/projects` files in the handoff document. This is a shared Projects ownership boundary, not a missing vNext entry route. P1 data/append semantics require one coordinated owner edit; **handoff, not fixed**.
- `NEW_docs_audit_gap2_lane-7_u017-college-admin-workspace-team.md.part2of2.md` | 0 project code edits: 12/12 findings routed individually; append/replace, 500 total learner cap, task joins, role history and Check roster all depend on the shared Projects module. Existing membership identity retained. **Handoff, not fixed**.

- `NEW_docs_audit_gap2_lane-2_admin-assignment-content-write-controller.md.part1of2.md` | 0 code edits in out-of-area Courses/Faculty files; all 20/20 P1 resource/upload/points/CAS/edit semantics findings routed by target file and exact fix to handoff. Legacy mandatory resources conflict with vNext draft/publish design and private-storage contracts; **handoff, not fixed**.
- `NEW_docs_audit_gap2_lane-2_admin-assignment-content-write-controller.md.part2of2.md` | 0 code edits; 11/11 source-specific P1/P2 assignment storage/validation/feedback findings routed individually. No new packages or unsafe file upload grants added. **Handoff, not fixed**.

- `NEW_docs_audit_gap2_lane-7_u018-college-admin-deleted-workspaces.md.part1of2.md` | 0 code edits to shared Projects area; 20/20 findings audited and handed off with exact target path and fix. Existing archive restore is not equivalent to deleted soft-state, partial recoverability or mentorless BLOCKED restore; **handoff, not fixed**.
- `NEW_docs_audit_gap2_lane-7_u018-college-admin-deleted-workspaces.md.part2of2.md` | 0 code edits to shared Projects area; 8/8 findings handed off, including distinct deleted lifecycle and fetch/retry/empty states. Legacy IDs are not silently reused for UUID project instances; **handoff, not fixed**.

- `NEW_docs_audit_gap2_lane-13_l17-u023-learneroffer.md.part1of2.md` | 0 Placements code edits; 20/20 findings routed with IDs and exact fixes to placements API, service, schema, learner guard, and action model. Strict action schema and vNext UUIDs preserved; legacy missing-accept silent decline is a bug, not a behavior to restore. **Handoff, not fixed**.
- `NEW_docs_audit_gap2_lane-13_l17-u023-learneroffer.md.part2of2.md` | 0 Placements code edits; 7/7 findings routed (idempotent replay, concurrency, IST deadline, event/outbox and historical-ID mapping). No runtime or migration performed. **Handoff, not fixed**.

- `NEW_docs_audit_gap2_lane-2_admin-course-bulk-controller.md.part1of2.md` | 0 code edits outside lane-7 ownership; 20/20 findings handed off to Courses for actual status-field changes, cross-page selection, count/partial failures and per-course audit. The existing bulk endpoint only changes lesson content visibility, not legacy course active/enabled flags. **Handoff, not fixed**.
- `NEW_docs_audit_gap2_lane-2_admin-course-bulk-controller.md.part2of2.md` | 0 code edits; 7/7 findings handed off, including copy, scoped max, per-course response and cross-page selection. The vNext strict boolean input and same-origin guard are retained pending product decision. **Handoff, not fixed**.

- `NEW_docs_audit_gap2_lane-2_superadmin-audit-findings-controller.md.part1of2.md` | Applied G2-2-001-015 (severity-first stable sort), -018 (exact comma/repeated area filters and search in paths/pages/endpoints), -021/-027 (100-character assignee, exact placeholder and unchanged guard), -022 (legacy repo choices + lower-case SHA and default), -023/-028 (4000-character 1+ char comments), -024/-044 (duplicate resolved by external ID, with stronger anti-chain rule), -038 (old/new audit event summaries, PARTIAL), -048 (200 displayed refusals, PARTIAL). Preserved super-admin permission/CAS and stricter release/verification gate; did NOT recreate password door or fabricate importer. Schema-backed provenance, rich event columns, similarity lookup, sync button, credentials and diagnostics handed off, not claimed fixed. Static review only.
- `NEW_docs_audit_gap2_lane-2_superadmin-audit-findings-controller.md.part2of2.md` | Applied G2-2-001-026 (same-severity rejection), -029 (repo whitelist/lowercase SHA validation); G2-2-001-067/-068/-069/-070 require DB schema/migration/importer owner; -030 requires verified importer before genuine Sync now success/warning/error toasts. All outstanding IDs handed off; packet triaged, NOT fully functionally closed. No app run, tests, typecheck or CI.

- `NEW_docs_audit_gap2_lane-7_l14-u030-super-admin-interview-edit-form.md.part1of2.md` | 20/20 findings inspected against current SA interview operations, college appointment editor/action service and interviews schema. **0 code changes:** interview fields/UTC conversions/conflicts/mutation authorization depend on existing shared Placements+Admin UI and DB schema; exact-ID handoffs below, not functionally fixed. Do not expose a SA edit trigger until server supports selected-college mutation.
- `NEW_docs_audit_gap2_lane-7_l14-u030-super-admin-interview-edit-form.md.part2of2.md` | 7/7 findings inspected and assigned to the same shared owners for lifecycle states, validation copy, error mapping, notification and dirty-cancel behavior. **0 code changes:** no schema/DB route edited and no parity claim; handoff-only completion. Static review, no code execution or CI.

- `NEW_docs_audit_gap2_lane-7_l12-u027-faculty-teaching-assignment-controller.md.part1of2.md` | 20/20 findings reviewed against current Courses assignment services, Admin listing/editor, and college bulk. **0 code edits** in out-of-area Courses/Academics/DB: exact file/ID handoff recorded. Legacy numeric IDs and hard-delete/atomic bulk semantics conflict with membership UUID, retained history, and the intentional partial-college-bulk API; product owner decision required. **Handoff only, not fixed.**
- `NEW_docs_audit_gap2_lane-7_l12-u027-faculty-teaching-assignment-controller.md.part2of2.md` | 4/4 findings (error code, create/update/delete feedback and bulk copy) handed off with target file and exact request. **0 code edits**; no unverified success claims, no tests or CI.

- `NEW_docs_audit_gap2_lane-7_u016-college-admin-workspace-tasks.md.part1of2.md` | All 20 findings read against current shared project-workspace component and mentor-task-create service. 0 edits outside lane-7; 20/20 exact target/ID handoffs. Full legacy plan editor, atomic batch, taskToken and College Admin authoring require Projects/DB owner. **Handoff, not fixed**.
- `NEW_docs_audit_gap2_lane-7_u016-college-admin-workspace-tasks.md.part2of2.md` | 3/3 section error/retry, plan-save feedback and reversible removal notices handed off to Projects. 0 code edits; **not functionally closed**, static only.

- `NEW_docs_audit_gap2_lane-13_l19-u029-readiness-gate.md.md` | 19/19 findings reviewed against existing Colleges readiness model/service and tenant setup page. 0 edits to other-lane files; each finding routed by ID, target path and requested fix. Domain-login readiness vs ten-check operational readiness is intentionally distinct; cannot assume a full tenant rollout is proved by DNS/login readiness. **Handoff only, not functionally fixed**; static review, no code/CI execution.

- `NEW_docs_audit_gap2_lane-2_admin-class-schedule-controller.md.md` | 17/17 findings reviewed against existing Academics preview/execute model/service and recurrence UI. 0 edits to other-lane files; each finding routed by ID, target path and requested fix. Legacy partial per-occurrence failure versus vNext transaction semantics requires explicit product-policy resolution. **Handoff only, not functionally fixed**; static review, no code/CI execution.

- `NEW_docs_audit_gap2_lane-7_u007-college-admin-workspace-audit.md.md` | 17/17 findings read and recorded with exact target file/ID in cross-lane handoff. 0 code edits: shared Projects resource activity UI/service and DB-staged resource audit tables outside lane-7 area. No lossless resource before/after snapshot assumed. **Handoff, not fixed**, no execution or CI.

- `NEW_docs_audit_gap2_lane-13_l18-u019-faculty-verification.md.md` | 16/16 findings read and recorded with exact target file/ID in cross-lane handoff. 0 code edits: shared Auth OTP challenge service, secure identity-attempt schema and provider integration outside lane-7 area. Explicitly rejected restoring plaintext OTP, insecure verification via GET or production bypass secrets. **Handoff, not fixed**, no execution or CI.

- `NEW_docs_audit_gap2_lane-14_l18-u021-job-important-date-event-dto.md.md` | 16/16 audit findings assigned to specific Placements calendar/model/schema target files. 0 edits to out-of-area modules; generic importantDates and learner visible+applied union require controlled data model work. **Handoff, not fixed**. No TypeScript run or CI.

- `NEW_docs_audit_gap2_lane-6_l11-u020-tpo-recruiters.md.md` | 16/16 audit findings assigned to specific TPO recruiter leads/UI/messaging target files. 0 edits to out-of-area modules; invite delivery and drag/drop stage policy require coordinated TPO service changes. **Handoff, not fixed**. No TypeScript run or CI.

- `NEW_docs_audit_gap2_lane-7_l13-u023-learner-schedule-controller.md.md` | 16/16 exact-ID findings reviewed; 0 edits in out-of-area Placements learner schedule/read/reschedule and booking code. Targeted owner handoff per finding; booked candidate slots must remain separate from tentative rounds. **Handoff, not fixed**; no execution or CI.

- `NEW_docs_audit_gap2_lane-8_project-template.md.md` | 16/16 exact-ID findings reviewed; 0 edits in out-of-area Projects templates/blueprint/schema and export UI. Targeted owner handoff per finding; existing legacy provenance columns do not prove full JSON historical migration. **Handoff, not fixed**; no execution or CI.

- `NEW_docs_audit_gap2_lane-7_l15-u025-recruiter-college-controller.md.md` | 15/15 recruiter college overview/draft/request lifecycle issues mapped to own service and schema paths. Zero edits outside lane-7; preserve vNext grant-scoped privacy and TPO approvals. **Handoff, not fixed**.

- `src_app_company-share_token_page.tsx.md` | 15/15 findings triaged in one pass of `src/app/company-share/[token]/page.tsx`. Inline CSV is now visible without disclosure, unavailable ZIP explained, and code-page resend limitation gives safe recovery guidance. **Partial page/UI fix; resend-email and audited resume ZIP require protected services and are handed off**, not falsely marked implemented. Existing access POST and proof cookie untouched. Static JSX/import review only.

- `NEW_docs_audit_gap2_lane-13_l18-u026-new-program-controller.md.md` | 14/14 audit findings mapped to current Academics program APIs/service/model/schema target files. No lane-owned code changes; legacy integer IDs and duration-year fields need explicit safe conversion. **Handoff, not fixed**; static review only.

- `NEW_docs_audit_gap2_lane-2_admin-attendance-policy-controller.md.md` | 14/14 audit findings mapped to current Attendance policy editor/service and college attendance page target files. No lane-owned code changes; per-key inheritance/CAS and Admin mutation rights need a coordinated policy decision. **Handoff, not fixed**; static review only.

- `NEW_docs_audit_gap2_lane-2_l15-u030-hiring-dashboard.md.md` | 14/14 findings recorded as cross-lane handoff by ID and target. 0 edits to shared hiring dashboard analytics/services and table; organization-wide permission/csv export must be designed by owning lane. **Not fixed**, no CI.

- `NEW_docs_audit_gap2_lane-2_admin-assignment-controller.md.md` | 13/13 findings recorded as cross-lane handoff by ID and target. 0 edits to shared assignment directory/service/schema; section-specific filtering and degraded stat rows must be implemented by Courses owner. **Not fixed**, no CI.

- `NEW_docs_audit_gap2_lane-2_admin-assignment-publish-controller.md.md` | 13/13 findings reviewed and handed off with code target. No out-of-area Courses grade publish mutation/API edits, preserved permission/CAS requirements. **Handoff not fixed**, static source review only.

- `NEW_docs_audit_gap2_lane-7_l19-u027-course-controller.md.md` | 13/13 findings reviewed and handed off with code target. No out-of-area Courses catalogue service/schema/UI edits, preserved permission/CAS requirements. **Handoff not fixed**, static source review only.

- `NEW_docs_audit_gap2_lane-13_l17-u028-workspace-readiness.md.md` | All 12 findings read; exact-ID/project targets assigned to Projects readiness and override service/UI. No shared-files edited; release shipping gate and legacy evidence metric require product decision. **Handoff, not fixed**, no CI.

- `NEW_docs_audit_gap2_lane-2_admin-attendance-controller.md.md` | All 12 findings read; exact-ID/project targets assigned to Attendance workspace/service/route. No shared-files edited; server-enforced future-session restrictions and record refetch require secure read API. **Handoff, not fixed**, no CI.

- `NEW_docs_audit_gap2_lane-7_u005-college-admin-project-template-detail.md.md` | 12/12 findings reviewed with per-ID target handoff in Projects template read-only detail/UI/service. 0 files outside lane area edited. **Handoff, not fixed**, no code execution or CI.

- `NEW_docs_audit_gap2_lane-2_admin-college-summary-controller.md.md` | 11/11 findings reviewed with per-ID target handoff in College Admin dashboard-card/setup-checklist services. 0 files outside lane area edited. **Handoff, not fixed**, no code execution or CI.

- `NEW_docs_audit_gap2_lane-2_zeptomail-template-id-resolver.md.md` | 11/11 findings mapped to Notification template resolver/provider owner files. No code outside lane scope altered, security/tenant boundary retained. **Handoff, not fixed**; static only.

- `NEW_docs_audit_gap2_lane-6_resource-upload-controller.md.md` | 11/11 findings mapped to Storage policy/lifecycle and Courses lesson materials owner files. No code outside lane scope altered, security/tenant boundary retained. **Handoff, not fixed**; static only.

- `NEW_docs_audit_gap2_lane-6_tpo-batches-controller.md.md` | 10/10 findings reviewed and routed by ID to TPO batch participation/rules/read services. No out-of-area edits; no CI. **Handoff, not fixed**.

- `NEW_docs_audit_gap2_lane-13_l18-u030-superadmin-departments.md.md` | 8/8 findings reviewed and routed by ID to Academic departments page, mutation service and schema. No out-of-area edits; no CI. **Handoff, not fixed**.

- `NEW_docs_audit_gap2_lane-6_superadmin-login.md.md` | 8/8 packet findings triaged with exact target paths; no changes to shared sign-in and consent/auth outside lane ownership. **Handoff, not fixed**, no code/CI execution.

- `NEW_docs_audit_gap2_lane-14_l18-u029-semester-management.md.md` | 7/7 packet findings triaged with exact target paths; no changes to Academic semester form/page outside lane ownership. **Handoff, not fixed**, no code/CI execution.

- `src_lib_report-client-error.ts.md` | 7/7 findings evaluated; replaced root-only unchecked fetch with redacted bounded client report API plus opt-in installer for window script/resource errors, unhandledrejection with route-abort suppression, and opt-in non-suppressing console.error instrumentation. Typed categorical mid-action reporter exported; root installation and API/video/upload call sites still require owner integration, logged in handoff. No app tests or CI; static source review.

- `src_components_marketing_marketing-layout.tsx.md` | 7/7 findings inspected and improved in owned marketing layout: focus-visible Skip to main content/main anchor, site-wide Organization/WebSite JSON-LD, optional WebPage/BreadcrumbList projection, route metadata builder and safe prefilled demo mailto helper. Route pages must pass path/title and adopt metadata builder/DEMO_MAILTO to complete SEO+CTA, handed off; no misleading OG image asset invented. Static JSX/TypeScript review only.

- `NEW_docs_audit_gap2_lane-6_l11-u023-tpo-requests.md.md` | 6/6 findings inspected against src/app/(authenticated)/tpo/requests/page.tsx; exact ID, requested fix and target in handoff. Zero edits to out-of-area TPO Requests UI/service. **Handed off, not fixed**; no app/CI execution.

- `NEW_docs_audit_gap2_lane-6_l11-u029-superadmin-template-sprints.md.md` | 6/6 findings inspected against src/components/projects/super-admin-template-plan-editor.tsx; exact ID, requested fix and target in handoff. Zero edits to out-of-area Super Admin template sprints UI/service. **Handed off, not fixed**; no app/CI execution.

- `NEW_docs_audit_gap2_lane-6_telegram-webhook-controller.md.md` | 6/6 findings read and assigned per-ID to owning file(s), zero edits to Telegram alert callbacks out-of-lane service/schema. **Handoff, not fixed**; user-requested static review only, no CI.

- `NEW_docs_audit_gap2_lane-7_l18-u021-job-important-date-event-dto.md.md` | 6/6 findings read and assigned per-ID to owning file(s), zero edits to Job important-date DTO out-of-lane service/schema. **Handoff, not fixed**; user-requested static review only, no CI.

- `NEW_docs_audit_gap2_lane-7_u009-college-admin-workspace-index.md.md` | 6/6 findings reviewed and routed by ID. 0 out-of-area source edits. Projects owner to preserve whitelisted query context, validate UUID and avoid unauthorized lookups; not fixed. Static only, no CI.

- `NEW_docs_audit_gap2_lane-6_cross-06-files-uploads-media-storage.md.md` | 5/5 findings reviewed and routed by ID. 0 out-of-area source edits. Storage/Projects owner to preserve private signed downloads, upload caps, grant scope and user-visible errors; not fixed. Static only, no CI.

- `NEW_docs_audit_gap2_lane-6_l14-u029-tpo-batch-detail.md.md` | 5/5 findings read and logged as cross-lane handoffs. 0 out-of-area edits. Full-cohort server filters, cross-page bulk controls, independent readiness panels belong to TPO; not fixed. No execution/CI.

- `NEW_docs_audit_gap2_lane-2_r2-condition.md.md` | 4/4 findings read and logged as cross-lane handoffs. 0 out-of-area edits. Private R2 configuration intentionally requires all credentials and fails closed; contextual 503 and docs belong to Storage; not fixed. No execution/CI.

- `NEW_docs_audit_gap2_lane-6_l13-u022-tpo-request-controller.md.md` | 4/4 finding IDs mapped to Placements TPO standalone-request scope and decision error contracts. No code outside lane-7 changed. **Handoff, not fixed**. No execution/CI.

- `NEW_docs_audit_gap2_lane-7_l17-u021-public-job-response-dto.md.md` | 4/4 finding IDs mapped to public job migration, slug redirect, and whitelisted DTO projection. No code outside lane-7 changed. **Handoff, not fixed**. No execution/CI.

- `src_app_authenticated_dashboard_page.tsx.md` | G2-10-005-007 and G2-9-035-007 applied: no-college Super Admin is now legacy hero + exactly four platform cards + scope tip; no misleading global metric summaries or tenant-count fetch. G2-10-005-031 and G2-9-035-031 already fixed in `SuperAdminTodayBoard` (literal error and Retry link present); preserved. Static JSX/import review, no code/CI execution.

- `NEW_docs_audit_gap2_lane-2_r2-config.md.md` | 3/3 storage configuration findings triaged and routed to owning storage policy/service; no R2 credentials or unsafe fallback introduced. Existing `getPrivateR2Config` enforces four nonblank parameters and typed errors; runtime 503/ops diagnostics and deployment docs remain external dependency. **Handoff, not fixed**, no execution or CI.

- `NEW_docs_audit_gap2_lane-17_lesson-content-class-sequence-entity.md.md` | 2/2 lesson-content delivery ordering findings handed to Courses + schema owner: actual registered migration, runtime readiness/503 and disabled UI must be verified together. 0 out-of-area edits; **not fixed**. No code or CI execution.

- `src_lib_outbound.ts.md` | G2-13-011-021 intentional at-most-once unsafe POST preserved and documented; G2-14-012-050 bounded 10s transport already present, added safe exhausted-retryable-status telemetry `outbound.retry_deferred` without URL, body or recipients. Full provider-idempotency capability and outbox reconciliation require Messaging owner; **partial, not full parity**. No code or CI execution.

- `NEW_docs_audit_gap2_lane-16_u020-college.md.md` | G2-16-020-019 handed to src/modules/colleges/service.ts + faculty-chair association model/migration; chair/vice-chair historical FK and tenant scope require college schema association, not changed here. **Not fixed**, no execution/CI.

- `NEW_docs_audit_gap2_lane-20_job-application-status-history-service-impl.md.md` | G2-20-011-015 handed to src/modules/placements/application-status-history-service.ts + parent status mutation transaction; status-history write is currently transactional and deliberately fail-closed; product decision needed before any fail-open downgrade. **Not fixed**, no execution/CI.

- `NEW_docs_audit_gap2_lane-20_student-image-controller.md.md` | G2-20-024-017 reviewed; student-image gallery is still staged only and protected object storage is required. Exact target handoff recorded, no schema/verification/gallery mutation. **Not fixed**, no execution/CI.

- `NEW_docs_audit_gap2_lane-20_student-image.md.md` | G2-20-015-025 reviewed; student-image gallery is still staged only and protected object storage is required. Exact target handoff recorded, no schema/verification/gallery mutation. **Not fixed**, no execution/CI.

- `NEW_docs_audit_gap2_lane-6_project-template-college.md.md` | 1/1 findings reviewed and routed to Projects/schema legacy assignment import owner. No historical null assignedBy forged; product decision for explicit system actor. **Handoff, not fixed**. No tests/CI.

- `NEW_docs_audit_gap2_lane-2_temporary-sms-outage-recovery.md.md` | 3/3 findings reviewed and routed to Exotel SMS provider/diagnostics owner. No temporary test OTP bypass revived; privacy-safe provider warning remains intentional. **Handoff, not fixed**. No tests/CI.

- `src_lib_api-error.ts.md` | G2-2-036-019 applied: exact, non-revealing teaching-scope message for FACULTY_TEACHING_SCOPE_REQUIRED. G2-2-036-020 kept generic permission 403 vs known scoped-resource 404 (do not infer foreign college from plain AuthorizationError). G2-2-037-022 partial: route-specific help and toast copy must be mapped by endpoint/action, not centralized across unrelated name fields; handoff. No execution/CI.

- `NEW_docs_audit_gap2_lane-20_company-controller.md.md` | 2/2 company controller status/name and feedback findings routed to Placements company edit/create UI/service. Central api-error cannot safely infer which entity's `name` failed validation or whether the company was restored. **Handoff, not fixed**. No execution/CI.

- `src_lib_api-fetch.ts.md` | G2-1-037-020 applied: explicit abort now throws `ApiFetchCancelledError` (status 499, empty message, silent=true, retryable=false) before network warning; timeout remains 504. Exported cancellation type guard for call sites; no local retry UI created. Static source review only.

- `src_lib_tpo-recruiter-invite-api-error.ts.md` | G2-3-026-027 partially applied: NOT_ALLOWED invite now 400 rather than 409, with safe actionable rejection message; unusable link remains same generic 404 with no token details, retained machine codes. Per-field legacy InviteRejected codes absent from current service and need typed model extension; handoff recorded. No code execution/CI.

- `src_modules_admin-scope_service.ts.md` | G2-1-002-029 partially applied: AdminScopeServiceError now carries privacy-safe invalid/archived college/organization selection recovery copy without leaking identifiers; intentionally preserves one-scope-at-a-time vNext selector. API response currently chooses friendly message by code: add `ADMIN_SCOPE_NOT_FOUND` override in lane-owned friendly-error catalog when its packet is reached. Not a legacy 500; static review only.

- `NEW_docs_audit_gap2_lane-4_ai-grading.md.md` | G2-4-001-020, G2-4-001-021, G2-4-001-022, G2-4-001-023, G2-4-001-024, G2-4-001-025, G2-4-001-026, G2-4-001-027 all **skipped intentionally**: AI grading is explicitly OUT OF SCOPE by owner decision 2026-10-15 (docs/decisions/2026-10-14-orchestrator-defaults.md items 9 and 12). No AI validation, UI, provider or route recreated. Queue processed without functional parity claim. No execution/CI.

- `NEW_docs_audit_gap2_lane-4_api-ai-grading-grade-booklet.md.md` | 7/7 findings G2-4-002-013, G2-4-002-014, G2-4-002-015, G2-4-002-016, G2-4-002-017, G2-4-002-018, G2-4-002-020 intentionally skipped: AI grading and all AI routes are explicitly out of scope by owner decision 2026-10-15 (orchestrator-defaults.md 9,12). No grader/health routes, API keys, fake success UI or paid provider calls added; no CI.

- `NEW_docs_audit_gap2_lane-4_api-ai-grading-health.md.md` | 4/4 findings G2-4-003-010, G2-4-003-011, G2-4-003-012, G2-4-003-013 intentionally skipped: AI grading and all AI routes are explicitly out of scope by owner decision 2026-10-15 (orchestrator-defaults.md 9,12). No grader/health routes, API keys, fake success UI or paid provider calls added; no CI.

- `src_lib_friendly-error.ts.md` | G2-1-037-021/-023/-024 applied: legacy timeout, session-expired and conflict phrasing in shared friendly errors; draft state not cleared by this helper. Also mapped ADMIN_SCOPE_NOT_FOUND to actionable safe scope-choice text, completing earlier admin-scope message handoff. Static only; no tests/CI.

- `src_lib_safe-format.ts.md` | G2-2-037-021 applied with opt-in `validateClassScheduleDateRange` for ISO days: exact legacy startDate/endDate field/range text, strict date rollover rejection and bounded sanitized echo. Existing generic validateDateRange unchanged so unrelated forms are not affected. Caller wiring required in Academic class-schedule form (handoff), not yet user-facing; no CI.

- `docs/audit/gap-fix-work/packets/lane-1/src_modules_projects_college-readiness-releases-service.ts.md` | Three findings reviewed: implemented optional tenant-scoped title filtering and paged offset reads beyond 1000; kept default caller response unchanged. Archived selection and override-event paging remain unimplemented; handoff logged. No CI.
- `docs/audit/gap-fix-work/packets/lane-12/src_components_tpo_tpo-custom-job-type-rename.tsx.md` | Corrected untrue rename confirmation: backend atomically renames linked (including archived) drive types. Legacy from/to and exact affected count still require a preview; handoff logged. No CI.

- `docs/audit/gap-fix-work/packets/lane-13/src_app_api_auth_login_email_route.ts.md` | Read 3 findings: login HTTP helper already emits exact TOO_SOON legacy sentence and computed retryAfterSeconds via LoginError, so preserved. attemptId required is generic shared guard 400; isolated field error needs shared schema parse changes; not claimed done. No CI.
- `docs/audit/gap-fix-work/packets/lane-1/src_components_projects_project-admin-reassign-mentor-page.tsx.md` | Distinguished project workspace load, mentor option load, and workload load failures in existing guarded ErrorState; mentor fetch gets explicit Retry mentors action. Paging beyond 100 remains dependent on mentor service. No CI.

- `docs/audit/gap-fix-work/packets/lane-12/src_components_tpo_tpo-custom-job-type-placed.tsx.md` | Corrected placed-policy confirmation to warn real atomic cascade to linked/archived drives and report effects; server impact counts not yet exposed, handoff. No CI.
- `docs/audit/gap-fix-work/packets/lane-13/src_modules_announcements_validation.ts.md` | Announcement create schema now matches legacy required receiver/title/message and length copy; empty search q normalizes to no filter. Entity-layer permissive blank data intentionally not replicated because publish safety requires nonempty. No CI.

- `docs/audit/gap-fix-work/packets/lane-1/src_modules_projects_mentor-reassignment-workload-service.ts.md` | 3 findings: mentor workload now includes COMPLETED nonarchived workspaces consistent with list denominator; archived still excluded, tenant authorization untouched. No CI.
- `docs/audit/gap-fix-work/packets/lane-2/src_modules_placements_placement-legacy-posting-model.ts.md` | 3 findings: importantDates parses legacy date or at, retains type/dateType classification, normalizes date-only to explicit UTC midnight. Cross-org targeting hierarchy still needs bounded migration adapter, handed off. No CI.

- `docs/audit/gap-fix-work/packets/lane-12/src_app_authenticated_tpo_recruiters_page.tsx.md` | Reviewed recruiter manual-stage finding: page only passes read filters; mutation service remains the guard owner. Added server-boundary note. Transition allowlist/NOT_NOW reason still requires backend integration. No CI.
- `docs/audit/gap-fix-work/packets/lane-13/src_modules_announcements_tpo-notice-form-error-model.ts.md` | Exact TPO announcement title/body required copy restored, safe Couldn't save fallback added. Caller-to-code integration remains. No CI.

- `docs/audit/gap-fix-work/packets/lane-1/NEW_docs_audit_gap2_lane-7_u012-college-admin-workspace-readiness.md.md` | Removed shipped-release gate from executionComplete; release count/shipped remains visible informational. Nested readiness shape retained with new model; explicit legacy flat DTO adapter/migration still needed. No CI.
- `docs/audit/gap-fix-work/packets/lane-2/src_modules_placements_recruiter-company-reports-service.ts.md` | Aligned offer funnel to legacy RELEASED→ISSUED, ACCEPTED, DECLINED by excluding EXPIRED from offered totals. Company-granted relationship portfolio remains intentional access scope; creator-only legacy report requires owner decision/field mapping. No CI.

- `docs/audit/gap-fix-work/packets/lane-12/src_app_authenticated_tpo_settings_public-page_page.tsx.md` | Clarified cohort-level threshold and per-stat k-anonymity separately in public settings. Publication guard/model retained; no CI.
- `docs/audit/gap-fix-work/packets/lane-13/src_modules_people_learner-education-picker-model.ts.md` | Learner education UI now permits current/future end year while currently pursuing, warns on past date, and accepts trailing % for validation; optional grades still stricter for job screening and server-side schema needs corresponding parity. No CI.

- `docs/audit/gap-fix-work/packets/lane-1/NEW_docs_audit_gap2_lane-7_u006-college-admin-project-templates.md.md` | Legacy ?search= URL now redirects to canonical ?q=; keeps clear filter. Exact load error title restored and authorization errors no longer shown as generic transient outage. No CI.
- `docs/audit/gap-fix-work/packets/lane-2/src_modules_placements_learner-placement-announcement-model.ts.md` | Notice projection accepts optional validated explicit jobId, author, unread, showUntil provenance and scoped internal drive link, without inferring from free text. DB per-membership read receipt and UI link integration remain required; no CI.
