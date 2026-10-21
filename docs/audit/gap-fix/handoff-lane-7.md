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
