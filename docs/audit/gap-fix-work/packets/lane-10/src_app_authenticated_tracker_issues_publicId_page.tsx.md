# Work packet: edit src/app/(authenticated)/tracker/issues/[publicId]/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md, docs/audit/gap2/lane-3/bug-report-activity.md

## G2-16-003-001  [P1] GAP  facet F01  effort L
- Legacy: `[issueId].js:129-134,262`: public `/tracker/issues/[issueId]` in standalone TrackerShell, back `← All issues`.
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:45-50,88-98`: Super Admin-only page in authenticated shell, `Back to issues`.
- Fix: Provide privacy-approved read-only report detail for reporter/public, while retaining separate admin edit controls.

## G2-16-003-043  [P1] GAP  facet F11  effort L
- Legacy: `[issueId].js:174-187`: unprivileged viewer sees status read-only and all core details.
- vNext now: `issues/[publicId]/page.tsx:45-46`: non-Super Admin redirected; alternate `tracker/mine/[publicId]/page.tsx:31-43` has only minimal content.
- Fix: Expose owner-scoped, privacy-safe detail showing core fields and evidence, not global reports.

## G2-3-021-044  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:21-43`, `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-79`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:139-170`, `src/modules/bug-tracker/reporter-service.ts:27-46`
- Fix: Legacy issue detail exposes full chronological Activity card to issue viewer, vNext ordinary reporter cannot access an event timeline and super-admin history is collapsed/reversed. Restore role-safe history and default placement.

## G2-16-003-030  [P2] GAP  facet F07  effort M
- Legacy: `[issueId].js:65-76`: separate load failure `Issue could not be loaded.` and attachment failure `Screenshots could not be loaded right now.`.
- vNext now: `issues/[publicId]/page.tsx:63-69,171-187`: notFound or throws for issue, no distinct screenshot fetch error.
- Fix: Render retryable issue-load alert and independent attachment-error notice without hiding the report.

## G2-3-021-015  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:21-22`, `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-52`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:139-143`
- Fix: Legacy hides the entire Activity card when no rows, vNext displays disclosure and `No workflow history yet.`. Decide exact empty behavior by viewer.

## G2-3-021-016  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-52`
- vNext now: `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx:45-68`
- Fix: Legacy independently fetched activity failure leaves issue detail intact; vNext coupled admin detail query can fail whole page if history fetch errors. Make secondary audit fetch isolated/retriable.
