# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-011-064 [P1] MISSING facet F09
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Before route leave, unsaved changes confirm native window dialog. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:223`
- Expected fix: Add beforeunload/route guard for edited unsaved live form.

## G2-11-011-069 [P1] GAP facet F10
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Draft debounced autosave at 1200ms. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- Expected fix: Implement debounced draft save with optimistic token + undo/error feedback.

## G2-11-011-078 [P1] GAP facet F12
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: RecordedOutside removes stale application window. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:251`
- Expected fix: Enforce recorded-outside deadline semantics in server mapping.

## G2-11-011-089 [P1] MISSING facet F15
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Recorded outside says No student is told when you publish it. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:608`
- Expected fix: Preserve suppression of publish notices for recorded drives.

## G2-11-011-101 [P1] GAP facet F19
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Autosave after 1200ms in draft. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- Expected fix: Debounce with no double-submit, or owner approve new save interaction.

## G2-11-011-107 [P1] MISSING facet F20
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Route-leave unsaved changes guarded. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:223`
- Expected fix: Implement dirty guard; no navigation-loss of edits.

## G2-11-011-110 [P1] MISSING facet F21
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Legacy JD is external file link consumed by students. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:588`
- Expected fix: Support secure file link and permissions.

## G2-11-011-112 [P1] GAP facet F22
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Legacy pay category derives Regular/Dream/Super dream and override reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:653`
- Expected fix: Preserve category tier and reason in persisted schema.

## G2-11-011-117 [P1] GAP facet F23
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Legacy drafts autosave; live asks consent; frozen readonly. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- Expected fix: Restore per-lifecycle workflow semantics.

## G2-11-013-009 [P1] GAP facet F03
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Publish button available after draft saved and checked. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:503`
- Expected fix: Expose Review & publish CTA with preflight after create.

## G2-11-013-017 [P1] GAP facet F04
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Regular/Dream/Super-dream tiers determined by max CTC >=10/>=20. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:35`
- Expected fix: Restore separate 3-tier pay category model.

## G2-11-013-018 [P1] MISSING facet F04
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Override tier requires category reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:647`
- Expected fix: Implement reason-required manual tier override.

## G2-11-013-019 [P1] GAP facet F05
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Default drive mode ON_CAMPUS. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:195`
- Expected fix: Provide distinct ON_CAMPUS/POOL/OFF_CAMPUS selector.

## G2-11-013-029 [P1] MISSING facet F06
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Override Category requires reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:651`
- Expected fix: Require manual category reason at client/server boundary.

## G2-11-013-030 [P1] GAP facet F06
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Round kind/name/mode independently editable on create. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:711`
- Expected fix: Restore per-round name/kind/mode before save.

## G2-11-013-044 [P1] GAP facet F10
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Draft autosaves to server 1200ms after entry. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- Expected fix: Restore server draft autosave as parity decision, keep local backup.

## G2-11-013-045 [P1] GAP facet F10
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Eligibility preview fetched pre-publish after draft changes. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:18`
- Expected fix: Add preview server endpoint before final publication.

## G2-11-013-076 [P1] GAP facet F19
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: 1200ms server draft autosave. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:327`
- Expected fix: Support draft persistence parity with idempotent create.

## G2-11-013-086 [P1] GAP facet F22
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Legacy payload includes role options, category, eligibility and rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:248`
- Expected fix: Map all legacy fields and reconcile partial creation.

## G2-11-013-088 [P1] GAP facet F22
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Round includes name/kind/mode ON_CAMPUS/VIRTUAL. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:711`
- Expected fix: Include round mode in create DTO.

## G2-11-013-090 [P1] GAP facet F23
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Unified full create editor, pay packages, editable rounds and autosave. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:41`
- Expected fix: Restore interactive parity, preserve safety additions.

## G2-11-013-091 [P1] GAP facet F23
- Files: src/components/placements/placement-job-create-form.tsx
- Legacy: Reach preview before publication. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:737`
- Expected fix: Add truthful prepublish reach preview.

## G2-12-019-015 [P1] GAP facet F04
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy internalNotes and internalReason hidden with @JsonIgnore `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:83-96,151-160`
- Expected fix: Keep staff-only reason isolated from learner-facing candidate message.

## G2-12-019-026 [P1] GAP facet F06
- Files: src/modules/placements/application-service.ts, src/db/schema/placements.ts
- Legacy: Legacy resume upload distinct from profile resume, revision history `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-82`
- Expected fix: Allow signed upload/selection per application with history, validate URL origin.

## G2-12-019-035 [P1] MISSING facet F10
- Files: src/modules/placements/application-service.ts
- Legacy: Old @PrePersist publicRef on both self and staff applications `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:177-188`
- Expected fix: Generate company-facing publicRef for every creation path.

## Fast verification disposition
- DEFERRED G2-11-011-064: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-011-069: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-011-078: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-011-089: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-011-101: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-011-107: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-011-110: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-011-112: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-011-117: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-009: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-017: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-018: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-019: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-029: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-030: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-044: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-045: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-076: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-086: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-088: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-090: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-11-013-091: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-12-019-015: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-12-019-026: Requires deeper source comparison and/or feature work; not certified as matching.
- DEFERRED G2-12-019-035: Requires deeper source comparison and/or feature work; not certified as matching.
