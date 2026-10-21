# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md

## G2-11-011-002  [P2] GAP  facet F01  effort M
- Legacy: Route /tpo/drives/{jobId}/edit renders shared DriveFormPage by editId. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId]/edit.js:12`
- vNext now: New route /tpo/placements/jobs/{jobId}/edit renders specialized TpoDriveEditForm. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:11`
- Fix: Preserve old edit route alias and original full form experience.

## G2-11-011-004  [P2] GAP  facet F01  effort S
- Legacy: Legacy ListingPageHeader title create/edit context and dynamic save-state in rightContent. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:485`
- vNext now: New PageHeader fixed Edit drive, description and back link; save status absent. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:21`
- Fix: Show legacy contextual heading and current save state.

## G2-11-011-005  [P2] GAP  facet F01  effort M
- Legacy: Legacy header action Open drive page and Publish/Save changes. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:496`
- vNext now: New header only Drive workspace back link, save at bottom. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:22`
- Fix: Restore save action at top and current state.

## G2-11-011-049  [P2] GAP  facet F06  effort M
- Legacy: Frozen drive disables entire form. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:525`
- vNext now: vNext noneditable replaces form with warning and Create drive CTA. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:23`
- Fix: Render read-only saved values instead of hiding form.

## G2-11-011-070  [P2] GAP  facet F10  effort M
- Legacy: Publish button saves then redirects ?publish=1 to legacy preflight. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:458`
- vNext now: New edit form no Publish action; user returns to workspace separately. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:21`
- Fix: Expose Review and publish deep link after successful save.

## G2-11-011-074  [P2] GAP  facet F11  effort M
- Legacy: Frozen detail remains visible read-only. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:525`
- vNext now: Shows warning only, saved values not rendered. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:23`
- Fix: Present disabled read-only details for history.

## G2-11-011-079  [P2] GAP  facet F13  effort S
- Legacy: Loading disabled form and info alert. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:518`
- vNext now: Server waits and sends final UI only. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:16`
- Fix: Show skeleton and exact alert on slow fetch.

## G2-11-011-080  [P2] GAP  facet F13  effort M
- Legacy: Hydration error includes Retry button. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:519`
- vNext now: Server throws to global boundary. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx:18`
- Fix: Offer in-page Retry on transient errors.
