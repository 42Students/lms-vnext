# Lane chat-7 — gap-fix ownership and product-decision handoffs

Source: wave-1 packets in `docs/audit/gap-fix-work/packets/lane-7/`. These items were inspected against existing vNext implementations. No product policy or shared export was silently changed.

## Packet: L19-U026 Module Access Controller (17 findings)

- G2-19-026-016 | `src/modules/module-access/service.ts`, `admin-descendant-rule-write.ts`: Owner decision required: legacy Placements is college-only; vNext permits descendant scopes. Align validation and effective rules before changing behavior.
- G2-19-026-019 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Module Access owner to decide atomic transactional bulk or explicitly accepted partial success, with retry-only failed learners.
- G2-19-026-027 | `src/modules/module-access/service.ts`: Module Access owner to resolve whether Placements is college-only or follows the vNext academic hierarchy.
- G2-19-026-038 | `src/app/(authenticated)/admin/features/[collegeId]/page.tsx`: Product decision on Placements hierarchy needed before correcting contradictory copy.
- G2-19-026-041 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Mixed-college and locked-ancestor bulk must not claim legacy atomic semantics while saving partially.
- G2-19-026-003 | `src/modules/module-access/admin-read-service.ts`: Expose all inherited-only nodes in the full academic hierarchy grid, bounded for large colleges.
- G2-19-026-005 | `src/modules/module-access/service.ts`: Product/catalog owners to sign off legacy Courses→vNext Electives mapping; do not add `courses` as a silent fourth module.
- G2-19-026-007 | `src/modules/module-access/admin-read-service.ts`: Return the complete node inventory including nodes with no persisted override.
- G2-19-026-011 | `src/modules/module-access/admin-descendant-rule-write.ts`: Check omitted lock field preserves existing lock when enabled changes, while INHERIT deletes value and lock.
- G2-19-026-013 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Current cap 25 differs from legacy 1000; needs bounded transactional batch design before changing the limit.
- G2-19-026-022 | `src/app/(authenticated)/admin/features/[collegeId]/page.tsx` and module-access API: Build 7-endpoint parity crosswalk without replacing new membership-scope contracts.
- G2-19-026-034 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Required bulk audit/journal must be reconciled with optional post-write summary event.
- G2-19-026-040 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts`: Preflight and transact the selection rather than 25 independent writes if atomic contract is selected.
- G2-19-026-047 | `src/modules/module-access/service.ts`: Product owner to document explicit legacy courses vs new electives scope and permission mapping.
- G2-19-026-014 | `src/app/(authenticated)/admin/features/[collegeId]/page.tsx`: Friendly selected-college validation instead of opaque UUID parsing; numeric legacy IDs are intentionally not revived.
- G2-19-026-017 | `src/modules/module-access/super-admin-student-bulk-rule-service.ts` and caller: Reflect actual selection cap and empty selection errors after batch policy decision.
- G2-19-026-018 | `src/app/api/admin/students/module-access/bulk/route.ts` and caller: Give success counts, final effective state and partial-failure/audit warnings; don't impose obsolete Response envelope.

## Packet: AdminCollegeDashboardController (remaining outside-lane decisions)

- G2-2-012-029 | `src/auth/request-context.ts`, `src/modules/permissions/acting-college.ts`, `src/app/(authenticated)/college/page.tsx`: Authorize Super Admin selected-college dashboard without requiring college membership; adjust all dashboard read services consistently, not only page routing.
- G2-2-012-054 | `src/modules/admin-ui/college-dashboard-grading-service.ts`: Risk roster mapping corrected, but published-only assignment backlog needs product-owner signoff before including unpublished submissions; never expose drafts by simply dropping the PUBLISHED filter.

## Packets U017 Team, parts 1–2 (project-workspace shared ownership)

The target files are the existing shared Projects module (`src/components/projects/`, `src/modules/projects/`, `src/db/schema/projects.ts`). These are not the lane-7-owned company-share, marketing, dashboard, lib or admin-scope files. The two packets were inspected in order and routed, not represented as completed code changes.

- G2-7-017-005 | `src/components/projects/project-workspace.tsx`: Reinstate Team at a glance introduction and four metrics above roster using legacy spacing.
- G2-7-017-006 | `src/components/projects/project-workspace.tsx`: Show missing-primary-mentor warning to college admin.
- G2-7-017-007 | `src/components/projects/project-workspace.tsx`: Team-group notice and five-column team roster table instead of cards.
- G2-7-017-012 | `src/components/projects/project-workspace.tsx`: Authorized Check roster action on group-managed team, not passive note.
- G2-7-017-014 | `src/modules/projects/` team projection: Count distinct learner task assignees for coverage metric.
- G2-7-017-016 | `src/modules/projects/` team read and `project-workspace.tsx`: Per-member assigned/done/review/in-progress and last task activity.
- G2-7-017-019 | `src/components/projects/project-workspace.tsx`: Search member name/ID and filter all/learner/faculty.
- G2-7-017-020 | `src/components/projects/project-workspace.tsx`: Paginate filtered roster 20 at a time, reset on filter.
- G2-7-017-021 | `src/components/projects/project-workspace.tsx`: Restore Member/Role/Tasks assigned/Work status/Last task update columns.
- G2-7-017-025 | `src/components/projects/college-project-mentor-dialog.tsx`: Explain mentor reassignment consequences for meetings and task assignees.
- G2-7-017-027 | `src/components/projects/college-project-student-roster-dialog.tsx`: Default to append; optional explicit replacement.
- G2-7-017-029 | `src/components/projects/college-project-student-roster-dialog.tsx`: Replace existing learners checkbox, seed existing on check.
- G2-7-017-030 | `src/modules/projects/college-project-roster-model.ts`: Reconcile 100-request cap vs legacy 500 total active learners with bounded transaction.
- G2-7-017-034 | `src/modules/projects/college-project-roster-model.ts` and dialog: Validate/display current+adding count against 500 total.
- G2-7-017-041 | `src/components/projects/college-project-student-roster-dialog.tsx`: Show exact removed learner names and retained-prior-work consequence.
- G2-7-017-045 | `src/modules/projects/college-project-roster-service.ts` and API: Separate atomic append from explicit replace semantics.
- G2-7-017-050 | `src/components/projects/project-workspace.tsx`: Product divergence group-managed roster source of truth; guide admin to group editor.
- G2-7-017-051 | `src/modules/projects/college-project-roster-model.ts`: 500 total participant validation with bounded input.
- G2-7-017-052 | `src/modules/projects/college-project-roster-service.ts`: Default additively, no accidental existing-member removal.
- G2-7-017-058 | `src/components/projects/project-workspace.tsx`: Show no-primary-mentor admin warning.
- G2-7-017-073 | `src/components/projects/project-workspace.tsx`: Filter before 20-row slice, show matching range and stable pagination.
- G2-7-017-077 | `src/components/projects/college-project-student-roster-dialog.tsx`: Exact removed-name diff in confirmation.
- G2-7-017-080 | `src/db/schema/projects.ts` and project roster services: Explicit old user/role→membership/roleKind historical mapping, no duplicate reactivation.
- G2-7-017-081 | `src/modules/projects/college-project-roster-model.ts`: Match effective modal append default and 500 server total.
- G2-7-017-083 | `src/modules/projects/` team task join: Map old assignee ID to current assigneeMembershipId and aggregate status/date.
- G2-7-017-085 | `src/components/projects/project-workspace.tsx`: Group roster reconciliation or documented replacement flow.
- G2-7-017-032 | `src/components/projects/college-project-mentor-dialog.tsx`: Required error “Mentor is required”.
- G2-7-017-033 | `src/components/projects/college-project-student-roster-dialog.tsx`: Explicit decision on empty roster vs “At least one learner is required”.
- G2-7-017-036 | `src/components/projects/admin-project-section-page.tsx`: Scoped not-found/read-failure and Retry states.
- G2-7-017-037 | `src/components/projects/college-project-mentor-dialog.tsx`: Exact success/failure wording and retry.
- G2-7-017-038 | `src/components/projects/college-project-student-roster-dialog.tsx`: Exact success/failure wording for append vs replace.
- G2-7-017-039 | `src/components/projects/project-workspace.tsx`: Check roster reconciliation success/failure/zero-change feedback.

## Packets U006 Assignment Content Write, parts 1–2 (Courses/Assignments shared ownership)

The old controller maps to existing course-assignment creation, validation, storage and mutation files owned by the Courses/Faculty module, not lane-7-owned paths. The vNext draft/publish split, 10000 vs 1000 points and legacy R2 workflow must not be silently overwritten by this lane.

- G2-2-006-004 | `src/components/courses/college-assignment-create.tsx` | Implement 1-30 resource builder (INSTRUCTIONS, PDF, FILE, LINK) with title/reorder and upload.
- G2-2-006-005 | `src/components/courses/college-assignment-create.tsx` | Add typed file picker, in-progress indicator and prevent save until upload completes.
- G2-2-006-014 | `src/components/courses/college-assignment-create.tsx` | Enforce shared 0–1000 legacy points range across UI/validation/schema.
- G2-2-006-015 | `src/components/courses/college-assignment-create.tsx` | Decide on draft staging; if strict parity require due date for save and future check.
- G2-2-006-016 | `src/components/courses/college-assignment-create.tsx` | Build resource form and enforce count/unique methods/validation before save.
- G2-2-006-017 | `src/components/courses/college-assignment-create.tsx` | Restore typed resource editor, single instructions rule, HTML sanitizer.
- G2-2-006-018 | `src/components/courses/college-assignment-create.tsx` | Implement full PDF/FILE/LINK/INSTRUCTIONS set with HTTPS+file checks.
- G2-2-006-020 | `src/components/courses/college-assignment-create.tsx` | Allow title-only corrections after submissions, lock other fields.
- G2-2-006-024 | `src/components/courses/college-assignment-create.tsx` | Fail missing-resource saves with exact message on legacy-compatible path.
- G2-2-006-027 | `src/components/courses/college-assignment-create.tsx` | Port field and server errors for bad file metadata and storage outage.
- G2-2-006-031 | `src/components/courses/college-assignment-create.tsx` | Add upload/from-link UI with safe server attestation.
- G2-2-006-033 | `src/components/courses/college-assignment-create.tsx` | Persist resource structures atomically with assignment metadata, preserve legacy edit semantics.
- G2-2-006-035 | `src/components/courses/college-assignment-create.tsx` | Support legacy title-only edits; preserve all other post-submission immutable fields.
- G2-2-006-036 | `src/components/courses/college-assignment-create.tsx` | Verify super-admin acting-college and ADMIN-only scopes; ensure faculty cannot use admin shared authoring.
- G2-2-006-039 | `src/components/courses/college-assignment-create.tsx` | Align admin title-only edit with existing faculty model.
- G2-2-006-044 | `src/components/courses/college-assignment-create.tsx` | Add persisted scanned/attested file materials (PDF/FILE), upload and from-link controls.
- G2-2-006-045 | `src/components/courses/college-assignment-create.tsx` | Design vNext tenant-scoped private-file grants and verify size/MIME/virus attestation.
- G2-2-006-052 | `src/components/courses/college-assignment-create.tsx` | Require expectedUpdatedAt on admin edit and protect read-modify-save race with robust CAS.
- G2-2-006-055 | `src/components/courses/college-assignment-create.tsx` | Wire vNext attested R2 upload lifecycle and safe retries.
- G2-2-006-056 | `src/components/courses/college-assignment-create.tsx` | Integrate link import and upload with tenant-based access checks.
- G2-2-006-057 | `src/components/courses/college-assignment-create.tsx` | Write field-level migration mapping and preserve versions, audience, content resource payload.
- G2-2-006-058 | `src/components/courses/college-assignment-create.tsx` | Add appropriate normalized/material payload tables and constraints for all types.
- G2-2-006-059 | `src/components/courses/college-assignment-create.tsx` | Require non-optional CAS token for admin edits, including post-submission title edits.
- G2-2-006-062 | `src/components/courses/college-assignment-create.tsx` | Restoration prerequisite before claiming exact admin assignment authoring parity.
- G2-2-006-021 | `src/components/courses/college-assignment-create.tsx` | Map rejected admin mutation to exact response copy and HTTP 403 as appropriate.
- G2-2-006-022 | `src/components/courses/college-assignment-create.tsx` | Map missing lesson to legacy field-level/error banner wording.
- G2-2-006-023 | `src/components/courses/college-assignment-create.tsx` | Preserve distinct not-found versus unscoped forbidden states.
- G2-2-006-025 | `src/components/courses/college-assignment-create.tsx` | Reject duplicates and invalid methods in both client and API with exact message.
- G2-2-006-026 | `src/components/courses/college-assignment-create.tsx` | Align precise validation messages per field.
- G2-2-006-028 | `src/components/courses/college-assignment-create.tsx` | Preserve legacy success semantics or explicitly migrate to staged-publish UX.
- G2-2-006-029 | `src/components/courses/college-assignment-create.tsx` | Restore exact legacy toast variants if clone requirement includes operations feedback.

## Packets U018 Deleted workspaces, parts 1–2 (Projects ownership)

Source checked: current `/college/projects` page provides active/archived list; existing `instance-restore-service.ts` accepts `ARCHIVED` and requires primary mentor; neither exposes legacy deleted/partial-recovery semantics. Do not merge deleted with archived or promise recovered content. Existing Projects files and DB schema are outside lane-7-owned paths; all actionable packet findings handed off, not fixed.

- G2-7-018-005 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Create standalone deleted list anatomy rather than showing active list
- G2-7-018-006 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Build page Card and conditionally render states
- G2-7-018-008 | `src/components/projects/project-admin-workspace-list.tsx` | Recreate 3 columns and Undo icon/button
- G2-7-018-009 | `src/components/projects/project-archive-control.tsx` | Offer per-deleted-row restore with content-preservation warning
- G2-7-018-012 | `src/modules/projects/admin-insights-service.ts` | Implement deleted page projection and true total count from soft-deleted records
- G2-7-018-015 | `src/modules/projects/instance-restore-service.ts` | Reproduce mentorless restore as recoverable BLOCKED instead of hard failure, or flag deliberate stronger policy
- G2-7-018-016 | `src/db/schema/projects.ts` | Track legacy recoverability and warn when old edits not recoverable
- G2-7-018-021 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Implement post-restore page correction to prevent false empty page
- G2-7-018-027 | `src/components/projects/project-archive-control.tsx` | Condition restore confirmation on actual recoverable snapshot ability
- G2-7-018-029 | `src/components/projects/project-archive-control.tsx` | Preserve mentorless warning and restoration outcome handling
- G2-7-018-033 | `src/components/projects/project-archive-control.tsx` | Provide partial legacy recovery warning and preserve user choice
- G2-7-018-036 | `src/app/api/projects/[projectId]/restore/route.ts` | Differentiate soft-delete restore from archive restore, supply correct concurrency token
- G2-7-018-038 | `src/modules/projects/instance-restore-service.ts` | Restore soft-deleted child records where applicable; migration/recoverability indicator
- G2-7-018-041 | `src/db/schema/projects.ts` | Represent separate soft deletion from archived status or explicitly merge with migration semantics
- G2-7-018-042 | `src/modules/projects/instance-restore-service.ts` | Implement content-preserving vs legacy partial recovery behavior
- G2-7-018-043 | `src/modules/projects/instance-restore-service.ts` | Support mentorless blocked restore or mark policy change and give recovery path
- G2-7-018-060 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Implement efficient tenant-indexed deleted count and list
- G2-7-018-064 | `src/modules/projects/instance-restore-service.ts` | Decide mentorless recovery state transition explicitly
- G2-7-018-066 | `src/db/schema/projects.ts` | Add explicit deleted state and recoverable-content marker or proven migration plan
- G2-7-018-067 | `src/db/schema/projects.ts` | Map legacy identifiers, mentor and recoverable snapshot into deleted DTO
- G2-7-018-068 | `src/modules/projects/instance-restore-service.ts` | Separate archived lifecycle and soft-deleted restore semantics in schema/service
- G2-7-018-069 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Do not silently substitute Archived workspaces for Deleted workspaces
- G2-7-018-070 | `src/modules/projects/instance-restore-service.ts` | Document intentional stronger guard if owner chooses it; provide manual recovery pathway
- G2-7-018-025 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Use exact deleted-list failure wording and separate retry
- G2-7-018-026 | `src/components/projects/project-archive-control.tsx` | Retain fallback string and detailed project error modal or actionable 409
- G2-7-018-028 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Match title/description in shell
- G2-7-018-030 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Use exact error banner and retry control
- G2-7-018-031 | `src/app/(authenticated)/college/projects/page.tsx + new deleted route` | Prevent false No deleted workspaces empty state after fetch failure

## Packets L17-U023 LearnerOfferController, parts 1–2 (Placements ownership)

Source checked: actual canonical learner response is `POST /api/placements/offers/[offerId]/actions` with strict action validation; there is no requirement to recreate legacy numeric-ID accept endpoint. Existing placement offer service and schema are outside lane-7's wave-1 file ownership. Preserve the intentional vNext issued/accepted/declined status model until the Placements owner approves a crosswalk. Every finding follows with requested fix; these are **handoffs, not patches**.

- G2-17-23-002 | `src/app/api/placements/offers/[offerId]/actions/route.ts + src/modules/placements/validation.ts` | Document old route→new route, int→UUID ID crosswalk and update any remaining old deep links/clients; do not expose unsafe numeric alias
- G2-17-23-015 | `src/app/api/placements/offers/[offerId]/actions/route.ts + src/modules/placements/validation.ts` | Add explicit legacy numeric↔UUID offer ID reconciliation in migration/integration ledger; reject malformed identifiers before DB
- G2-17-23-016 | `src/modules/placements/validation.ts` | Make accept intent explicit and reject absent/nonboolean legacy accept; never silently convert malformed payload into decline
- G2-17-23-018 | `src/db/schema/placements.ts` | Crosswalk RELEASED→ISSUED and legacy SELECTED/PENDING_VERIFICATION separately; never conflate unpublished selection with issued offer
- G2-17-23-020 | `src/db/schema/placements.ts` | Verify cascade correlation is durable/readable from both new offer and status-history records and historical reports, not just request result
- G2-17-23-026 | `src/app/api/placements/offers/[offerId]/actions/route.ts + src/modules/placements/validation.ts` | Retain vNext strict validation; document legacy bug, never provide a compatibility adapter that interprets missing accept as DECLINE
- G2-17-23-036 | `src/modules/placements/offer-service.ts` | Ensure denial for foreign offer uses indistinguishable response timing/status from nonexistent offer and no app ID leaks
- G2-17-23-037 | `src/modules/placements/learner-offer-action-error-model.ts` | Use 409 business conflict (not legacy erroneous 404) and display appropriate "already accepted another offer" remediation
- G2-17-23-038 | `src/app/api/placements/offers/[offerId]/actions/route.ts + src/modules/placements/validation.ts` | Canonicalize on strict schema so old controller and alternative controller cannot produce opposite outcome for malformed body
- G2-17-23-047 | `src/db/schema/placements.ts` | Document application-vs-offer state ownership; ensure all reports and learner timeline reflect accepted/declined decision without legacy HIRED/REJECTED column
- G2-17-23-048 | `src/modules/placements/offer-service.ts` | Crosswalk legacy six active statuses and statuses now modeled as SUBMITTED; prove all eligible sibling applications, not just one subset, transition correctly
- G2-17-23-049 | `src/modules/placements/offer-service.ts` | Verify one-offer-per-application and LOI behavior, ensure accepted offer and sibling offer histories converge without stale open offer
- G2-17-23-051 | `src/db/schema/placements.ts` | Ensure offer state, application history, timeline and cascade identifier are consistently joined; avoid double historical events on replay
- G2-17-23-052 | `src/modules/placements/offer-service.ts` | Crosswalk old TPO bell/audit activity to vNext TPO inbox and learner activity, preserving college/actor/job/application/offer IDs
- G2-17-23-055 | `src/modules/placements/learner-participation-guard.ts` | Product decision: when module/eligibility revoked after offer release, provide secure access to legally required pending response instead of silent lockout (or document intentional block)
- G2-17-23-056 | `src/modules/placements/offer-service.ts` | Avoid offering an ID/status enumeration oracle in any compatibility route; require owner-scope before revealing offer state or deadline
- G2-17-23-058 | `src/app/api/placements/offers/[offerId]/actions/route.ts + src/modules/placements/validation.ts` | Explicitly map old offer/application dual states to new issued state; detect inconsistent legacy-migrated rows before accepting
- G2-17-23-061 | `src/modules/placements/offer-service.ts` | Confirm internship/LOI policy exception and cross-college accepted offers; show clear conflict rather than generic error
- G2-17-23-062 | `src/modules/placements/offer-service.ts` | Create explicit old/new decision matrix for Dream, internship, LOI, placement category and uplift; avoid accidental blanket withdrawal
- G2-17-23-077 | `src/modules/placements/offer-service.ts` | Benchmark worst-case student with many offers/interviews and ensure consistent lock ordering, bounded work, no timeout-induced partial writes
- G2-17-23-079 | `src/app/api/placements/offers/[offerId]/actions/route.ts + src/modules/placements/validation.ts` | Resolve contradictory idempotency contract: either allow exact same-actor retry before expectedStatus rejection or intentionally return 409; cover deadline crossover
- G2-17-23-080 | `src/db/schema/placements.ts` | Verify no deadlocks for simultaneous accept/decline/withdraw/interview updates and no dual accepted outcomes; preserve deterministic lock order
- G2-17-23-081 | `src/db/schema/placements.ts` | Define one authoritative Asia/Kolkata business deadline converted to UTC instant; guard at lock time and format IST correctly
- G2-17-23-083 | `src/modules/placements/offer-service.ts` | Reconcile durable event/outbox delivery semantics and post-commit notification guarantees; add audit event correlation IDs
- G2-17-23-085 | `src/db/schema/placements.ts` | Maintain legacy id/type crosswalk in DB08 migration for records, reports and external links; do not cast numeric IDs to UUID
- G2-17-23-086 | `src/db/schema/placements.ts` | Map SELECTED/PENDING_VERIFICATION/RELEASED and REVOKED separately to vNext issuance/withdrawal; validate archival cases before importing
- G2-17-23-088 | `src/db/schema/placements.ts` | Ensure report timeline can relate offer, application, actor, status, cascade and notification from both models

## Packets U014 AdminCourseBulkController, parts 1–2 (Courses ownership)

Source checked: `src/modules/courses/super-admin-course-bulk-visibility.ts` updates nested lesson visibility, *not course flags*; the UI is `src/components/courses/super-admin-course-bulk-visibility.tsx` and resets selection outside the page. Do not call this functional parity until an actual course-status bulk contract is implemented. Both current files are outside lane-7's wave-1 write ownership; all findings handed off, not fixed.

- G2-2-014-006 | `src/components/courses/super-admin-course-bulk-visibility.tsx` | Preserve cross-page selected IDs scoped to current college.
- G2-2-014-007 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Report per COURSE updated/failed and reasons, not only content-level changes.
- G2-2-014-008 | `src/components/courses/admin-course-overview.tsx` | Make visible chip reflect course learner visibility, not lesson content count alone.
- G2-2-014-009 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Implement status/visibility bulk flags or document intentionally different feature.
- G2-2-014-011 | `src/components/courses/super-admin-course-bulk-visibility.tsx` | Retain selected IDs across filter/page within same scope, clear on acting-college change.
- G2-2-014-012 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Provide three independent nullable status controls and combination validation.
- G2-2-014-019 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Continue to process authorized selected courses and return per-item failure instead of aborting whole batch.
- G2-2-014-023 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Implement actual course status updates atomically per course; not a lesson visibility substitute.
- G2-2-014-024 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Restore partial per-course active/enabled/allow-display update semantics.
- G2-2-014-025 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Isolate unauthorized/invalid course and process remaining permitted IDs.
- G2-2-014-026 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Add summary COURSE_BULK_STATUS_UPDATE event with original requested/updated/failed counts.
- G2-2-014-028 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Provide college-admin bulk status functionality with central course permission.
- G2-2-014-030 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Do not treat lesson-content hide as course hide; preserve course-level visibility and learner queries.
- G2-2-014-032 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Preserve per-course partial completion semantics and response classification.
- G2-2-014-043 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Do not apply 500-lesson content cap to course-status operation.
- G2-2-014-044 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Implement true flag CAS/integer version for courses while preserving unrelated fields.
- G2-2-014-046 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Wire proper course write service with per-item scope and audit.
- G2-2-014-047 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Persist actual course status and mapping, not merely lesson content flags.
- G2-2-014-048 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Use partial update query, preserve metadata and optimistic version.
- G2-2-014-049 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | High-priority functional non-equivalence: name/API suggests course status but operation differs.
- G2-2-014-050 | `src/components/courses/super-admin-course-bulk-visibility.tsx` | Restore selection across paginated catalog while isolating acting-college scopes.
- G2-2-014-016 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Use configured N in both validation and message.
- G2-2-014-017 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Validate partial flag updates; retain legacy error.
- G2-2-014-018 | `src/modules/courses/super-admin-course-bulk-visibility.ts` | Support safe versioned legacy body mapping.
- G2-2-014-020 | `src/components/courses/super-admin-course-bulk-visibility.tsx` | Include per-course requested/updated counts in summary.
- G2-2-014-021 | `src/components/courses/super-admin-course-bulk-visibility.tsx` | Show sanitized per-course failure details and partial-success warning.
- G2-2-014-015 | `src/app/api/admin/courses/bulk-status/route.ts` | Surface exact empty selection message.

## Super Admin independent audit findings — lane-7 wave-1 packets (2026-10-21)

- G2-2-001-005 | `src/app/api/tracker/audit-findings/sync/route.ts`, `src/modules/bug-tracker/independent-finding-importer.ts` | Implement credential-verified privileged POST sync and outcome; UI button only after job actually exists; do not fake success.
- G2-2-001-013 | `src/db/schema/db10-audit-findings.draft.ts` + migration + tracker detail | Add persisted roles, environment, reported agent/session, related IDs, source commit; show true provenance on detail.
- G2-2-001-024 | `src/modules/bug-tracker/independent-audit-findings-service.ts` + tracker detail | Existing duplicate suggestions are first-page findings only; implement same-area 0.6-word overlap query, five suggestions with verified external IDs.
- G2-2-001-025 | `src/modules/bug-tracker/independent-finding-transition-model.ts` | Owner decision: keep stricter staged release/CAS vs legacy direct fixed→verified; if changed, update transition-specific errors and all clients.
- G2-2-001-038 | `src/db/schema/db10-audit-findings.draft.ts` + migration | Persist typed old/new for assignee/severity/commits in event columns; present note summaries are not a lossless structured ledger.
- G2-2-001-040 | `src/app/api/tracker/audit-findings/[publicId]/route.ts` | Verify no-store on all error/exception responses and audited impersonation actor label, without relaxing platform scope.
- G2-2-001-048 | `src/db/schema/db10-audit-findings.draft.ts` + migration/importer | Persist per-file result REJECTED/TAMPERED/DELETED and checkedAt; UI currently has no reliable values to render.
- G2-2-001-061 | `src/modules/bug-tracker/independent-finding-importer.ts` | Bounded 10s connect/20s read GitHub request, refuse truncated trees and record failure details; no importer exists today.
- G2-2-001-066 | `src/db/schema/db10-audit-findings.draft.ts` + migration/importer | Add importer/agent/file changed/deleted event kinds with actorKind and source path.
- G2-2-001-067 | `src/db/schema/db10-audit-findings.draft.ts` + migration | Append-only per-file ledger, sync constraints/indexes.
- G2-2-001-068 | `src/db/schema/db10-audit-findings.draft.ts` + migration/importer | Reported severity, roles, environment, source commit, session and related IDs with historical backfill.
- G2-2-001-069 | `src/db/schema/db10-audit-findings.draft.ts` + migration | Event type, from/to, commit payload, actorKind, sourceFile for human/importer events.
- G2-2-001-070 | `src/db/schema/db10-audit-findings.draft.ts` + migration | Last commit, attempted/success timestamps, last error, file diagnostic results with transactionally consistent history.
- G2-2-001-030 | `src/components/tracker/independent-finding-sync-action.tsx` | Synced / Sync didn't run / Sync failed toast variants only after approved guarded sync endpoint.

Intentional divergences requiring owner signoff: G2-2-001-001/-041 no separate password door (platform RBAC is mandatory), G2-2-001-043 direct fixed→verified not permitted without recorded production release, G2-2-001-044 duplicate chains disallowed to preserve canonical target integrity. No migration, sync execution or deployment has been made by this lane.

## Super Admin interview edit form — lane-7 wave-1 packets (2026-10-21)

- G2-14-030-002 | `src/components/admin/super-admin-interview-operations.tsx + scoped edit route` | Expose edit trigger and scoped PUT/PATCH route in admin interview page or related detail.
- G2-14-030-004 | `src/components/placements/college-interview-appointments.tsx` | Rebuild form with all legacy field groups and order; keep vNext reason/version requirements separately.
- G2-14-030-010 | `src/db/schema/placement-college-interviews.ts + learner reschedule requests` | Store/project pending reason, note, windows or link to structured learner requests.
- G2-14-030-011 | `src/components/placements/college-interview-appointments.tsx` | Normalize historical UTC edit time and timezone conversion; avoid fixed +05:30 outside India.
- G2-14-030-012 | `src/db/schema/placement-college-interviews.ts + placements edit service` | Persist interviewType/roundDescription/notes and allow full edit projection.
- G2-14-030-014 | `src/modules/placements/college-interview-action-service.ts` | Compute candidate/interviewer conflicts while form values change, scoped org without cross-tenant leak.
- G2-14-030-015 | `src/components/placements/college-interview-appointments.tsx` | Restore type selection or map to per-round type with explicit lossless conversion.
- G2-14-030-016 | `src/components/placements/college-interview-appointments.tsx` | Add round description with exact min/max, placeholder, counter.
- G2-14-030-022 | `src/components/placements/college-interview-appointments.tsx` | Restore optional Notes distinct from mandatory change reason.
- G2-14-030-025 | `src/modules/placements/college-interview-action-service.ts` | Permit untouched historical interview edit where safe; preserve exact meeting error.
- G2-14-030-030 | `src/components/placements/college-interview-appointments.tsx` | Add dirty snapshot tracking and exact discard confirmation; prevent accidental data loss.
- G2-14-030-033 | `src/modules/admin-ui/super-admin-interview-detail-service.ts + scoped action route` | Implement equivalent super-admin selected-college update, maintaining full payload fields.
- G2-14-030-035 | `src/modules/admin-ui/super-admin-interview-detail-service.ts + scoped action route` | Use selected college/organization scope in SA edit route, fail closed on missing selection.
- G2-14-030-036 | `src/modules/placements/college-interview-action-service.ts` | Preserve authorized global SA and pinned-college mutation scopes, avoid other colleges.
- G2-14-030-037 | `src/modules/placements/college-interview-action-service.ts` | Restore soft warning at edit and evaluate cross-company candidate clashes and 15min buffer.
- G2-14-030-038 | `src/db/schema/placement-college-interviews.ts + learner reschedule requests` | Map requested reschedule through learner request records and expose pending state without dropping reason/windows.
- G2-14-030-039 | `src/modules/placements/college-interview-action-service.ts` | Match buffer and org/company candidate collisions, keep hard server check for overlapping allocations.
- G2-14-030-049 | `src/components/placements/college-interview-appointments.tsx` | Add dirty-state comparison including whitespace and original timezone precision.
- G2-14-030-051 | `src/components/placements/college-interview-appointments.tsx` | Resolve local timezone correctly and persist offset-aware ISO without hardcoded offset.
- G2-14-030-053 | `src/db/schema/placement-college-interviews.ts + migration` | Write migration field map and add or relate missing interview content/previous slot/request history.
- G2-14-030-054 | `src/db/schema/placement-college-interviews.ts + migration` | Represent CONFIRMED and pending reschedule separately or document status remapping.
- G2-14-030-023 | `src/modules/placements/college-interview-action-model.ts` | Add field-level required message verbatim.
- G2-14-030-024 | `src/modules/placements/college-interview-action-model.ts` | Add whitespace/min10 field errors and 500-char bound.
- G2-14-030-026 | `src/components/placements/college-interview-appointments.tsx` | Restore separate required date/time messages and https meeting field error.
- G2-14-030-027 | `src/components/placements/college-interview-appointments.tsx` | Wire server Zod field errors to fields, dismissible alert and accurate fallback.
- G2-14-030-028 | `src/components/placements/college-interview-appointments.tsx` | Use exact conditional success messages based on reschedule status/date change.
- G2-14-030-029 | `src/components/placements/college-interview-appointments.tsx` | Add legacy info notification on attempted busy cancel.

Current model distinction: Super Admin interview *round* detail is read-only and college appointment edits are authorized for college placements admins, not globally. Do not wire a Super Admin button directly to the college endpoint or accept unscoped organization IDs. Schema/status and selected-college write access need coordinated owning-lane implementation. 27/27 findings **handed off, not fixed**.

## Faculty teaching assignment controller — lane-7 packet handoff (2026-10-21)

- G2-12-027-001 | `src/app/api/courses/teaching-assignments/[assignmentId]/route.ts` | Implement owner-scoped assignment detail GET or provide verified equivalent link/projection with legacy metadata.
- G2-12-027-002 | `src/modules/courses/teaching-assignment-service.ts` | Map full update semantics to scoped edit surface or explicitly document retained-field restrictions.
- G2-12-027-003 | `src/modules/courses/teaching-assignment-service.ts` | Expose equivalent faculty/class/batch query projections without conflating section-grants and course-grants.
- G2-12-027-009 | `src/modules/courses/teaching-assignment-service.ts` | Build equivalent projection joining delivery/section/cohort/course/period and include missing fields or explicit absence mapping.
- G2-12-027-010 | `src/modules/admin-ui/super-admin-faculty-assignments-service.ts` | Surface orphan references as degraded records with explicit error indicator, not silently drop from results.
- G2-12-027-011 | `src/db/schema/courses.ts + migration ledger` | Document migration projections and historical start/end date conversion; preserve year and batch semantics.
- G2-12-027-017 | `src/modules/courses/validation.ts + historical mapping` | Restore editable academic-year/lifecycle details or explicitly preserve through linked period and migration strategy.
- G2-12-027-019 | `src/modules/courses/validation.ts` | Provide validated full reassignment/edit or formally deprecate partial-edit capabilities.
- G2-12-027-022 | `src/modules/courses/validation.ts` | Retain start/end ordering check if dates are migrated/editable; otherwise document retired date rule.
- G2-12-027-030 | `src/app/api/college/teaching-assignments/bulk/route.ts` | Preserve atomic bulk contract or explicitly label partial success and provide rollback action.
- G2-12-027-031 | `src/modules/courses/teaching-assignment-service.ts` | Define explicit hard-delete vs end/deactivate policy and data retention; avoid calling end an exact delete match.
- G2-12-027-034 | `src/modules/courses/teaching-assignment-service.ts` | Expose controlled changes for necessary legacy fields or document replacement assignment flow.
- G2-12-027-035 | `src/modules/permissions/policy.ts + courses permissions` | Ensure faculty department-admin analog retains manage access or document role-policy removal.
- G2-12-027-038 | `src/modules/courses/teaching-assignment-batch-service.ts` | Check elective/retake deliveries are assignable even without strict term-course mapping; add coverage.
- G2-12-027-042 | `src/modules/admin-ui/super-admin-faculty-assignments-service.ts` | Display degraded data with icon/helper instead of dropping records silently.
- G2-12-027-052 | `src/modules/courses/teaching-assignment-service.ts + academic period migration` | Reconcile date-only legacy records into effective delivery period with timezone-safe conversion.
- G2-12-027-053 | `src/modules/courses/teaching-assignment-batch-service.ts + college bulk route` | Unify batch semantics across SA and college callers or explicitly distinguish atomic vs partial.
- G2-12-027-057 | `src/db/schema/courses.ts + migration ledger` | Provide column-by-column migration mapping with explicit year, role, archived/inactive, and date-only semantics.
- G2-12-027-021 | `src/components/admin/super-admin-faculty-assignment-create.tsx` | Map validation to specific missing field/role errors rather than generic combined notice.
- G2-12-027-023 | `src/components/admin/super-admin-faculty-assignment-create.tsx` | Keep distinct backend error codes and exact legacy fallback wording per action if parity.
- G2-12-027-024 | `src/modules/courses/teaching-assignment-service.ts + API error mapping` | Map not-found code and client-facing message to legacy exact text and HTTP status.
- G2-12-027-027 | `src/components/admin/super-admin-faculty-assignment-create.tsx` | Add exact update/end confirmation and distinguish hard delete from end.
- G2-12-027-025 | `src/components/admin/super-admin-faculty-assignment-create.tsx` | Restore exact single-assignment success string where copy parity applies.
- G2-12-027-026 | `src/components/admin/super-admin-faculty-assignment-create.tsx` | Match legacy count wording or document deliberate clarity improvement.

Boundary decision: Teaching assignments are part of Courses/Academics and schema ownership, not lane-7's unplaced, lib, marketing, dashboard and admin-scope code. Existing college bulk intentionally returns per-delivery partial outcomes; SA bulk uses transactional batch. Owner must decide whether to keep explicit distinction rather than silently rewrite contract. Do not introduce numeric legacy IDs or bypass membership/college permissions. **24/24 handed off; not fixed.**

## College Admin project workspace Tasks — lane-7 packets (2026-10-21)

- G2-7-016-004 | `src/components/projects/project-workspace.tsx` | Restore Task plan hierarchy/metrics before task edit
- G2-7-016-005 | `src/components/projects/project-workspace.tsx + scoped project tasks batch API` | Provide bulk editing and one scoped Save with concurrency
- G2-7-016-011 | `src/modules/projects/workspace-view-service.ts` | Project latest evidence per task into submissions counter
- G2-7-016-014 | `src/components/projects/project-workspace.tsx` | Restore row search, reorder and reversible local deletion
- G2-7-016-020 | `src/components/projects/mentor-task-create.tsx` | Keep legacy dueLabel, helper and field grouping
- G2-7-016-023 | `src/components/projects/mentor-task-create.tsx + project workspace route` | Guard Back, tabs and unload for in-page plan
- G2-7-016-034 | `src/modules/projects/mentor-task-create-service.ts + batch API` | Provide atomic batch workflow or partial-write reconciliation
- G2-7-016-035 | `src/modules/projects/mentor-task-create-service.ts + migration mapping` | Map old sprint/task keys to stable UUIDs losslessly
- G2-7-016-036 | `src/modules/projects/mentor-task-create-service.ts` | Define equivalent concurrency on task bulk mutations
- G2-7-016-038 | `src/modules/projects/mentor-task-create-service.ts + project-admin permission` | Give College Admin authorized planning endpoint or remove dead-end create control
- G2-7-016-042 | `src/db/schema/projects.ts + migration` | Carry key mapping and linked meetings through migration
- G2-7-016-056 | `src/components/projects/mentor-task-create.tsx` | Guard page navigation for dirty plan edits
- G2-7-016-064 | `src/modules/projects/mentor-task-create-service.ts` | Test concurrent add/edit/remove and stale sprint reference
- G2-7-016-067 | `src/db/schema/projects.ts + projection/migration` | Define lossless task DTO projection and migration for historical fields
- G2-7-016-068 | `src/modules/projects/mentor-task-create-model.ts` | Inventory field defaults and validation mapping
- G2-7-016-069 | `src/db/schema/projects.ts + CAS protocol` | Preserve array order, key uniqueness and section CAS
- G2-7-016-071 | `src/components/projects/project-workspace.tsx` | Restore consolidated submitted work table
- G2-7-016-024 | `src/modules/projects/mentor-task-create-model.ts` | Restore row-indexed errors and 500-row batch validation
- G2-7-016-025 | `src/components/projects/mentor-task-create.tsx` | Map section error wording and conflict recovery
- G2-7-016-026 | `src/components/projects/project-workspace.tsx` | Display unopenable submission placeholder
- G2-7-016-027 | `src/components/projects/admin-project-section-page.tsx` | Add recoverable section error and 404
- G2-7-016-028 | `src/components/projects/mentor-task-create.tsx` | Restore feedback for equivalent plan save
- G2-7-016-029 | `src/components/projects/project-workspace.tsx` | Bring back reversible edit notice

Project tasks are already implemented inside the shared Projects workspace, normalized service and schema. A new College Admin bulk-plan API, legacy taskToken/migration and permission changes cannot be safely added outside the Projects owner in lane-7. No false equivalence between single-row mentor task edit and legacy atomic task-plan save. **23/23 handed off, not fixed.**

## Tenant readiness gate — lane-7 wave-1 handoff (2026-10-21)

- G2-19-029-016 | `src/modules/colleges/readiness-model.ts` | Define explicit mapping between domain-login verdict and broad tenant-data verdict; do not equate legacy warnings with UNKNOWN data
- G2-19-029-017 | `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` | Preserve exact old headline only for verified legacy domain-login indicator; retain vNext caution for actual live tests to avoid false assurance
- G2-19-029-018 | `src/modules/colleges/readiness-model.ts + readiness page` | Render nonblocking advisory warnings independently; unknown required evidence must still prevent full readiness, not be mixed into advisory list
- G2-19-029-019 | `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` | Never say `login will not work` when only an academic/placement record is missing; label `Login blocked` only on domain gate
- G2-19-029-020 | `src/modules/colleges/readiness-service.ts` | Preserve all distinct domain diagnostics (none, no primary, multiple primary, verification policy) in a detailed domain-check adapter
- G2-19-029-022 | `src/modules/colleges/readiness-model.ts` | Keep academic setup warnings separate from domain login verdict; owner must decide stricter full-handover gate semantics
- G2-19-029-024 | `src/modules/colleges/readiness-service.ts + domain verification policy` | Respect deployed domain-verification policy and own-subdomain trust; clarify when a verified primary is required vs advisory
- G2-19-029-029 | `src/modules/colleges/readiness-model.ts` | Add runtime schema validation at external/adapter boundary for array/codes; fail closed rather than render READY from malformed data
- G2-19-029-035 | `src/modules/colleges/readiness-service.ts + typed readiness DTO` | Provide dual domain-login/advisory and full setup readiness DTOs or explicit contract mapping, never claim semantic equivalence for unlike outputs
- G2-19-029-036 | `src/modules/colleges/readiness-service.ts` | Add typed domain-specific counts and requireVerifiedDomains flag to compact checklist; enforce consistency with login resolution policy
- G2-19-029-037 | `src/modules/colleges/readiness-service.ts` | Query active host count, primary count and verified count, distinguish multiple-primary and missing host states before deciding domain readiness
- G2-19-029-039 | `src/modules/colleges/readiness-service.ts` | Surface short legacy academic-warning rule in domain readiness and preserve rich counts on separate operational checklist
- G2-19-029-042 | `src/modules/colleges/readiness-model.ts` | Separate `domainLoginReady` and `tenantSetupComplete`; prevent label `login blocked` for failed TPO/program requirements
- G2-19-029-043 | `src/modules/colleges/readiness-model.ts + verification policy` | Encode strict-domain-policy input and optional branding explicitly; add fixture matrices strict vs lenient
- G2-19-029-044 | `src/modules/colleges/readiness-model.ts` | Keep legitimate advisory warnings separate from unknown required evidence, while ensuring unknown NEVER produces a ready verdict
- G2-19-029-061 | `src/modules/colleges/readiness-service.ts` | Pass actual deployment verification policy into readiness evaluation; avoid hard-coded assumption about verification requirement
- G2-19-029-062 | `src/modules/colleges/readiness-model.ts + compatibility DTO` | Publish explicit legacy→vNext domain DTO crosswalk, including requirement policy and coded warnings; keep both views separately typed
- G2-19-029-063 | `src/modules/colleges/readiness-service.ts + migration mapping` | Document integer→UUID migration contract and domain/branding field crosswalk; preserve no migration assumptions for currently empty vNext
- G2-19-029-065 | `src/modules/colleges/readiness-remediation-links.ts + readiness page` | Restore advisory partition and `Fix in Branding`; keep new academic data completeness as separate criterion

The existing ten-check operational tenant-readiness gate is not a verified domain-login diagnostic. Do not relabel failed academic data as broken login or treat unknown mandatory evidence as advisory. College readiness model/service and domain policy belong to the Colleges/tenant owner; **19/19 handed off, not fixed**.

## College recurring schedule — lane-7 wave-1 handoff (2026-10-21)

- G2-2-011-009 | `src/modules/academics/college-recurring-preview-model.ts` | Align recurrence cap semantics; 93 calendar-day max can reject valid ≤200-occurrence semester series.
- G2-2-011-015 | `src/modules/academics/college-recurring-preview-model.ts` | Enforce 200 occurrences and academic term instead of arbitrary 93 days if owner demands legacy parity.
- G2-2-011-026 | `src/modules/academics/college-recurring-execute-service.ts` | Make per-date creation independently resilient to DB constraint failure; one failed row must not roll back successful dates.
- G2-2-011-027 | `src/modules/academics/college-recurring-execute-service.ts` | Audit equivalent max-duration and multi-course schedule clash rules beyond simple overlap.
- G2-2-011-029 | `src/modules/academics/college-recurring-execute-service.ts` | Use savepoints or chunked per-occurrence transaction to retain partial success.
- G2-2-011-030 | `src/modules/academics/college-recurring-execute-service.ts` | Support selected-college Super Admin route under central requirePermission for recurring create.
- G2-2-011-035 | `src/modules/academics/college-recurring-execute-service.ts` | Guarantee per-date independent persistence or document stronger all-or-none behavior.
- G2-2-011-052 | `src/components/academics/college-recurring-preview.tsx` | Record workflow restrictions as major parity gap; restore valid semester recurrence.
- G2-2-011-053 | `src/modules/academics/college-recurring-execute-service.ts` | Add per-date fault isolation while preserving conflict preview.
- G2-2-011-020 | `src/modules/academics/college-recurring-preview-model.ts` | Match occurrence-cap error and count actual matching days.
- G2-2-011-021 | `src/modules/academics/college-recurring-preview-service.ts` | Surface exact no-match error before preview/commit.
- G2-2-011-016 | `src/components/academics/college-recurring-preview.tsx` | Map field-specific legacy errors into inline helper copy.
- G2-2-011-017 | `src/modules/academics/college-recurring-preview-model.ts` | Restore exact date format help/error.
- G2-2-011-018 | `src/modules/academics/college-recurring-preview-model.ts + form` | Use one exact legacy message across UI and API.
- G2-2-011-019 | `src/modules/academics/college-recurring-preview-model.ts` | Normalize legacy string weekdays and provide specific invalid day error.
- G2-2-011-022 | `src/components/academics/college-recurring-preview.tsx` | Display both requested and created counts.
- G2-2-011-023 | `src/components/academics/college-recurring-preview.tsx` | Use human-readable per-date conflict reasons and separate unexpected failures.

The Academics preview/execute workflow is an intentional vNext design with a 93-day limit, specific college-scoped authorization and transactional persistence. Per-date partial saves, 200-session recurrence and SA selected-college mutation require coordinated Academics owner decision. **17/17 handed off, not fixed**.

## Project workspace resource audit — wave-1 handoff (2026-10-21)

- G2-7-007-002 | `src/components/projects/project-workspace.tsx` | Generate `/college/projects/audit?subjectId=<uuid>&range=all` (or supported params) for College Admin; test route and role.
- G2-7-007-005 | `src/components/projects/project-activity-filtered-list.tsx` | Recreate Resource activity Card with counters and 4-column data table.
- G2-7-007-014 | `src/components/projects/project-activity-filtered-list.tsx` | Restore exact four-column semantic audit table.
- G2-7-007-015 | `src/components/projects/project-activity-filtered-list.tsx` | Page resource history at 10, and show exact result range and total.
- G2-7-007-021 | `src/components/projects/admin-project-section-page.tsx` | Fetch workspace summary and resource audit independently; show partial warning with usable audit history.
- G2-7-007-022 | `src/components/projects/project-activity-filtered-list.tsx` | Add isolated audit initial-fetch error and exact retry action.
- G2-7-007-026 | `src/modules/projects/workspace-view-service.ts` | Split dedicated resource-audit read from workspace summary; avoid failing audit on unrelated services.
- G2-7-007-027 | `src/modules/projects/activity-service.ts` | Define dedicated resource-audit projection/endpoint retaining original resource fields/actions; keep typed event taxonomy migration.
- G2-7-007-032 | `src/modules/projects/project-resource-audit-model.ts` | Default resource-audit view to resource events only; prevent generic activity leakage.
- G2-7-007-034 | `src/modules/projects/activity-service.ts` | Expose before/after diff and changed fields through authorized resource audit projection.
- G2-7-007-038 | `src/modules/projects/workspace-view-service.ts` | Separate partial errors from audit read and unrelated workspace services.
- G2-7-007-049 | `src/modules/projects/activity-service.ts` | Push resource filter/search into paged DB query before limiting; include total.
- G2-7-007-051 | `src/components/projects/project-workspace.tsx` | Use supported audit query parser keys and correct panel-specific root.
- G2-7-007-053 | `src/db/schema/project-audit-staged.ts + SQL migration` | Promote audited migration and writer/reader or provide equivalent immutable event metadata with legacy fields and indexes.
- G2-7-007-054 | `src/modules/projects/activity-service.ts` | Build typed audit adapter with actionType, resourceKey, actor role, changedFields, before/after, timestamp.
- G2-7-007-057 | `src/modules/projects/workspace-view-service.ts` | Prioritize resilient isolated resource-history read with independent Retry.
- G2-7-007-024 | `src/components/projects/project-activity-filtered-list.tsx` | Match error alert with Retry; keep nonmutation toast-free.

Existing resource history is filtered over generic activity events and has no complete typed resource-diff ledger. Projects/schema owns its route, UI, projection and migration. Do not claim a resource audit is a lossless legacy audit until the DB-backed projection exists. **17/17 handed off, not fixed**.

## Faculty OTP verification — wave-1 handoff (2026-10-21)

- G2-18-019-002 | `src/modules/auth/login-service.ts` | Validate faculty membership/tenant before session and correct faculty redirect; never allow membership confusion
- G2-18-019-006 | `src/db/schema/identity-auth-attempts.ts + migration contract` | Document faculty_id → user/membership UUID identity crosswalk; do not load old faculty IDs as UUIDs
- G2-18-019-007 | `src/modules/auth/login-repository.ts` | Preserve phone normalization and account resolution; do not duplicate raw phone in auth-attempt rows
- G2-18-019-008 | `src/db/schema/identity-auth-attempts.ts` | Treat keyed MAC as required security improvement; explicitly mark raw OTP intentionally dropped, never restore plaintext storage
- G2-18-019-009 | `src/modules/auth/login-repository.ts` | Retain shared max-five attempt budget for all channels; record legacy field semantics and no migration needed for spent OTPs
- G2-18-019-010 | `src/modules/auth/login-service.ts + src/components/auth/login-form.tsx` | Do not clone arbitrary string lockout; provide exact temporary block/retry time in Faculty UI backed by durable send/verify budget
- G2-18-019-011 | `src/modules/auth/login-repository.ts` | Define verifiedAt/usedAt audit relationship; old boolean must not authorize new session
- G2-18-019-012 | `src/modules/auth/login-service.ts` | Enforce clock-based five-minute expiry, never accept stale row simply because integer expired flag was not toggled
- G2-18-019-014 | `src/modules/auth/login-repository.ts` | Migrate caller to attemptId; clear old challenge on new start and ensure stale OTP cannot authenticate
- G2-18-019-017 | `src/modules/auth/login-service.ts` | Keep POST body and attemptId contract; don't add insecure GET verification endpoint
- G2-18-019-025 | `src/modules/auth/login-service.ts` | Check delivery failure cannot leave a usable challenge or imply success; document record retention and phone costs
- G2-18-019-031 | `src/modules/auth/config.ts` | Do not port any special-phone/global code; preserve isolated dev-only QA identities, disallow prod test OTP
- G2-18-019-036 | `src/modules/auth/login-service.ts` | Verify SMS provider template/recipient, delivery retries and fallback recipients align required login reliability
- G2-18-019-044 | `src/modules/auth/login-service.ts + Exotel provider integration` | Verify Exotel/actual provider credentials/templates and observed failure paths without leaking OTPs; audit provider integration separately
- G2-18-019-046 | `src/db/schema/identity-auth-attempts.ts` | Document legacy row-to-user mapping; deliberate separate-table retirement means no 1:1 PK migration required for expired OTP rows
- G2-18-019-047 | `src/db/schema/identity-auth-attempts.ts` | Maintain field-by-field disposition in schema ledger, protect raw OTP and phone, never expose hashed MAC via API

Security non-regression requirements: do not reintroduce raw OTP, phone numbers in challenge rows, GET-query verification, static production bypass codes, or replay. The vNext user+membership UUID challenge with MAC, attempt caps and consumption remains the canonical contract. Auth and DB owners must verify provider, membership, error and retention details. **16/16 handed off, not fixed**.

## Important job dates calendar DTO — lane-7 handoff (2026-10-21)

- G2-18-021-003 | `src/modules/placements/placement-calendar-service.ts` | Include all configured important date events with type and label, not just deadline+scheduled rounds
- G2-18-021-004 | `src/modules/placements/placement-calendar-service.ts` | Project informational dates even when no corresponding round exists, de-dupe when scheduled event matches
- G2-18-021-006 | `src/modules/placements/placement-calendar-model.ts` | Add optional raw importantDateType and label to model; color/classify by type first
- G2-18-021-007 | `src/modules/placements/placement-calendar-model.ts` | Crosswalk all seven fields; preserve label/type separately from generated display title
- G2-18-021-009 | `src/db/schema/placements.ts` | Store type/dateType in legacyPostingDetails metadata or normalized date rows
- G2-18-021-011 | `src/modules/placements/placement-calendar-service.ts` | Support stable per-item IDs including index/typed key so multiple dates do not collapse
- G2-18-021-012 | `src/components/placements/placement-job-create-form.tsx` | Add type input/preservation to authoring + roundtrip; do not invent type from text
- G2-18-021-017 | `src/modules/placements/placement-calendar-service.ts` | Distinguish no dates from unsupported source; add explicit metadata projection rather than empty-success
- G2-18-021-021 | `src/modules/placements/learner-career-calendar-model.ts` | Merge targeted-visible un-applied job dates AND past applied-job dates in learner calendar
- G2-18-021-025 | `src/modules/placements/learner-career-calendar-model.ts` | Verify public-targeted jobs with future dates included despite no application; preserve applied after deadline
- G2-18-021-027 | `src/modules/placements/placement-calendar-model.ts` | Preserve and prioritize raw type over label heuristics at all consumers
- G2-18-021-038 | `src/modules/placements/learner-career-calendar-model.ts` | Union visible and applied job rows once and project each important date only once
- G2-18-021-039 | `src/modules/placements/learner-career-calendar-model.ts` | Define UTC storage→IST day mapping; test +05:30 boundary and naive date strings
- G2-18-021-044 | `src/db/schema/placements.ts` | Schema add optional `type`, `dateType` and preserve during write and read; include existing legacy payloads
- G2-18-021-046 | `src/modules/placements/placement-calendar-model.ts` | Write explicit typed job-date projection contract + fixture for primary/fallback classification agreement
- G2-18-021-015 | `src/modules/placements/placement-calendar-service.ts` | Map original range errors and inclusive day bounds to vNext query warnings

Placement calendar and recruitment job JSON are owned by Placements/schema lanes. Preserve raw `type`/`dateType` in migrations rather than inferring from label. Do not merge targeted-visible and applied events without tenant-scope guard. **16/16 handed off, not fixed**.

## TPO recruiter leads — lane-7 handoff (2026-10-21)

- G2-11-020-010 | `src/components/tpo/recruiter-leads-workspace.tsx + recruiter grant-read service` | Count only active nonexpired access grants from access service; match link /tpo/settings?tab=recruiters.
- G2-11-020-012 | `src/components/tpo/recruiter-leads-workspace.tsx` | Derive exact LEAD/INVITED/JOINED statuses and status label/badge.
- G2-11-020-025 | `src/components/tpo/recruiter-leads-workspace.tsx` | Match exact status buckets, keep unsubscribed as separate opt-in extra filter.
- G2-11-020-028 | `src/components/tpo/recruiter-leads-workspace.tsx` | Restore the four allowed drop outcomes and locked hints, with confirmation.
- G2-11-020-037 | `src/components/tpo/recruiter-leads-workspace.tsx` | Support optional time selection; preserve selected wall time and timezone.
- G2-11-020-046 | `src/components/tpo/recruiter-leads-workspace.tsx + invite API` | Provide email invite/resend flow and consent-safe fallback, retain one-time link optional.
- G2-11-020-050 | `src/modules/placements/recruiter-lead-service.ts` | Scope owner editor choices to authorized staff from team membership, not lead-only values.
- G2-11-020-052 | `src/components/tpo/recruiter-leads-workspace.tsx` | Preserve stage policy plus all legacy permitted manual actions, lock others.
- G2-11-020-054 | `src/modules/placements/recruiter-invite-service.ts` | Add mail-template availability check and approved send action, maintain opt-out.
- G2-11-020-059 | `src/components/tpo/recruiter-leads-workspace.tsx + messaging templates` | Cross-check campaign and invitation delivery templates/recipients; restore send paths when mail on.
- G2-11-020-064 | `src/components/tpo/recruiter-leads-workspace.tsx` | Protect unsaved draft on browser tab close and route navigation.
- G2-11-020-038 | `src/components/tpo/recruiter-leads-workspace.tsx` | Provide field-level exact error next to contact fields.
- G2-11-020-039 | `src/components/tpo/recruiter-leads-workspace.tsx` | Match punctuation and explain intentional min2 if kept.
- G2-11-020-040 | `src/components/tpo/recruiter-leads-workspace.tsx` | Restore dialog copy and Open existing record action.
- G2-11-020-041 | `src/components/tpo/recruiter-leads-workspace.tsx` | Distinguish with-followup success wording.
- G2-11-020-043 | `src/components/tpo/recruiter-leads-workspace.tsx` | Match literal feedback or document persistent replacement.

TPO recruiter lead UI and messaging/notification flows are shared TPO ownership. Resuming invite emails without verified template, opt-out and rate-limit rules is unsafe. Retain vNext consent and grant scopes pending implementation. **16/16 handed off, not fixed**.

## Learner placement schedule — lane-7 handoff (2026-10-21)

- G2-13-023-007 | `src/modules/placements/request-service.ts` | Create field-level schedule DTO parity: jobId, slot starts/ends/room, whatToBring, confirmedAt, nullable placeholders.
- G2-13-023-008 | `src/app/(authenticated)/learn/my-placements/schedule/page.tsx` | Use booked candidate-slot venue before round default and normalize literal null/empty.
- G2-13-023-009 | `src/modules/placements/request-service.ts` | Select actual booked candidate slot start/end and show it as first precedence.
- G2-13-023-010 | `src/modules/placements/request-service.ts` | Restrict confirmed booking list to active applications and published rounds; put planned rounds in distinct section.
- G2-13-023-013 | `src/components/placements/learner-schedule-reschedule.tsx` | Retain free-form preferredTimes or document stricter proposal shape and migrate existing requests.
- G2-13-023-014 | `src/modules/placements/validation.ts + learner-schedule-reschedule UI` | Align UI/server reason cap (900 vs 2000); decide whether preferredTimes text remains supported.
- G2-13-023-026 | `src/modules/placements/request-service.ts` | Map legacy reschedule_request fields/status to new request schema, retain pending-approval side effect.
- G2-13-023-027 | `src/modules/placements/learner-round-confirmation-service.ts` | Document eligibility change: past bookings and unscheduled rounds no longer confirmable.
- G2-13-023-031 | `src/modules/placements/request-service.ts` | Require specific booked slot where legacy does, align duplicate messaging with separate same/different payload semantics.
- G2-13-023-032 | `src/modules/placements/request-service.ts` | Add legacy completed/withdrawn/cancelled drive visibility exclusion mapping to new status model.
- G2-13-023-049 | `src/modules/placements/request-service.ts + migration` | Write migration field/status map for legacy requests and booking confirmations.
- G2-13-023-050 | `src/modules/placements/learner-round-confirmation-service.ts + migration` | Migrate old booking slot identity, confirmation timestamp, room/time and version to candidate-slot records.
- G2-13-023-017 | `src/modules/placements/request-service.ts` | Restore descriptive permission error at UX boundary.
- G2-13-023-018 | `src/modules/placements/request-service.ts` | Map distinct no-booking and duplicate-pending errors to exact actionable legacy copy.
- G2-13-023-019 | `src/modules/placements/learner-round-confirmation-service.ts` | Return privacy-safe not-found/expired-booking error with clear retry guidance.
- G2-13-023-022 | `src/components/placements/learner-round-confirm-attendance.tsx` | Check legacy toast and confirmation label live, map response success.

Learner Placement schedule and booking storage/permission checks belong to Placements. A booked slot should not be quietly conflated with a planned round, nor a past booking with a future confirmation. Preserve stronger vNext scoped confirmation and pending-approval rules pending owner crosswalk. **16/16 handed off, not fixed**.

## Project template DTO and lifecycle — lane-7 handoff (2026-10-21)

- G2-8-017-010 | `src/modules/projects/template-service.ts + DTO adapter` | Write field-by-field DTO adapter for courseLabel, phase, creation scope, lifecycle and published timestamp, or explicitly deprecate each.
- G2-8-017-011 | `src/modules/projects/validation.ts + blueprint mapping` | Map delivery, meetings and activity into versioned blueprint or document intentional non-migration with a verified replacement.
- G2-8-017-022 | `src/modules/projects/validation.ts` | Add editable metadata equivalents or deprecation decisions with UI controls and migration mapping.
- G2-8-017-023 | `src/modules/projects/validation.ts` | Support legacy section-only writes without title and equivalent CAS; keep newer optimistic guard.
- G2-8-017-037 | `src/modules/projects/template-service.ts` | Check archive with active college assignments; surface guard and workflow to revoke before archive.
- G2-8-017-044 | `src/db/schema/projects.ts + template lifecycle migration` | Define explicit state/status migration table; avoid silently losing workflow status.
- G2-8-017-050 | `src/app/(authenticated)/admin/projects/templates/page.tsx` | Export ALL filtered records server-side, or explicitly label current-page export; match column order and filename.
- G2-8-017-067 | `src/db/schema/projects.ts + identifier mapping` | Provide stable ID mapping/redirect support for legacy numeric bookmarks and relationships.
- G2-8-017-071 | `src/modules/projects/template-service.ts` | Backfill/read courseLabel from blueprint overview; preserve editing and search semantics.
- G2-8-017-072 | `src/db/schema/projects.ts` | Introduce separate workflowStatus if legacy status is used independently of lifecycleStatus.
- G2-8-017-074 | `src/db/schema/projects.ts` | Preserve separate lifecycle and workflow statuses in migration.
- G2-8-017-080 | `src/modules/projects/validation.ts + migration` | Define JSON transforms including delivery, meetings, activity before data migration.
- G2-8-017-083 | `src/db/schema/projects.ts + migration` | Retain action type and whole-template snapshots for forensic rollback fidelity.
- G2-8-017-026 | `src/modules/projects/validation.ts` | Map null payload and Zod field issues to exact legacy client-readable messages and HTTP statuses.
- G2-8-017-027 | `src/app/(authenticated)/admin/projects/templates/page.tsx` | Preserve legacy API error reason in retriable alert while keeping new friendly title.
- G2-8-017-029 | `src/app/(authenticated)/admin/projects/templates/page.tsx` | Match error copy and surface underlying cause without leaking unsafe details.

Project templates already retain some legacy course label, phase and status provenance in current schema, but normalized blueprint/version semantics are not a proven migration of all seven legacy sections. Projects/schema owner must decide fields, CAS and full filtered export. **16/16 handed off, not fixed**.

## Recruiter college overview/controller — lane-7 wave-1 handoff (2026-10-21)

- G2-15-025-002 | `src/app/(authenticated)/hr/home/page.tsx + scoped college overview` | Restore privacy-banded college overview as a separate authorized read view.
- G2-15-025-008 | `src/modules/placements/recruiter-drive-request-service.ts` | Build recruiter request response projection for every listed field including salary and eligibility details.
- G2-15-025-009 | `src/modules/placements/recruiter-company-overview-model.ts` | Separate college demographics aggregate from drive summary and preserve asOf timestamp.
- G2-15-025-013 | `src/modules/placements/recruiter-drive-request-model.ts` | Provide explicit field-by-field DTO map and unambiguous defaults for imported legacy drafts.
- G2-15-025-024 | `src/modules/placements/recruiter-company-overview-model.ts` | Add scoped non-identifying demographic query returning legacy fields.
- G2-15-025-025 | `src/modules/placements/recruiter-drive-request-service.ts` | Plan migration from Job lifecycle REQUEST/SENT_BACK into new request row preserving ID backlinks.
- G2-15-025-026 | `src/modules/placements/recruiter-drive-request-service.ts` | Map legacy job id to new request id and approvedJobId without loss of edit history.
- G2-15-025-050 | `src/modules/placements/recruiter-company-overview-model.ts` | Implement exact nearest5 rounding including ties and small-group withholding.
- G2-15-025-051 | `src/modules/placements/recruiter-drive-request-service.ts` | Cross-check no-auto-publish behavior and approval policy; preserve TPO ownership.
- G2-15-025-052 | `src/modules/placements/recruiter-company-overview-model.ts` | Restore read-only aggregation and query-time privacy gate separate from drive pipeline.
- G2-15-025-053 | `src/db/schema/placement-drive-requests.ts` | Migrate old requests to typed request rows with lifecycle and legacy Job ID mapping.
- G2-15-025-017 | `src/modules/placements/recruiter-drive-request-service.ts` | Show specific missing employer identity message separate from revoked grant.
- G2-15-025-019 | `src/app/api/placements/recruiter/drives/requests/route.ts` | Map exact legacy human-readable validation errors for UI while preserving structured codes.
- G2-15-025-021 | `src/modules/placements/recruiter-drive-request-model.ts` | Implement exact five status labels for request + published job composite, avoid status collisions.
- G2-15-025-020 | `src/app/api/placements/recruiter/drives/requests/route.ts` | Ensure recruiter UI success wording distinguishes create/resubmit/replayed POST.

Existing recruiter grants are scoped to a company/college and do not authorize arbitrary identifiable learner data. Legacy college aggregate requires dedicated privacy-banded query, suppression, and TPO-reviewed field mapping. **15/15 handed off, not fixed**.

## Public company-share page — lane-7 owned page edit and backend handoff (2026-10-21)

- G2-1-029-011 | `src/modules/placements/company-share/public-service.ts + audited ZIP export route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-1-029-028 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-1-029-038 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-1-029-067 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-20-031-011 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-20-031-024 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-20-031-027 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-20-031-036 | `src/modules/placements/company-share/public-service.ts + audited ZIP export route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-20-025-003 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-1-029-033 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-1-029-034 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-1-029-035 | `src/modules/placements/company-share/access-service.ts + new anti-pumping send-code route` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-20-025-007 | `src/modules/placements/company-share/public-service.ts` | Server action is absent; do not enable public email code/ZIP controls until token+recipient authorization, throttling, least-privilege file signing and durable access/audit are implemented.
- G2-1-029-029 | `src/app/company-share/[token]/page.tsx` | Page now keeps the exact accessible invalid-code text and presents CSV directly; true legacy toast is intentionally not fabricated on a server-only page.
- G2-20-031-022 | `src/app/company-share/[token]/page.tsx` | Page now keeps the exact accessible invalid-code text and presents CSV directly; true legacy toast is intentionally not fabricated on a server-only page.

Page ownership change: surfaced code resend unavailability and included direct CSV action with explicit unavailable ZIP note. Existing protected code gate, 10/hour lockout and CSV audit stay intact. Actual resend and ZIP remain **unfixed** and must be implemented by Placements/company-share owner, with strict authorization. Do not create email send or download links to nonexistent routes. No tests/CI.

## New program controller — lane-7 handoff (2026-10-21)

- G2-18-026-001 | `src/app/api/academics/programs/route.ts` | Inventory legacy consumers and map fetchAll/fetchByDept/fetchByCollege/fetch/{id}/details/paged explicitly; update callers or add scoped compatibility routes; never preserve insecure unscoped access
- G2-18-026-007 | `src/modules/academics/program-service.ts` | Define complete conversion contract (terms=years*2) for reads/writes; prevent fractional legacy years in compatibility projections
- G2-18-026-012 | `src/modules/academics/college-program-mutation-model.ts` | Explicitly adapt snake_case and derive code/terms at legacy-client boundary; do not silently accept missing required code
- G2-18-026-013 | `src/app/api/academics/programs/[programId]/route.ts` | Document PUT→PATCH payload migration and make old edit callers write required vNext fields atomically
- G2-18-026-018 | `src/modules/academics/college-program-mutation-service.ts` | Return structured blocking batch/semester(s), then render readable legacy-style actionable details before save
- G2-18-026-023 | `src/modules/academics/college-program-mutation-service.ts` | Crosswalk action/event taxonomy, entity and actor fields; confirm same admin audit screen can discover new records
- G2-18-026-024 | `src/modules/academics/college-program-mutation-service.ts` | Ensure old audit consumer maps archived vs deleted and retains college/actor/payload and outcome semantics
- G2-18-026-026 | `src/modules/academics/college-program-mutation-service.ts` | Verify role and organization checks for every mutation and preserve explicit unauthorized feedback for selected wrong college
- G2-18-026-027 | `src/modules/academics/program-service.ts` | Audit every role caller; provide tenant-safe scoped list for learner and unscoped Super Admin without opening cross-tenant read
- G2-18-026-029 | `src/modules/academics/college-program-mutation-service.ts` | Decide archived-name reuse and restoration collisions explicitly; document stronger code constraint
- G2-18-026-030 | `src/modules/academics/college-program-mutation-service.ts` | Verify all legacy relationships (including classes and references) map to vNext dependency checks and show blocker-specific messages
- G2-18-026-031 | `src/modules/academics/college-program-mutation-service.ts` | Include historical semester/course and active enrollments in shrink decision; document behavior for partially built future terms
- G2-18-026-044 | `src/db/schema/academics.ts + legacy ID crosswalk` | Maintain explicit table/ID/field migration crosswalk for reports and old client routes; no assumption that ints are compatible with UUIDs
- G2-18-026-045 | `src/db/schema/academics.ts` | Record deliberate stronger constraints, test conflict codes and archived-record uniqueness/restoration; keep duration terms <=20 for legacy 10-year UI

Acad program identity, duration terms, archived-name reuse and selected-college permissions are Academics/schema ownership. The vNext UUID & audit event model cannot be replaced by the old int client contract without explicit adapters. **14/14 handed off, not fixed**.

## Attendance policy controller — lane-7 handoff (2026-10-21)

- G2-2-010-004 | `src/components/attendance/admin-attendance-policy-editor.tsx` | Restrict College Admin to read-only as legacy or obtain explicit new write-permission decision.
- G2-2-010-012 | `src/components/attendance/admin-attendance-policy-editor.tsx` | Remove College Admin save actions until explicit owner approval for expanded rights.
- G2-2-010-024 | `src/modules/attendance/policy-service.ts` | Support per-setting inherited/global reset and source-of-value provenance.
- G2-2-010-025 | `src/app/api/college/attendance/policy/route.ts` | Separate attendance.policy.read vs update permissions or owner-authorize new mutation.
- G2-2-010-027 | `src/components/attendance/admin-attendance-policy-editor.tsx` | Reinstate role-based read-only state for strict legacy behavior.
- G2-2-010-030 | `src/modules/attendance/policy-service.ts` | Restore inheritance semantics, avoid immutable default override.
- G2-2-010-041 | `src/modules/attendance/policy-service.ts` | Add row version/CAS and independent update capability; prevent lost policy edits.
- G2-2-010-046 | `src/modules/attendance/policy-service.ts` | Persist null/inherited flags per individual setting or separate override rows.
- G2-2-010-048 | `src/modules/attendance/policy-service.ts` | Implement effective precedence and granular reset.
- G2-2-010-016 | `src/app/(authenticated)/college/attendance/page.tsx` | Provide per-policy-field unavailable state with retry while keeping attendance grid usable.
- G2-2-010-015 | `src/app/api/college/attendance/policy/route.ts` | Map invalid requested college to clear user-visible field error.
- G2-2-010-017 | `src/components/attendance/admin-attendance-policy-editor.tsx` | Restore field-specific failure copy for permitted editors.
- G2-2-010-019 | `src/components/attendance/admin-attendance-policy-editor.tsx` | Match exact field-specific success and avoid claiming both fields changed when only one.
- G2-2-010-020 | `src/components/attendance/admin-attendance-policy-editor.tsx` | Provide independent reset notice and semantics.

Attendance policy read/update/reset semantics, override provenance and permission partition need the Attendance/Academics owner, and resetting defaults must not be represented as deleting one override. College Admin expanded mutation rights require owner approval. **14/14 handed off, not fixed**.

## Super Admin hiring dashboard — lane-7 handoff (2026-10-21)

- G2-15-030-001 | `src/modules/admin-ui/super-admin-hiring-report-service.ts` | Resolve lost org-scoped placement analytics.
- G2-15-030-017 | `src/components/ui/data-table.tsx` | Add bounded pagination, avoid 5000-row DOM.
- G2-15-030-034 | `src/modules/admin-ui/super-admin-hiring-report-export.ts` | Restore four report sections in export.
- G2-15-030-038 | `src/modules/admin-ui/super-admin-hiring-report-service.ts` | Owner decision on org-wide reports.
- G2-15-030-041 | `src/modules/admin-ui/super-admin-hiring-funnel-model.ts` | Document stage semantic change and reconcile historical results.
- G2-15-030-063 | `src/components/ui/data-table.tsx` | Add server-side or bounded client pagination.
- G2-15-030-073 | `src/app/(authenticated)/admin/placements/analytics/page.tsx` | Owner decide org-scoped reporting scope.
- G2-15-030-074 | `src/modules/admin-ui/super-admin-hiring-report-export.ts` | Restore combined report or explicitly approve replacement.
- G2-15-030-024 | `src/app/(authenticated)/admin/placements/analytics/page.tsx` | Show healthy panels despite partial failure.
- G2-15-030-025 | `src/modules/admin-ui/super-admin-hiring-report-filters-service.ts` | Differentiate failed dropdown from no data.
- G2-15-030-026 | `src/app/(authenticated)/admin/placements/analytics/page.tsx` | Restore same-scope stale-data warning and retry.
- G2-15-030-028 | `src/app/(authenticated)/admin/placements/analytics/page.tsx` | Disable or explain export unavailable/partial.
- G2-15-030-027 | `src/app/(authenticated)/admin/placements/analytics/page.tsx` | Match actionable error copy.
- G2-15-030-029 | `src/app/(authenticated)/admin/placements/analytics/page.tsx` | Present refresh/pending status.

Org-wide hiring analytics, multi-section export and paged table have scoped data permission/export contract implications; coordinate Admin UI/Placements owner rather than changing shared table globally. **14/14 handed off, not fixed**.

## Admin assignment controller — lane-7 handoff (2026-10-21)

- G2-2-007-009 | `src/modules/courses/admin-assignment-directory-service.ts` | Isolate per-assignment stats failures so one bad row does not blank directory.
- G2-2-007-013 | `src/components/courses/college-assignment-create.tsx` | Add specific section picker constrained to selected course.
- G2-2-007-017 | `src/modules/courses/college-assignment-directory-model.ts` | Add class/sectionId exact filtering across assignments and stats.
- G2-2-007-032 | `src/modules/courses/admin-assignment-directory-service.ts` | Make counts best-effort per row or distinguish total query failure from row failure.
- G2-2-007-038 | `src/modules/courses/admin-assignment-directory-service.ts` | Render Unavailable for broken per-row statistics instead of claiming zero.
- G2-2-007-056 | `src/modules/courses/admin-assignment-directory-service.ts` | Provide partial stats fallback or explicit degraded mode with rows intact.
- G2-2-007-063 | `src/modules/courses/college-assignment-directory-model.ts` | Implement exact class filter rather than treating presence as identity.
- G2-2-007-022 | `src/modules/courses/admin-assignment-directory-service.ts` | Map college-vs-org denial safely and do not disclose other college data.
- G2-2-007-023 | `src/app/(authenticated)/admin/assignments/page.tsx` | Keep full error details in logs and scoped retry UI; preserve consistent generic message.
- G2-2-007-025 | `src/app/api/courses/assignments/publish/route.ts` | Align failures report and per-college cross-section semantics.
- G2-2-007-021 | `src/app/(authenticated)/admin/assignments/page.tsx` | Keep accessible missing-scope state; document changed error body.
- G2-2-007-024 | `src/app/(authenticated)/admin/assignments/page.tsx` | N/A toast for list retrieval; API contract changed.
- G2-2-007-026 | `src/components/courses/college-assignment-list.tsx` | Restore exact toast copy.

The Courses assignments directory's section targeting and stats are shared Courses/UI contracts; row-specific failure and exact classroom targeting must remain tenant scoped. Legacy hard-delete / publish-all messages cannot bypass current grant and audit protections. **13/13 handed off, not fixed**.

## Admin assignment grade publish — lane-7 handoff (2026-10-21)

- G2-2-008-001 | `src/app/api/courses/assignments/publish/route.ts` | Add guarded server bulk publish endpoint or document batch client semantics.
- G2-2-008-003 | `src/modules/courses/grade-publish-service.ts` | Keep server-side snapshot/retryable batch and audited summary semantics.
- G2-2-008-014 | `src/modules/courses/grade-publish-service.ts` | Authorize selected assignment + section before listing/fetching any learner IDs.
- G2-2-008-021 | `src/modules/courses/grade-publish-service.ts` | Record one batch-level audit event with counts & actor after publish processing.
- G2-2-008-023 | `src/modules/courses/grade-publish-service.ts` | Add first-class whole-assignment bulk permission guard.
- G2-2-008-037 | `src/modules/courses/grade-publish-service.ts` | Bound calls by max records/work budget, provide progress + resumable cursor.
- G2-2-008-042 | `src/modules/courses/grade-publish-service.ts` | Add audit batch summary integration with original count keys.
- G2-2-008-045 | `src/app/api/courses/assignments/publish/route.ts` | Preserve whole-assignment scope or explicitly approve Section-by-Section segmentation.
- G2-2-008-013 | `src/app/api/courses/assignments/publish/route.ts` | Confirm unauthenticated response and preserve 401 semantics.
- G2-2-008-016 | `src/components/courses/faculty-assignment-grade-publish.tsx` | Display skipped/not graded/already published counts.
- G2-2-008-017 | `src/components/courses/faculty-assignment-grade-publish.tsx` | Provide sanitized failure list with meaningful retry guidance.
- G2-2-008-012 | `src/app/api/courses/assignments/publish/route.ts` | Map invalid path to stable validation error, document identifier migration.
- G2-2-008-015 | `src/components/courses/faculty-assignment-grade-publish.tsx` | Restore result copy and details.

A server-scoped bulk grade publish changes access control, audit, pagination and transaction boundaries; shared Courses owner must implement guarded summary without bypassing grading permissions. **13/13 handed off, not fixed**.

## Course controller — lane-7 handoff (2026-10-21)

- G2-19-027-059 | `src/modules/courses/course-service.ts` | Ensure all detail aliases collapse unauthorized/unknown to same safe error and no slug oracle.
- G2-19-027-062 | `src/modules/courses/course-service.ts` | Check descendant lessons and content independently, including nonactive offerings; avoid stranded child data.
- G2-19-027-064 | `src/modules/courses/course-service.ts` | Match legacy duplicate short title or preserve as uniqueness in migrated data.
- G2-19-027-066 | `src/db/schema/courses.ts` | Differentiate hidden visibility from archived course lifecycle; avoid conflating user hide with archive.
- G2-19-027-074 | `src/modules/courses/course-service.ts` | Map audit event taxonomy and add restore audit with actor/time and change summary.
- G2-19-027-085 | `src/modules/courses/college-course-catalogue-model.ts` | Fix wrong pageSize view/query contract, prevent page count mismatch.
- G2-19-027-087 | `src/modules/courses/course-service.ts` | Add expectedUpdatedAt/version in PATCH and stale-conflict message to prevent overwriting form edits.
- G2-19-027-091 | `src/components/courses/admin-course-display-editor.tsx` | Connect storage receipt flow or document intentional deferral and render fallback.
- G2-19-027-092 | `src/db/schema/courses.ts` | Write complete old-to-new schema migration with typed JSON extraction and legacy identity crosswalk.
- G2-19-027-093 | `src/db/schema/courses.ts` | Resolve duplicate short titles during import and ensure intended constraint parity.
- G2-19-027-095 | `src/modules/courses/course-service.ts` | Migrate version or use millisecond-precision expectedUpdatedAt CAS for course edits.
- G2-19-027-096 | `src/db/schema/courses.ts` | Preserve deleted/restored audit lifecycle with timestamp and reversible status transition.
- G2-19-027-098 | `src/components/courses/admin-course-overview.tsx` | Make bulk visibility reachable to college admins under same role policy and preserve selection/partial failures.

Course catalogue status/visibility, optimistic updates and restoration are Courses/schema ownership. Legacy hidden and archived states cannot be conflated; migration and data-retention decisions required. **13/13 handed off, not fixed**.

## Project workspace readiness — lane-7 handoff (2026-10-21)

- G2-17-028-008 | `src/modules/projects/readiness-service.ts` | Add scoped per-task evidence coverage read (completed tasks with submission URL) to service/DTO and legacy-labeled metric with zero-completion special text
- G2-17-028-011 | `src/modules/projects/readiness-service.ts` | Product decision: keep legacy readiness independent of release shipping or explicitly document change and update visible rule/warning; don't silently reinterpret gate
- G2-17-028-018 | `src/modules/projects/readiness-override-service.ts` | Crosswalk nullable Boolean true/false/null to enum, and preserve clear semantics and active override display
- G2-17-028-024 | `src/modules/projects/readiness-service.ts` | Use one scoped workspace view/readiness shape or BFF with embedded proof tasks; avoid an extra unsynchronized fetch for coverage
- G2-17-028-025 | `src/modules/projects/readiness-override-service.ts` | Keep business intent equivalent through payload/status mapping, reject outside-scope IDs; align parent form behavior
- G2-17-028-026 | `src/modules/projects/readiness-override-service.ts` | Ensure latest state and author/time still visible after migration, including cleared override and old records
- G2-17-028-027 | `src/components/projects/project-readiness-workspace.tsx` | Render distinct `No college selected` shell/banner on missing selected scope; never suppress nav tabs
- G2-17-028-029 | `src/modules/projects/readiness-service.ts` | Align readiness gate formula with legacy: verify task/sprint completion and submission conditions, make release policy decision before parity sign-off
- G2-17-028-040 | `src/modules/projects/readiness-service.ts` | Clarify status normalization for migrated tasks; count submissions that are valid URLs, not whitespace or stale data; test zero tasks
- G2-17-028-044 | `src/modules/projects/readiness-override-service.ts` | Preserve historical override read model or migrate records to append-only activity events (no data migration desired? confirm on live old data)
- G2-17-028-045 | `src/modules/projects/readiness-service.ts` | Publish explicit DTO mapping including readinessState/reason and proofCoverage; avoid UI comparing non-equivalent flags
- G2-17-028-047 | `src/components/projects/project-readiness-workspace.tsx` | Restore distinct missing legacy regions; record expected zero-count and override-off screenshots

Project execution readiness is stricter than legacy submit-ready and uses append-only override events, not mutable workspace booleans. Model owner must decide semantics, audit migration and UI proof coverage. **12/12 handed off, not fixed**.

## College attendance controller — lane-7 handoff (2026-10-21)

- G2-2-009-010 | `src/components/attendance/admin-attendance-workspace.tsx` | On correction open refetch exact record state with server denial/error instead of relying on potentially stale grid.
- G2-2-009-022 | `src/modules/attendance/admin-attendance-service.ts` | Add error state refusing correction when fresh marker record cannot be loaded.
- G2-2-009-038 | `src/modules/attendance/admin-attendance-service.ts` | Align server to UI future-session policy, or explicitly approve pre-session corrections; prevent deep-link bypass.
- G2-2-009-039 | `src/components/attendance/admin-attendance-workspace.tsx` | Add detail fetch skeleton/error and hard-disable correction until verified.
- G2-2-009-044 | `src/components/attendance/admin-attendance-workspace.tsx` | Export aggregate attended/marked ratio identical to displayed legacy grid.
- G2-2-009-063 | `src/components/attendance/admin-attendance-workspace.tsx` | Restore live record read/verification before allowing writes and exact modal UI.
- G2-2-009-020 | `src/app/(authenticated)/college/attendance/page.tsx` | Show date-specific validation messages on any date-range client.
- G2-2-009-019 | `src/app/(authenticated)/college/attendance/page.tsx` | Map invalid tenant scope to safe same error semantic.
- G2-2-009-021 | `src/modules/attendance/admin-attendance-service.ts` | Provide exact invalid reason error to admin.
- G2-2-009-023 | `src/components/attendance/admin-attendance-workspace.tsx` | Restore operation-specific failure copy.
- G2-2-009-024 | `src/components/attendance/admin-attendance-workspace.tsx` | Keep action-specific success wording or document combined toast.
- G2-2-009-025 | `src/components/attendance/admin-attendance-workspace.tsx` | Include chosen session timestamp in success acknowledgement.

Attendance row correction permissions and fresh-record checks must be server-enforced, not only disabled client controls; consistent per-session CSV and exact success labels require Attendance owner. **12/12 handed off, not fixed**.

## College project template detail — lane-7 handoff (2026-10-21)

- G2-7-005-002 | `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | Add primary use-template CTA to `/college/projects/create?templateId=<UUID>` preselecting assigned version.
- G2-7-005-003 | `src/modules/projects/template-service.ts` | Bridge old integer-ID bookmarks via redirect/lookup if legacy deep-link migration required.
- G2-7-005-019 | `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | Restore use-template form launch; keep editing disabled.
- G2-7-005-021 | `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | Catch access/not found/database read separately; show legacy Retry and failure message.
- G2-7-005-026 | `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | Add deep link to full workspace create form, never lightweight duplicate modal.
- G2-7-005-029 | `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | Restore CTA to authoritative create route.
- G2-7-005-031 | `src/modules/projects/template-service.ts` | Determine whether old catalog exposed all published templates; if so add read-only browsing or assignment explanation.
- G2-7-005-053 | `src/db/schema/projects.ts + template migration` | Define template migration/model adapter for ID, lifecycle timestamp and all JSON section fields.
- G2-7-005-056 | `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | Restore only full create CTA, not preview or modal.
- G2-7-005-057 | `src/modules/projects/template-service.ts` | Ensure scope/authorization and catalog visibility meet product requirements.
- G2-7-005-022 | `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | Render true not-found/no-assignment state distinct from service errors.
- G2-7-005-023 | `src/components/projects/project-admin-missing-college.tsx` | Restore exact no-college message and project nav.

The project template detail already does scoped read-only assignment, but its create-deep-link must target an authorized form and assigned version. Projects owner must wire form/use CTA and explicit errors. **12/12 handed off, not fixed**.

## College dashboard summary — lane-7 handoff (2026-10-21)

- G2-2-013-009 | `src/modules/admin-ui/college-setup-checklist-service.ts` | Map legacy enrolments with college via class, not merely active membership role.
- G2-2-013-018 | `src/modules/admin-ui/college-setup-checklist-service.ts` | Use individual settled COUNT queries for FOUR summary metrics; unaffected tiles must still load.
- G2-2-013-020 | `src/modules/admin-ui/college-dashboard-cards-service.ts` | Allow permitted scoped Super Admin reader equivalent under selected acting-college context.
- G2-2-013-022 | `src/modules/admin-ui/college-setup-checklist-service.ts` | Preserve legacy count membership fallback or document deliberate status policy change.
- G2-2-013-026 | `src/modules/admin-ui/college-setup-checklist-service.ts` | Implement per-field fallback null; never replace failure with zero.
- G2-2-013-035 | `src/modules/admin-ui/college-setup-checklist-service.ts` | Isolate failures and preserve precision of '—' vs real zero.
- G2-2-013-038 | `src/modules/admin-ui/college-dashboard-cards-model.ts` | Return partial counts and carry null per failing dimension.
- G2-2-013-039 | `src/modules/admin-ui/college-setup-checklist-service.ts` | Separate summary dependency from unrelated setup metrics.
- G2-2-013-014 | `src/app/(authenticated)/college/page.tsx` | Map new route failure to safe equivalent copy.
- G2-2-013-015 | `src/app/(authenticated)/college/page.tsx` | Verify 401/redirect semantics for unauthenticated API/SSR clients.
- G2-2-013-016 | `src/modules/admin-ui/college-dashboard-cards-service.ts` | Version old REST response envelope for clients, no success toast requirement.

College dashboard summary totals require independent failures with nullable counts; do not fabricate zero for failed queries or broaden selected-college scope. Dashboard/Admin UI owner must decouple setup queries. **11/11 handed off, not fixed**.

## ZeptoMail event template mapping — lane-7 handoff (2026-10-21)

- G2-2-003-004 | `src/modules/notifications/zeptomail-config.ts` | Introduce audited typed event-to-template lookup and channel matrix for 19 legacy events.
- G2-2-003-005 | `src/modules/notifications/zeptomail-provider.ts` | Port event-specific property keys into typed provider configuration; protect OTP templates separately.
- G2-2-003-011 | `src/modules/notifications/zeptomail-provider.ts` | Add startup validation enumerating each email-enabled event with missing ID and aggregate warning.
- G2-2-003-012 | `src/modules/notifications/zeptomail-provider.ts` | Reject literal placeholder value across all email send paths.
- G2-2-003-016 | `src/modules/notifications/zeptomail-config.ts` | Add startup readiness audit and operational health metric, respecting non-production send restrictions.
- G2-2-003-017 | `src/modules/notifications/zeptomail-provider.ts` | Implement explicit legacy-event dispatch adapter with complete channel and merge-variable coverage.
- G2-2-003-021 | `src/modules/notifications/zeptomail-provider.ts` | Encode six-event email allowlist and refuse other legacy events unless owner explicitly expands.
- G2-2-003-022 | `src/modules/notifications/zeptomail-provider.ts` | Enforce negative event-channel policy to prevent cost/privacy regressions.
- G2-2-003-027 | `src/modules/notifications/zeptomail-config.ts` | Implement reviewed registry of each legacy event, channel and template binding; add channel tests.
- G2-2-003-014 | `src/modules/notifications/zeptomail-provider.ts` | Expose structured skip counts to ops without exposing recipients/credentials.
- G2-2-003-013 | `src/modules/notifications/zeptomail-config.ts` | Provide non-sensitive log/metric for complete event template provisioning.

Notification channel matrix and provider templates belong to Messaging/Notifications. Missing template IDs must not trigger sends, and expanding permitted email events carries privacy and cost consequences. **11/11 handed off, not fixed**.

## Lesson Resource uploads — lane-7 handoff (2026-10-21)

- G2-6-025-002 | `src/modules/storage/file-policy.ts` | Provide a lesson Resource file kind with course/delivery scope, not project-resource reuse.
- G2-6-025-005 | `src/modules/courses/lesson-resource-materials-service.ts` | Provide authenticated per-file Open/download action instead of public URL.
- G2-6-025-008 | `src/modules/storage/file-policy.ts` | Introduce distinct typed Resource namespace before issuing grants.
- G2-6-025-026 | `src/modules/storage/file-lifecycle.ts` | Store immutable Resource parent content/offering/delivery IDs and verify on upload completion.
- G2-6-025-027 | `src/modules/courses/lesson-resource-materials-service.ts` | Add atomic FILE grant/complete/attach, consumed token, object head, scan and tenant binding.
- G2-6-025-049 | `src/db/schema/lesson-content-materials.ts` | Wire material FILE rows with grant/complete/attestation transition and scoped signed downloads.
- G2-6-025-018 | `src/modules/courses/lesson-resource-materials-service.ts` | Preserve unauthenticated 401 vs authenticated 403 with exact UI wording.
- G2-6-025-019 | `src/modules/courses/lesson-resource-materials-service.ts` | Map typed 403 to legacy complete staff-only message in upload UI.
- G2-6-025-020 | `src/modules/storage/file-policy.ts` | Use new equivalent Resource-specific bad-request copy, without trusting caller-provided scope.
- G2-6-025-021 | `src/modules/storage/file-policy.ts` | Translate storage error codes to exact legacy Resource messages and field helper text.
- G2-6-025-023 | `src/modules/storage/file-lifecycle.ts` | Offer explicit storage-unavailable recovery, avoid exposing provider stack.

Existing signed storage intentionally prevents public download URLs. Course Resource FILE attachments require a scoped grant, HEAD/scan attestation and one-time receipt consumption before exposing downloads. Storage/Courses schema owned elsewhere. **11/11 handed off, not fixed**.

## TPO batch eligibility and invitation — lane-7 handoff (2026-10-21)

- G2-6-023-004 | `src/modules/placements/tpo-batch-workspace-read-service.ts` | Build total/eligible/placed/unbatched journey strip and same section ordering.
- G2-6-023-006 | `src/modules/placements/tpo-batch-workspace-read-service.ts` | Expose exact counts and quick-action badges per batch from authorized queries.
- G2-6-023-017 | `src/modules/placements/batch-participation-service.ts` | Support clear-to-NOT_DECIDED semantics via row removal, notes and per-scope decision provenance.
- G2-6-023-019 | `src/modules/placements/tpo-batch-workspace-read-service.ts` | Map no-college error to literal copy and 403 scope selection affordance.
- G2-6-023-020 | `src/modules/placements/batch-participation-service.ts` | Restore exact invalid-decision client and HTTP messaging.
- G2-6-023-021 | `src/modules/placements/batch-participation-service.ts` | Clone literal validation wording and field-level placement.
- G2-6-023-022 | `src/modules/placements/batch-participation-service.ts` | Map error codes to legacy complete wording; disable appropriate button.
- G2-6-023-024 | `src/modules/placements/batch-participation-service.ts` | Match confirmation/result summary and success count wording, not just event creation.
- G2-6-023-025 | `src/modules/placements/tpo-batch-reminder-service.ts` | Render legacy Reminded N student(s) / Everyone has chosen already variants.
- G2-6-023-026 | `src/modules/placements/tpo-batch-rules-service.ts` | Return complete effective policy or revalidate/refetch after save.

TPO cohort/eligibility/invitation read and writes span Placements batch ownership. 'Not decided' clearing must preserve audit and cannot be silently conflated with INELIGIBLE. **10/10 handed off, not fixed**.

## Super Admin departments — lane-7 handoff (2026-10-21)

- G2-18-030-002 | `src/app/(authenticated)/admin/departments/page.tsx` | Document product decision: Super Admin all-college view intentionally removed for safety; offer explicit selected-college scope UX, not silent empty list
- G2-18-030-036 | `src/modules/academics/department-service.ts` | Document intentionally removed unscoped listing; if global directory required, add new server-authorized paged cross-college view
- G2-18-030-037 | `src/app/api/academics/departments/[departmentId]/route.ts` | Document snakeCase→server tenant mapping and DELETE→ARCHIVE migration; old API clients must use new safe endpoints
- G2-18-030-039 | `src/modules/academics/college-department-mutation-service.ts` | Test selected-college SA acting scope authorization, no privilege via forged college ID, explicit missing-scope error
- G2-18-030-041 | `src/modules/academics/college-department-mutation-service.ts` | Explain archived children still block even when active count chips show zero; provide count/blocker reason from server
- G2-18-030-046 | `src/app/(authenticated)/admin/departments/page.tsx` | Catch list failure at page boundary, render error and retry rather than server exception or bogus no-results
- G2-18-030-058 | `src/db/schema/academics.ts` | Document legacy int→UUID ID translation, tenant scope and archivedAt vs delete for integrations/export
- G2-18-030-059 | `src/db/schema/academics.ts` | Confirm archived data retention and dependency uniqueness; old reports must not assume deleted rows disappear physically

Selected-college scoping and archive-rather-than-delete are intentionally safer vNext defaults; preserving global unscoped lookup would require explicit pagination/privacy scope. Academics/admin owner must implement error/state polish. **8/8 handed off, not fixed**.

## Super Admin login route — lane-7 handoff (2026-10-21)

- G2-6-031-001 | `src/app/superadmin-login/page.tsx` | Restore legacy route's recognizable branded login surface or record approved single-login consolidation and preserve returnTo.
- G2-6-031-019 | `src/components/auth/login-form.tsx` | Confirm whether explicit consent is still legally required; if yes restore checkbox/disabled rule with acknowledgement tracking.
- G2-6-031-038 | `src/components/auth/login-form.tsx` | Get owner/legal decision on affirmative consent vs informational text.
- G2-6-031-022 | `src/components/auth/login-form.tsx` | Restore exact text or document improved actionable contact language.
- G2-6-031-023 | `src/components/auth/login-form.tsx` | Match message and toast duration/position if strict clone outweighs usability.
- G2-6-031-024 | `src/components/auth/login-form.tsx` | Show exact error message on attempted empty submit; ensure keyboard flow.
- G2-6-031-026 | `src/components/auth/login-form.tsx` | Match literal OTP Sent! toast style/duration if parity required.
- G2-6-031-027 | `src/app/login/page.tsx` | Match placement and 4-second toast if route-specific parity; retain accessible persistent alert if approved.

Unifying login across roles is intentional; affirmative OTP Terms consent requires legal/policy signoff and cannot be reinstated solely for styling. Auth owner should retain non-enumerating error and OTP security even if legacy copy is requested. **8/8 handed off, not fixed**.

## Semester management clone — lane-7 handoff (2026-10-21)

- G2-18-029-002 | `src/app/(authenticated)/admin/semesters/page.tsx` | Restore 10/14 side-by-side card layout at lg, stack below breakpoint
- G2-18-029-005 | `src/app/(authenticated)/admin/semesters/page.tsx` | Recreate compact tools in list card header, including search placeholder
- G2-18-029-006 | `src/components/admin/super-admin-semester-create-control.tsx` | Open by default in bordered card, vertical fields and plus icon
- G2-18-029-007 | `src/components/admin/super-admin-semester-create-control.tsx` | Field-level errors, red alert headings, sticky failed-record Retry delete
- G2-18-029-013 | `src/app/(authenticated)/admin/semesters/page.tsx` | Retain old same-scope rows and warning Couldn't refresh semesters
- G2-18-029-016 | `src/app/(authenticated)/admin/semesters/page.tsx` | Apply old breakpoints and mobile horizontal table overflow
- G2-18-029-008 | `src/components/admin/super-admin-semester-create-control.tsx` | After create select its program for visible new row; preserve toast

Academic semester create/list visual layout and server fetch are shared Academic/Admin UI areas. Restore clone grid and safe retry with UI owner; semester number/program validation must remain scoped. **7/7 handed off, not fixed**.

## Browser reporting and marketing route integrations — lane-7 owned edits (2026-10-21)

- G2-2-034-002/-025/-026 | `src/app/(authenticated)/layout.tsx + persistent root client boundary` | Call installClientErrorReporting once from persistent client root; error/rejection/resource handlers are exported but not yet mounted.
- G2-2-034-003/-037/-059 | `src/lib/api-fetch.ts + auth/video/upload client surfaces` | Call reportClientEvent with category and sanitized error only; do not pass URL/body, and keep bounded opt-in console capture.
- G2-2-034-027 | `src/app/(authenticated)/layout.tsx` | Decide whether console.error capture is enabled; defaults disabled to preserve developer diagnostics and avoid PII reports.
- G2-20-004-029/-008-029 | `src/app/enterprises/page.tsx + src/app/universities/page.tsx` | Pass trusted MarketingLayout path/pageTitle/pageDescription so per-route WebPage/BreadcrumbList is emitted.
- G2-20-005-028 | `src/app/home/page.tsx + other marketing route metadata exports` | Adopt marketingPageMetadata for canonical, OG, Twitter and robots. Shared Organization/WebSite JSON-LD already emitted; no missing OG asset invented.
- G2-20-004-039 | `src/app/request-demo/page.tsx` | Replace subject-only mailto with exported MARKETING_DEMO_MAILTO, or use approved lead form after validation.

Owned modules are partially implemented; dependent installation and route page updates are **not** claimed done. Keep vNext no-AI direction in marketing schema and avoid sending browser PII or credential details through telemetry.

## TPO Requests — wave-1 lane-7 handoff (2026-10-21)

- G2-11-023-005 | `src/app/(authenticated)/tpo/requests/page.tsx` | Make proof-missing chip actionable and backend-grounded rather than advisory.
- G2-11-023-008 | `src/app/(authenticated)/tpo/requests/page.tsx` | Render typed payload fields and safe URL links with invalid URL fallback.
- G2-11-023-009 | `src/app/(authenticated)/tpo/requests/page.tsx` | Evaluate proof per request and show exact missing-proof warning.
- G2-11-023-018 | `src/app/(authenticated)/tpo/requests/page.tsx` | Restore discoverable selection controls and safe cross-page selection behavior.
- G2-11-023-035 | `src/components/placements/tpo-request-bulk-decision.tsx + request proof read service` | Add proof missing flags and explicit skip/error handling to bulk preview.
- G2-11-023-049 | `src/app/(authenticated)/tpo/requests/page.tsx` | Restore core request details and action discoverability, not only visual shell.

Cross-college request proof links must remain signed/verified; blanket bulk decisions without proof gating are not safe. TPO owner needs typed backend proof flags, correct actionable chip and discoverable selection. **6/6 handed off, not fixed**.

## Super Admin template sprints — wave-1 lane-7 handoff (2026-10-21)

- G2-11-029-022 | `src/components/projects/super-admin-template-plan-editor.tsx` | Protect unsaved form across Back, tabs, sidebar, refresh and browser close.
- G2-11-029-025 | `src/components/projects/super-admin-template-plan-editor.tsx` | Use merge/section PATCH or guarantee version conflict and no loss of concurrent edits.
- G2-11-029-026 | `src/modules/projects/template-service.ts` | Verify acting-college scope and permission parity to prevent tenant edits.
- G2-11-029-034 | `src/components/projects/super-admin-template-plan-editor.tsx` | Implement accessible non-destructive confirmation on navigation.
- G2-11-029-019 | `src/components/projects/super-admin-template-plan-editor.tsx` | Restore exact error title and preserve retry.
- G2-11-029-020 | `src/components/projects/super-admin-template-plan-editor.tsx` | Match toast/modal presentation and exact feedback.

Template editor must not silently drop concurrent sprints or tasks. Projects owner must preserve optimistic CAS, add unsaved-change guard and align modal copy. **6/6 handed off, not fixed**.

## Telegram alert callbacks — lane-7 handoff (2026-10-21)

- G2-6-024-005 | `src/modules/log-alerts/telegram-webhook.ts` | Add editMessageText or equivalent visible acknowledgment state and remove active button to avoid repeated clicks.
- G2-6-024-020 | `src/modules/log-alerts/telegram-webhook.ts` | Persist state AND edit original message, keeping provider update consistent with durable triage.
- G2-6-024-049 | `src/modules/log-alerts/telegram-webhook.ts` | Restore durable visible original-message acknowledgment and answer unknown-but-authentic callbacks.
- G2-6-024-015 | `src/app/api/webhooks/telegram/route.ts` | Align intended provider retry semantics and document intentionally stricter validation.
- G2-6-024-016 | `src/modules/log-alerts/telegram-webhook.ts` | Clone both ephemeral acknowledgment and durable original-message text update.
- G2-6-024-017 | `src/modules/log-alerts/telegram-webhook.ts` | Ensure Telegram confirmation remains visible after callback, not only transient popup.

Telegram provider acknowledgments must be authentic and persisted before editing the provider's original message. Provider calls/retries are Notifications ownership. **6/6 handed off, not fixed**.

## Job important-date DTO — lane-7 handoff (2026-10-21)

- G2-18-021-057 | `src/modules/placements/placement-legacy-posting-model.ts` | Write migration for JSON `date`→`at` with type/dateType, preserving insertion order and malformed-row reports.
- G2-18-021-058 | `src/modules/placements/placement-legacy-posting-model.ts` | Map old integer job identity and company display snapshot into UUID job and relationships.
- G2-18-021-059 | `src/modules/placements/placement-legacy-posting-model.ts` | Add subtype migration/schema projection, never infer from free-text after migration.
- G2-18-021-060 | `src/app/(authenticated)/learn/my-placements/calendar/page.tsx + scoped calendar data provider` | Preserve applied-job history event visibility after deadline for learner career continuity.
- G2-18-021-061 | `src/app/(authenticated)/learn/my-placements/calendar/page.tsx + scoped calendar data provider` | Make calendar multi-source: job important dates, existing booked rounds, blocked college dates with consistent legend, ICS and event links.
- G2-18-021-062 | `src/app/(authenticated)/learn/my-placements/calendar/page.tsx + scoped calendar data provider` | Choose role-specific data providers and preserve tenant boundaries, not a single global job date query.

Importing numeric legacy job date records and learner visible/applied event union belongs to Placements + schema, with strict college/role authorization. No migration performed. **6/6 handed off, not fixed**.

## Project workspace index redirect — lane-7 handoff (2026-10-21)

- G2-7-009-001 | `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | Forward validated query string, especially openTemplate/from/reason, into summary redirect; test deep links.
- G2-7-009-006 | `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | Keep openTemplate and reason parsed and encoded in redirect URL.
- G2-7-009-015 | `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | Ensure downstream summary action/At-risk context restored from query.
- G2-7-009-024 | `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | Accept searchParams promise, whitelist and encode all supported parameters; preserve page context.
- G2-7-009-028 | `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | Critical: preserve context query to prevent broken attach-template and review-return paths.
- G2-7-009-010 | `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | Validate required UUID and show scoped 404/error instead of nonsensical route; preserve compatibility slugs.

This redirect currently drops original searchParams. Restoring selected, validated context and privacy-safe 404 belongs to Projects. **6/6 handed off, not fixed.**

## File, uploads and media storage — lane-7 handoff (2026-10-21)

- G2-6-032-021 | `src/modules/storage/file-policy.ts` | Pre-check actual 4900MiB limit and explain need for multipart for larger videos.
- G2-6-032-038 | `src/modules/projects/project-resource-file-service.ts + authoring role permissions` | Resolve role-authoring parity for project resource files, separate from learner final-delivery submissions.
- G2-6-032-024 | `src/modules/storage/file-errors.ts + contextual Resource upload UI` | Map precise contextual legacy strings and show field-level recovery.
- G2-6-032-029 | `src/modules/storage/file-lifecycle.ts + Resource upload UI` | Use context-specific toast for grant failure with retry.
- G2-6-032-030 | `src/modules/storage/file-lifecycle.ts + client playback refresh` | Make URL refresh seamless near expiry and document 60-vs-120-minute default.

4900 MiB single-PUT size cap and private scanned-file model are intentional vNext safeguards; do not promise 5120 MiB uploads or public URLs. **5/5 handed off, not fixed.**

## TPO batch detail — lane-7 handoff (2026-10-21)

- G2-14-029-011 | `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` | Make all filters operate over full cohort before paging.
- G2-14-029-012 | `src/components/tpo/tpo-bulk-action-panel.tsx` | Expose full selection semantics and explicit per-page limits.
- G2-14-029-022 | `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx` | Partial readiness for optional sources rather than full failure.
- G2-14-029-027 | `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx` | Render partial/stale banners with retry controls.
- G2-14-029-019 | `src/components/tpo/tpo-batch-reminder-prep.tsx` | Match literal success notices.

Cohort-wide filtering and selection must not act on only current page under an all-visible label. **5/5 handed off, not fixed.**

## R2 storage activation condition — lane-7 handoff (2026-10-21)

- G2-2-002-007 | `src/modules/storage/r2-config.ts` | Align deployment readiness semantics; ensure missing secret/bucket fails closed with explicit setup instructions.
- G2-2-002-010 | `src/modules/storage/file-lifecycle.ts` | Handle missing config at per-feature boundary with typed 503/configure message; ensure other unrelated routes remain functional.
- G2-2-002-017 | `docs/architecture/file-and-video-apis.md + src/modules/storage/r2-config.ts` | Document new all-or-nothing readiness invariant and ensure all provisioning guides reflect it.
- G2-2-002-019 | `src/modules/storage/file-lifecycle.ts` | Ensure consumers show unavailable capability rather than 500, and avoid loading dependent route before guard.

Do not relax strict account/key/bucket guard to match legacy one-flag readiness; unavailable R2 should return a localized typed 503 instead of breaking unrelated pages. **4/4 handed off, not fixed.**

## TPO standalone request decisions — lane-7 handoff (2026-10-21)

- G2-13-022-005 | `src/modules/placements/tpo-request-decision-service.ts` | Support independent registration/PAP request kinds without application or explicit behavior change.
- G2-13-022-021 | `src/modules/placements/request-service.ts` | Allow standalone registration requests and persist choice changes.
- G2-13-022-037 | `src/modules/placements/tpo-request-decision-service.ts` | Use college+learner request scope independent of nullable application.
- G2-13-022-010 | `src/modules/placements/tpo-request-decision-service.ts + decision route error map` | Preserve 404 for missing IDs, differentiate malformed input via 400.

Current TPO decision service inner-joins application+job and does not support nullable job/application kinds; owning service must authorize via membership/college without an ID oracle. **4/4 handed off, not fixed.**

## Public job response contract — lane-7 handoff (2026-10-21)

- G2-17-021-044 | `src/db/schema/placements.ts + public job redirect route` | Import old slug mapping and HTTP 301/308 redirects to stable public link.
- G2-17-021-047 | `src/modules/placements/placement-legacy-posting-model.ts + schema migration` | Design row-level migration preserving public responsibilities, dates, salary, original slug and published timestamp.
- G2-17-021-048 | `src/modules/placements/public-job-projection.ts` | Ensure DTO select explicitly whitelists needed nested JSON only; validate no accidental serialization.
- G2-17-021-050 | `src/modules/placements/learner-job-service.ts + public job DTO route` | Keep public projection narrowly safe and never reuse learner eligibility view on public URLs.

Do not expose private eligibility/targeting in anonymous DTOs or assume legacy numeric job IDs equal current UUIDs. **4/4 handed off, not fixed.**

## R2 private storage configuration — wave-1 handoff (2026-10-21)

- G2-2-004-008 | `docs/architecture/file-and-video-apis.md + src/modules/storage/r2-config.ts` | Update provisioning/playbook and fail capability gracefully where unset.
- G2-2-004-012 | `src/modules/storage/file-lifecycle.ts + route-level storage error mapping` | Guard runtime upload/download operations and return 503 rather than crashing routes.
- G2-2-004-011 | `src/modules/storage/file-errors.ts + operator readiness diagnostics` | Map typed error to safe setup message and ops diagnostic.

R2 must fail closed for missing credentials and unsafe bucket reuse. Unrelated routes should stay functional; localized 503 and safe setup messaging need Storage owner. **3/3 handed off, not fixed.**

## Lesson content delivery/class sequence (2026-10-21)

- G2-17-018-006 | `src/db/schema/lesson-content-class-sequence.ts + drizzle/ + src/modules/courses/faculty-content-order-service.ts` | Register DB05 delivery order migration and remove disabled state after acceptance.
- G2-17-018-014 | `src/db/schema/lesson-content-class-sequence.ts + drizzle/ + src/modules/courses/faculty-content-order-service.ts` | Ship registered migration or show clear disabled copy with ops recovery.

Do not unconditionally enable reorder or fabricate successful migration before real DB service readiness. **2/2 handed off, not fixed.**

## Outbound mail delivery reconciliation (2026-10-21)

- G2-13-011-021 / G2-14-012-050 | `src/modules/messaging/service.ts + src/modules/messaging/providers.ts + src/modules/notifications/zeptomail-email.ts` | Register provider-supported idempotency/reconciliation key and durable uncertainty status in outbound queue before any retry of an unsafe POST; use new safe `outbound.retry_deferred` diagnostic for operations, never resend blindly.

- G2-16-020-019 | `src/modules/colleges/service.ts + faculty-chair association model/migration` | Implement assignment/validation as separate association with audit. Require college-scoped faculty membership before chair/vice-chair assignment.

- G2-20-011-015 | `src/modules/placements/application-status-history-service.ts + parent status mutation transaction` | Decide audit integrity fail-closed vs legacy fail-open, implement consistent safe response/retry Do not swallow audit write errors without documented audit-integrity policy and transactional compensation.
- G2-20-024-017 | `src/db/schema/db04-profile-education-images.staged.ts + src/modules/verification/document-manifest.ts + learner gallery API/UI` | Implement authorized upload/grant/read lifecycle Do not expose public image URLs or accept arbitrary image keys: verify learner membership, scoped receipt, private scan and one-time grant completion.
- G2-20-015-025 | `src/db/schema/db04-profile-education-images.staged.ts + src/modules/verification/document-manifest.ts + learner gallery API/UI` | Integrate upload grant/complete and authorized read URLs before profile gallery launch Do not expose public image URLs or accept arbitrary image keys: verify learner membership, scoped receipt, private scan and one-time grant completion.

## Legacy template assignment actor — lane-7 handoff (2026-10-21)

- G2-6-017-008 | `src/db/schema/projects.ts + template assignment import mapping` | Choose explicit system actor for historical unowned assignments; provide backward-compatible import fallback.

Choose an auditable migration/system principal for legacy null actor; do not silently turn not-null FK nullable without owner decision.

## Temporary SMS outage recovery — lane-7 handoff (2026-10-21)

- G2-2-005-010 | `src/modules/notifications/exotel-sms.ts` | Confirm business-level handling of provider false and non-runtime exceptions; avoid swallowing unrelated runtime exceptions.
- G2-2-005-011 | `src/modules/notifications/exotel-sms.ts` | Record intentional log format change; no obsolete fallback wording required.
- G2-2-005-012 | `src/modules/notifications/exotel-sms.ts` | Retain non-PII error class observability but do not mention expired bypass.

Legacy temporary testing fallback is intentionally removed. Never restore OTP bypass on provider failure; retain bounded retries, typed unavailable UX and no-PII error classes.

## API permission and company copy mapping — wave-1 handoff (2026-10-21)

- G2-2-036-020 | `src/modules/placements/recruiter-drive-request-service.ts + scoped HR entity routes` | Emit privacy-safe NOT_FOUND for cross-college recruiter object IDs while keeping explicit role-denied as generic FORBIDDEN. Do not infer resource visibility from generic AuthorizationError.
- G2-2-037-022 | `feature API routes + UI error boundaries` | Map exact old error copy only when the specific action and field are known, not all Zod name errors globally. Keep safe generic request failures and correlation ID otherwise.
- G2-20-027-008 | `src/modules/placements/company-service.ts + company form action UX` | Map field error Maintain one scoped typed error contract, no brand-name guessing from global field errors.
- G2-20-027-010 | `src/modules/placements/company-service.ts + company form action UX` | Map toast wording Maintain one scoped typed error contract, no brand-name guessing from global field errors.

## Recruiter invite typed rejection parity (2026-10-21)

- G2-3-026-027 | `src/modules/placements/tpo-recruiter-invite-service.ts + public-recruiter-invite-accept-service.ts + invite UI` | Expand typed reject reasons for field-specific EMAIL_REQUIRED/verification errors, then render safe per-field messages; keep token invalid collapsed to 404. Adapter now emits 400 for known NOT_ALLOWED and preserves safe generic descriptions.

## Admin scope selection copy — lane-7 follow-up (2026-10-21)

- G2-1-002-029 | `src/app/api/auth/admin-scope/route.ts + src/lib/friendly-error.ts + scope selector UI` | Map known ADMIN_SCOPE_NOT_FOUND to non-revealing invalid-selection help. Schema intentionally selects one organization OR one college at a time; no mismatched two-ID payload is accepted. Preserve request-ID and private response headers.

## Legacy class schedule date-range copy — lane-7 shared helper (2026-10-21)

- G2-2-037-021 | `src/components/academics/college-class-schedule-editor.tsx + academic schedule API/UI` | Consume exported `validateClassScheduleDateRange` from `src/lib/safe-format.ts` for class-schedule-only start/end errors. Preserve `startDate`/`endDate` field names, do not replace generic date validation elsewhere. Existing helper is ready but not wired by this lane.

- G2-7-032-051/-071 | `src/components/projects/project-admin-readiness-page.tsx` | Wire explicit selected archived record review and paged overrides; service workspace choices now accept page/pageSize/search.
- G2-3-011-025 | `src/modules/placements/tpo-job-type-write-service.ts` | Add pre-confirm impacted drive count/read-only preview; rename service already cascades.

- G2-1-012-009 | `src/modules/auth/http.ts` | Shared guard should emit per-field safe Zod errors for missing attemptId without weakening host/rate checks; route cannot infer reason from generic 400.
- G2-7-021-081 | `src/modules/projects/member-service.ts` | Paginate tenant-scoped eligible mentor query beyond 100; current limit100 search only.

- G2-3-011-024 | `src/modules/placements/tpo-job-type-write-service.ts` | Provide read-only preview of affected drive count and affected placed reports before setting countsAsPlaced; UI now states actual cascade.

- G2-18-011-070 | `src/db/schema/placements.ts + legacy placement import` | Migrate integer org-wide job IDs, college, program/cohort/section targeting to scoped UUID relations; posting parser now retains date classification, but no DB crosswalk imported.

- G2-19-022-103 | `src/app/api/placements/tpo/bulk-actions/preview/route.ts + mutation service` | Enforce NEW/CONTACTED/NOT_NOW and mandatory NOT_NOW reason server-side; page filter cannot enforce write policy.

- G2-7-012-059 | `src/modules/projects/readiness-service.ts + legacy history adapter` | Project flat-count DTO→nested execution/finalSubmission migration remains, release gate now informational.
- G2-13-001-028/-050 | `src/modules/placements/recruiter-company-reports-service.ts + employer grants policy` | Confirm creator-owned vs college-approved recruiter relationship portfolio and stage funnel semantics before narrowing tenant grants; not safe to filter createdByUserId blindly.

- G2-3-017-018/-019/-020 | `src/modules/people/profile-validation.ts + normalized education DB schema` | Align server-level pursuing-year/percentage normalization with the picker; decide optional maxGrade and CGPA >10 legacy warnings without weakening placement eligibility checks.

- G2-13-006-071/-073 | `src/modules/announcements/service.ts + src/app/(authenticated)/learn/my-placements/announcements/page.tsx` | Persist per-member unread/read receipt and trusted jobId fields, supply them to expanded learner notice projection; route must recheck target job authorization.

- G2-11-007-059 | `src/modules/placements/tpo-company-team-service.ts + historical thread migration` | Import legacy normalized name-keyed threads into college+UUID company conversations with collision audit; never read by untrusted company name.
- G2-20-009-018/-021 | `src/lib/api-error.ts + resource upload UI` | Map StorageFileError codes via storageFileFriendlyMessage(code,'resource') at correct route, distinguish 413 and 503; preserve safe generic error elsewhere.

- G2-7-004-008/-064 | `src/components/projects/project-admin-readiness-page.tsx` | Mount canonical ProjectWorkspaceReadiness details by selected workspace and preserve release/override context.
- G2-13-012-027 / G2-12-012-015 / G2-12-012-031 | `src/modules/placements/public-join/domain-model.ts + approved PSL dataset` | Replace partial hand-maintained public suffix list with reviewed maintained PSL without unsafe registrable-domain guessing; new packages forbidden in lane.

- G2-11-006-021 | `src/modules/placements/tpo-audit-service.ts + TpoAuditPage` | Implement scoped About/What happened/Who/When facet option count queries and checklist chips, not only links.
- G2-12-024-021 | `src/modules/log-alerts/admin-service.ts` | Add hour-scoped query over full recorded incidents to avoid latest100 cutoff for manual digests, retaining bounded tenant and rate guards.

- G2-12-026-007/-039 | `src/modules/projects/activity-service.ts` | Add exact eventType and page/size API aliases to bounded project activity service if legacy clients need them; category/IST date filtering now wired.
- G2-12-020-017/-055 | `src/modules/placements/public-join/domain-model.ts + company-curation-domain-model.ts` | Replace partial manual suffixes with maintained reviewed PSL normalization across all company gates (new packages forbidden without owner approval).

- G2-11-006-003 | `src/modules/placements/tpo-audit-service.ts` | Map legacy recruiter and student context IDs to authorized vNext URLs; grid adapts UUID drive links.
- G2-2-034-040 | `src/lib/report-client-error.ts + upload clients` | Emit safe FILE_UPLOAD_FAILURE classification/code only; never raw filename/presigned URL.

- G2-5-018-025/-020 | `src/app/api/projects/[projectId]/activity/route.ts + activity event import` | Reconcile legacy projectId row migration to project scoped subjects/metadata and add optional legacy success envelope if compatibility clients require it.
- G2-1-034-057 | `src/modules/placements/public-recruiter-invite-accept-service.ts + recruit consent UI` | Design PENDING_HR → JOINED consent lifecycle for existing recruiters while preserving token one-time use and verified college scope.
