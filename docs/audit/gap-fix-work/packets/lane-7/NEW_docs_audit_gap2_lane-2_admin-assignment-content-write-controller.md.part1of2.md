# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-assignment-content-write-controller.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-assignment-content-write-controller.md

## G2-2-006-004  [P1] MISSING  facet F03  effort S
- Legacy: LF:143-147 Add attachment type and resources, LF:163-181 upload handling
- vNext now: NP:127-140 only Instructions textarea/MethodPicker
- Fix: Implement 1-30 resource builder (INSTRUCTIONS, PDF, FILE, LINK) with title/reorder and upload.

## G2-2-006-005  [P1] MISSING  facet F03  effort S
- Legacy: LF:163-167 PDF-specific upload error toast, LF:185-189 wait uploads
- vNext now: NP:100-163 no authoring file upload controls
- Fix: Add typed file picker, in-progress indicator and prevent save until upload completes.

## G2-2-006-014  [P1] GAP  facet F06  effort S
- Legacy: LS:300-301 points integer value 0..1000
- vNext now: NP:39 and :56-59 UI 1..10000, NV:50-54 backend 0..10000
- Fix: Enforce shared 0–1000 legacy points range across UI/validation/schema.

## G2-2-006-015  [P1] GAP  facet F06  effort S
- Legacy: LS:287-299 due date required and must be future on creation/change
- vNext now: NP:129 optional until publishing; NV:46-48 nullable dueAt
- Fix: Decide on draft staging; if strict parity require due date for save and future check.

## G2-2-006-016  [P1] MISSING  facet F06  effort S
- Legacy: LS:152-164 1-30 resources and at least one distinct submission method
- vNext now: NP:60-61 one method, but no resource collection at all
- Fix: Build resource form and enforce count/unique methods/validation before save.

## G2-2-006-017  [P1] GAP  facet F06  effort S
- Legacy: LS:172-182 resource title ≤255, one INSTRUCTIONS, nonempty sanitized HTML
- vNext now: NP:133-136 plain textarea 10000, no resource title/type or rich HTML
- Fix: Restore typed resource editor, single instructions rule, HTML sanitizer.

## G2-2-006-018  [P1] MISSING  facet F06  effort S
- Legacy: LS:184-199 LINK requires HTTPS; PDF/FILE validate key/size
- vNext now: NM:7-21 only LINK materials (title ≤160, sequence ≤19), NP no authoring list
- Fix: Implement full PDF/FILE/LINK/INSTRUCTIONS set with HTTPS+file checks.

## G2-2-006-020  [P1] GAP  facet F06  effort S
- Legacy: LS:247-272 after submissions title-only edits remain allowed
- vNext now: NS:305-310 rejects any admin update if a submission exists
- Fix: Allow title-only corrections after submissions, lock other fields.

## G2-2-006-024  [P1] MISSING  facet F07  effort S
- Legacy: LS:153-156 'Assignment requires 1 to 30 resources'
- vNext now: NP:100-163 no resource collection; create can succeed without resources
- Fix: Fail missing-resource saves with exact message on legacy-compatible path.

## G2-2-006-027  [P1] MISSING  facet F07  effort S
- Legacy: LS:127-149 precise file key, MIME, size and unavailable checks
- vNext now: NP:100-163 no PDF/FILE upload entry
- Fix: Port field and server errors for bad file metadata and storage outage.

## G2-2-006-031  [P1] MISSING  facet F09  effort S
- Legacy: LF:149-181 upload control and UploadFromLinkButton import
- vNext now: NP:100-163 no upload/link importer
- Fix: Add upload/from-link UI with safe server attestation.

## G2-2-006-033  [P1] GAP  facet F10  effort S
- Legacy: LS:207-321 @Transactional save updates old content row, class, resources, submissions and flags
- vNext now: NS:249-269 inserts course_assignments DRAFT only; no resource transaction
- Fix: Persist resource structures atomically with assignment metadata, preserve legacy edit semantics.

## G2-2-006-035  [P1] GAP  facet F10  effort S
- Legacy: LS:245-272 prevents deadline/points/resources/audience changes after learner submissions
- vNext now: NS:305-310 rejects any update after submission
- Fix: Support legacy title-only edits; preserve all other post-submission immutable fields.

## G2-2-006-036  [P1] GAP  facet F11  effort S
- Legacy: LC:46-50 superadmin or faculty type ADMIN, explicit 403
- vNext now: NS:239-246 `courses.manage` for shared, NS:219-237 delivery-scoped requireDeliveryContentMutation
- Fix: Verify super-admin acting-college and ADMIN-only scopes; ensure faculty cannot use admin shared authoring.

## G2-2-006-039  [P1] GAP  facet F12  effort S
- Legacy: LS:247-272 submitted assignment cannot disable or modify except title
- vNext now: NS:305-310 no edit whatsoever after submissions; NF:84-86 title-only faculty
- Fix: Align admin title-only edit with existing faculty model.

## G2-2-006-044  [P1] MISSING  facet F14  effort S
- Legacy: LF:163-183 presigned PDF/FILE R2 direct upload, Link importer LF:8-10
- vNext now: NP:100-163 none; NM:7-21 links only materials
- Fix: Add persisted scanned/attested file materials (PDF/FILE), upload and from-link controls.

## G2-2-006-045  [P1] MISSING  facet F14  effort S
- Legacy: LS:105-149 enforces tenant key org/college assignments, 50MiB limit, file metadata
- vNext now: NM:7-21 no file materials; NP no size checking
- Fix: Design vNext tenant-scoped private-file grants and verify size/MIME/virus attestation.

## G2-2-006-052  [P1] GAP  facet F20  effort S
- Legacy: LF:43-44 request token prevents stale lesson/class lookup races, LF:199-208 stale version warning
- vNext now: NS:305-312 locks row and optional timestamp token
- Fix: Require expectedUpdatedAt on admin edit and protect read-modify-save race with robust CAS.

## G2-2-006-055  [P1] MISSING  facet F21  effort S
- Legacy: LS:18,105-149 R2StorageUtils HEAD metadata verification, fails 503 on outage
- vNext now: NM:7-21 links-only material table, no private file grant in NP
- Fix: Wire vNext attested R2 upload lifecycle and safe retries.

## G2-2-006-056  [P1] MISSING  facet F21  effort S
- Legacy: LF:8-10 UploadFromLinkButton and uploadFileViaPresign
- vNext now: NP:100-163 no authoring storage integration
- Fix: Integrate link import and upload with tenant-based access checks.
