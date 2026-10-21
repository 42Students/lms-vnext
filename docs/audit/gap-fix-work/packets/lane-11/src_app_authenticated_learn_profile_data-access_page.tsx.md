# Work packet: edit src/app/(authenticated)/learn/profile/data-access/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-009-004  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:13-18`: academic record, provenance and sharing disclosure are two concerns.
- vNext now: `src/app/(authenticated)/learn/profile/data-access/page.tsx:17-44`: policy, academic summary, then membership change log; no company-sharing section.
- Fix: Restore third-party share disclosure as separate section ahead of generic membership activity.

## G2-1-009-006  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:36-55`: data-access view should identify company, job and external recipient.
- vNext now: `src/app/(authenticated)/learn/profile/data-access/page.tsx:19-24`: narrative bullets about possible classes of recipients, no named access rows.
- Fix: Render named recipient, job, share time and download time for each relevant share.

## G2-1-009-022  [P1] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:48-49`: download timestamp earliest DOWNLOADED_LIST or DOWNLOADED_ZIP.
- vNext now: `src/app/(authenticated)/learn/profile/data-access/page.tsx:35-43`: list membership events, no download status field.
- Fix: Expose `downloadedAt` or explicit Never downloaded for each share.
