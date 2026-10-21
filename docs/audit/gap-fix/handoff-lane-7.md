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
