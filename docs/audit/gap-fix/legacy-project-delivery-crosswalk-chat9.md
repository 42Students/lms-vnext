# Legacy ProjectDelivery → vNext delivery crosswalk (G2-4-018-072)

Source of truth: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:18-129`; target: `src/db/schema/projects.ts:1009-1160`.

This is a migration contract, **not** a claim that migration has run. ProjectDelivery is **one mutable row per legacy project** (`project_id` unique). vNext `project_submissions` is **versioned** and supports reviews/events. Never interpret the JPA optimistic `@Version` counter or `revision_count` as a count of historical submission snapshots.

| Legacy column(s) | vNext destination / transformation |
|---|---|
| inherited `id`, `project_id` | `legacyDeliveryId` for audit and crosswalk; lookup legacy project → scoped `projectInstances.id`, then `projectSubmissions.projectId`. Reject missing/cross-college references. |
| `status` | Preserve exact raw text in `legacyStatus`. Normalize Draft → DRAFT; Submitted/Under review → SUBMITTED; Changes requested → CHANGES_REQUESTED; Accepted/Locked → APPROVED, with `lockedAt` when truly locked. Reject unknown tokens for reconciliation. |
| `snapshot` | `legacySnapshot` verbatim; keep separate from editable `summary`. |
| `notes`, `source_url`, `attachments` | `notes`, `sourceUrl`, JSON `attachments`; validate each entry and do not import untrusted external URLs as verified file grants. |
| `attachment_url`, `file_name`, `file_size`, `file_mime_type`, `storage_key` | `legacyPrimaryAttachmentUrl`, `legacyFileName`, `legacyFileSize`, `legacyMimeType`, `legacyStorageKey` are source provenance only. Do not expose raw storage keys or make legacy storage paths downloadable until verified. |
| `revision_count` | `legacyRevisionCount`; do **not** assign to `projectSubmissions.version`. Initialize the imported current snapshot as a single version, normally 1, and reconstruct earlier versions only from separately verified historical evidence. |
| `review_status`, `feedback`, `reviewed_at` | `legacyReviewStatus`; map reviewed timestamp, reviewer and feedback to `projectSubmissionReviews` only when its reviewer can be resolved to a scoped membership; retain source details for reconciliation otherwise. |
| `draft_saved_at`, `draft_saved_by_id/name` | `legacyDraftSavedAt`, `legacyDraftSavedByName`; numeric actor ID requires explicit user/membership crosswalk, never cast to UUID. |
| `submitted_at`, `submitted_by_id/name/type` | `legacySubmittedLocal`, `submittedAt`, `submittedByMembershipId`, `legacySubmittedByName/Type`. Interpret old LocalDateTime in Asia/Kolkata before conversion to UTC. |
| `reviewed_by_id/name/type`, `locked_by_id/name` | Membership crosswalk + `legacyReviewedByName/Type`, `legacyLockedByName`; lock event in `projectDeliveryEvents` only if verified. |
| `last_updated_at`, `last_updated_by_id/name/type` | `legacyLastUpdatedAt`, `legacyLastUpdatedByName/Type` plus scoped actor mapping. |
| `locked_at` | `projectSubmissions.lockedAt` and the corresponding verified delivery event; distinguish from generic APPROVED. |
| `version` (`@Version Long`) | `legacyOptimisticVersion` provenance, **not** vNext submission version or revision count. Reject values outside the destination integer range instead of truncating. |
| inherited `isDeleted`, creation/update metadata | `deletedAt` and creation/update timestamps; deleted source deliveries must not become visible active submissions. Preserve retention metadata in the migration audit trail. |

## Import invariants

1. Create a deterministic scoped mapping `(legacy college, legacy delivery ID, legacy project ID)` to vNext identifiers. Refuse collisions, orphans, unresolved required author memberships, and cross-tenant linkage.
2. Import the source's current mutable snapshot once; never fabricate revisions or approval actions. Historical actions may become append-only delivery events only when an independently verifiable source exists.
3. Normalize all legacy India-local datetime fields in IST and store UTC timestamps. Preserve raw text/status and actor names for audit.
4. The target currently requires `summary` and `createdByMembershipId`, and non-draft submissions require `submittedByMembershipId` and `submittedAt`. Quarantine rows missing required resolved identities/timestamps rather than invent actors.
5. Run count checks per college, uniqueness on legacy IDs, valid status checks, attachment verification, and read-only projection comparison. Importing actual production rows is a separate operation and is **not** performed by this crosswalk.
