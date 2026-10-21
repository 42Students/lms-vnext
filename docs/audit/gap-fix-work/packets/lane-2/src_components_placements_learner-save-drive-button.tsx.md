# Work packet: edit src/components/placements/learner-save-drive-button.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-17/learner-saved-jobs-service.md, docs/audit/gap2/lane-19/learner-saved-job-service.md, docs/audit/gap2/lane-3/learner-saved-job.md

## G2-14-005-039  [P1] GAP  facet F06  effort M
- Legacy: Legacy save button disabled if saved-ID fetch unavailable or already in-flight; vNext own button enabled on initial source failure because savedIds prop empty — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:249-259,485-486`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:10-35`; `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:61-77`
- Fix: Propagate bookmark loading-error status and disable action until state known

## G2-14-005-043  [P2] GAP  facet F07  effort S
- Legacy: Legacy error on optimistic bookmark save Couldn't save — try again/ Couldn't remove — try again; vNext raw HTTP/API friendly error — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:497-513`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:21-29`
- Fix: Map exact fallback error copy and show inline beside heart

## G2-14-005-044  [P2] GAP  facet F08  effort S
- Legacy: Legacy save success silently flips filled heart (no toast); vNext text success toast Saved for later/Removed from saved — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:477-480`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:24-36`
- Fix: Remove success toast; use heart pressed state and announce only in ARIA live region

## G2-17-011-020  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:423-425 — Failure toast backend message or `Failed to update saved job`.
- vNext now: src/components/placements/learner-save-drive-button.tsx:27-28 — Inline error from apiFetch or friendlyApiError.
- Fix: Use exact fallback and toast treatment.

## G2-19-012-021  [P2] GAP  facet F08  effort S
- Legacy: Legacy exceptions return `Failed to save... contact support` or `Failed to unsave...` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:788-790` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:821-823`
- vNext now: vNext button displays Error.message or friendlyApiError `src/components/placements/learner-save-drive-button.tsx:26-27` `src/components/placements/learner-save-drive-button.tsx:36`
- Fix: Use consistent user-safe retry copy and no raw internal errors.

## G2-3-019-017  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:789-790`, `821-824`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:27-36`
- Fix: Legacy save errors `Failed to save. Please try again or contact support.` or unsave equivalent; vNext apiFetch error text generic. Provide precise error mapping.

## G2-3-019-019  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:477-511`, `docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:403-425`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:24-36`
- Fix: Legacy list failures show persistent inline card error, detail shows toast; vNext one inline `message` used in all instances including success. Split context behavior and retry placement.
