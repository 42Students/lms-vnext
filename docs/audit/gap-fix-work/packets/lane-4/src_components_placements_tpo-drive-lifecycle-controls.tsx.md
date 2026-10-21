# Work packet: edit src/components/placements/tpo-drive-lifecycle-controls.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md, docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-11-010-033  [P1] MISSING  facet F06  effort M
- Legacy: Decline reasons fixed four choices. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:40`
- vNext now: vNext lifecycle UI has only PUBLISH and REOPEN choices. `src/components/placements/tpo-drive-lifecycle-controls.tsx:16`
- Fix: Expose four legacy decline choices for REQUEST with reason picker.

## G2-11-010-036  [P1] MISSING  facet F06  effort M
- Legacy: Decline OK disabled when reasonIsValid false. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:488`
- vNext now: No decline action in lifecycle component. `src/components/placements/tpo-drive-lifecycle-controls.tsx:37`
- Fix: Implement request decline validation and disabled state.

## G2-11-010-048  [P1] MISSING  facet F09  effort M
- Legacy: Decline uses AsyncModal title Decline this request, reason picker, disabled invalid. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:487`
- vNext now: No decline dialog in lifecycle control. `src/components/placements/tpo-drive-lifecycle-controls.tsx:19`
- Fix: Add request decision dialog with fixed choices.

## G2-11-010-061  [P1] GAP  facet F11  effort M
- Legacy: Legacy readOnly false regardless of season; frozen limits specific actions. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:270`
- vNext now: vNext publish/reopen readiness requires active season/company. `src/components/placements/tpo-drive-lifecycle-controls.tsx:80`
- Fix: Avoid season locking legacy editable drive solely because of season.

## G2-11-010-078  [P1] GAP  facet F15  effort L
- Legacy: Publish confirms N eligible will be notified App and Email. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:520`
- vNext now: New publish explicitly App only; email option disabled and says not configured. `src/components/placements/tpo-drive-lifecycle-controls.tsx:128`
- Fix: Do not claim email parity; restore email delivery only if configured or document planned difference.

## G2-11-010-101  [P1] GAP  facet F22  effort L
- Legacy: Legacy job lifecycle includes REQUEST,SENT_BACK,DRAFT,PUBLISHED,CLOSED,CANCELLED,REJECTED. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:141`
- vNext now: New action model PUBLISH/REOPEN, job state DRAFT/PUBLISHED/CLOSED/ARCHIVED. `src/components/placements/tpo-drive-lifecycle-controls.tsx:17`
- Fix: Map missing recruiter request statuses explicitly and document migrations.

## G2-11-010-108  [P1] GAP  facet F23  effort M
- Legacy: Old publish modal allows app+email with clear no-undo warning. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:501`
- vNext now: New form requires reason/acknowledgement and disables email. `src/components/placements/tpo-drive-lifecycle-controls.tsx:127`
- Fix: Preserve blocking/notification clarity; change email only after delivery integration.

## G2-3-023-048  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:150-164`, `src/components/placements/tpo-drive-lifecycle-controls.tsx:132-141`
- Fix: Legacy publish email defaults enabled; VNext visibly offers email but backend always rejects. Fix or explicitly disable with approved exception.

## G2-11-010-039  [P2] GAP  facet F07  effort S
- Legacy: Eligibility or rounds preview failure shows Could not verify eligibility and rounds. Retry before publishing. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:238`
- vNext now: Service readiness null shows Publication readiness missing warning and publishing unavailable. `src/components/placements/tpo-drive-lifecycle-controls.tsx:390`
- Fix: Use exact legacy publish-preflight error copy.

## G2-11-010-041  [P2] GAP  facet F07  effort S
- Legacy: Action failure toast prefers server response message; fallback {label} failed. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:123`
- vNext now: Inline error maps FriendlyFetchError, codes to friendly messages. `src/components/placements/tpo-drive-lifecycle-controls.tsx:67`
- Fix: Map exact old fallback and preserve backend validation details.

## G2-11-010-043  [P2] GAP  facet F08  effort S
- Legacy: Success action message is parameter label e.g. Published, Drive closed. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:124`
- vNext now: New publish success says Published. N eligible learners notified in app. No email sent. `src/components/placements/tpo-drive-lifecycle-controls.tsx:59`
- Fix: Align toast/notice wording to legacy after verifying delivery.

## G2-3-023-016  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/components/placements/tpo-drive-lifecycle-controls.tsx:59-67`
- Fix: Legacy audit labels students emailed/no email sent; VNext success displays count notified in app and says no email sent. Disclose channel change.
