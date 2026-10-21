# Work packet: edit src/app/(authenticated)/learn/profile/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-1/learner-profile.md, docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-004-012  [P1] GAP  facet F04  effort L
- Legacy: `LearnerProfileController.java:129-155` owner gets identity full, admins masked, teachers denied; `IdentityDTO.java:10-13` stores Aadhaar/PAN and refs.
- vNext now: `learner-profile-document-edit-service.ts:13-17` disallows raw IDs in generic profile; `learn/profile/page.tsx:56-80` shows verification.
- Fix: Provide private owner document capture/read and authorized masked admin review, never raw ID in generic JSON.

## G2-1-004-047  [P1] GAP  facet F14  effort L
- Legacy: `LearnerProfileController.java:242-281` tenant-owned ID/image/video/resume storage keys or URLs; no binary body.
- vNext now: `learner-profile-document-edit-service.ts:16-17` refuses raw ID; `learn/profile/page.tsx:56-80` verification status.
- Fix: Supply signed receipt upload/view and private admin review with tenant binding.

## G2-1-004-049  [P1] GAP  facet F14  effort L
- Legacy: `LearnerProfileController.java:1210-1237` default resume URL API.
- vNext now: `learn/profile/page.tsx:137-139` says resume required; no mapped profile default-resume editor.
- Fix: Provide default-resume upload/selection and placements consumption.

## G2-1-031-010  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:154-161: warning Alert with icon and small Retry for stale errors.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:30-38: server profile failure may error boundary; academic recovery only.
- Fix: Preserve last-good profile and retry on core data fetch error.

## G2-1-031-026  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:139: exact 'We couldn't load your profile. Please try again.'.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:30-34: required server profile load throws, no same route-level Retry.
- Fix: Add matching fatal error with Retry and preserve stale profile.

## G2-1-031-043  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:133-144: hard error centered 40px padding and Retry.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:20-40: no matching fatal in-page ErrorState.
- Fix: Add explicit fatal Retry state.

## G2-1-031-046  [P1] GAP  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:1315-1335: Identity document upload and link import.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:124-145: verification page link; core workspace Identity Documents text fields.
- Fix: Surface secure identity file receipt upload and status from profile.

## G2-1-009-028  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/learn/profile.js:133-142`: Profile hub failure uses `We couldn't load your profile. Please try again.` plus Retry.
- vNext now: `src/app/(authenticated)/learn/profile/page.tsx:85-88`: partial academic recovery warning with retry and alternate copy.
- Fix: Use role-specific retry copy while keeping new partial-profile recovery.

## G2-1-031-028  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:88: fallback program 'Program couldn't load'.
- vNext now: src/app/(authenticated)/learn/profile/page.tsx:86-89: 'Your academic summary is temporarily unavailable...', different copy.
- Fix: Match program-specific phrase or deliberate enhanced copy.
