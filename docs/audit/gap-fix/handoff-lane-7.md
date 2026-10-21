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
