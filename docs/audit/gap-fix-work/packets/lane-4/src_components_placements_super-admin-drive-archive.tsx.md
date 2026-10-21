# Work packet: edit src/components/placements/super-admin-drive-archive.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md

## G2-10-014-006  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:164-193 — Danger zone red #cf1322 heading, #ffccc7 border, #fff1f0 background.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:65-71; src/components/placements/super-admin-drive-archive.tsx:43-67 — Archive action nested inside neutral More drive actions accordion.
- Fix: Restore prominent destructive region.

## G2-10-014-010  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:175-191 — Delete drive red primary DeleteOutlined, clear warning.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:42-66 — Preview impact then Confirm delete (archive), initially hidden.
- Fix: Show accessible danger CTA and truthful modern impact.

## G2-10-014-018  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:170-183 — Warn applicants remain after legacy delete; no notification.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:43-63 — Archive impact covers apps/rounds/offers and says students notified.
- Fix: Explicitly document and validate changed side effects.

## G2-10-014-044  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:82-100 — Legacy deletes listing and leaves applications without notifications.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:22-42 — Modern GET preview then POST archive/cancel/notify.
- Fix: Record mutation side effects and compatibility.

## G2-10-014-048  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:82-101 — Shared mutationRef blocks overlapping delete/status actions.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:11-36; src/components/placements/super-admin-published-drive-edit.tsx:22-40 — Each modern archive/edit guarded independently.
- Fix: Enforce cross-action mutual exclusion/CAS.

## G2-10-014-050  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:169-184 — Delete permanently removes listing, retains apps, no notification.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:43-66 — Archive with notification and cancellations, preserved history.
- Fix: Review product-approved behavior change.

## G2-10-014-058  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:172-183 — Delete explicitly tells admins learners won't be notified.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:43-48 — Modern archive explicitly says 'Learners are notified'.
- Fix: Confirm actual adapters and show truthful copy.

## G2-10-014-071  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:25-26,59-101 — Shared lock prevents delete and status actions concurrently.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:11-36; src/components/placements/super-admin-published-drive-edit.tsx:22-52 — Each control separate action guard.
- Fix: Use shared global entity mutation lock.

## G2-10-014-074  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:10,31-53 — AdminService GET job+metrics, status toggle and delete action.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:17-18; src/components/placements/super-admin-drive-archive.tsx:22-42 — JobService, archive and partial PATCH; no status route here.
- Fix: Map all legacy operations.

## G2-10-014-076  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:82-101 — Legacy deletion operation leaves applications.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:23-42 — Archive impact/cancellation/notification changes outcomes.
- Fix: Review business transaction/audit side effects.

## G2-10-014-079  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:170-183 — Delete retains apps, no learner notification.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:43-63 — Archive retains history, cancels and notifies.
- Fix: Reconcile ledger semantics.

## G2-10-014-036  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:90-98 — Delete success 'Drive deleted' toast and redirect.
- vNext now: src/components/placements/super-admin-drive-archive.tsx:31-36,63-66 — Archive redirects without success toast; inline errors.
- Fix: Confirm deletion result with truthful copy.
