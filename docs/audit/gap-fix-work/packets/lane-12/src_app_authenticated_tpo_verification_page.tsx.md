# Work packet: edit src/app/(authenticated)/tpo/verification/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u025-tpo-verification.md

## G2-11-025-029  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:157-163`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:110-118`
- Fix: Legacy access error Could not check your verification access with retry, vNext queue handles unavailable vs disabled vs not permitted separately.

## G2-11-025-030  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:169-177`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:110-112`
- Fix: Legacy Could not load the queue with inline Retry while preserving loaded list; vNext SSR unavailable and Retry route behavior may reset filters.

## G2-11-025-035  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:286-286`
- vNext now: `src/app/(authenticated)/tpo/verification/page.tsx:113-118`
- Fix: Legacy setting-toggle success copy accessible for college admin but not TPO; vNext TPO page does not expose toggle, intentional role split.
