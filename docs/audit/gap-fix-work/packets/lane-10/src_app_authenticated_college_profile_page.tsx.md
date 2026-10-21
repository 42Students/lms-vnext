# Work packet: edit src/app/(authenticated)/college/profile/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-admin-profile.md

## G2-1-026-012  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:143-151: warning Alert with icon and small Retry on refresh failure.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:27-32: full ErrorState replaces editor.
- Fix: Preserve stale profile and retry without blanking page.

## G2-1-026-034  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:143-151: stale warning 'Couldn't refresh profile' and 'Showing the last profile we loaded.'
- vNext now: src/app/(authenticated)/college/profile/page.tsx:27-32: replaces full page, no stale message.
- Fix: Retain cached profile and exact warning copy.

## G2-1-026-051  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:143-156: background failure preserves last profile and Retry.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:27-32: full fatal state; no last-known data.
- Fix: Implement stale-while-revalidate cache state.

## G2-1-026-033  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:121-130: hard load 'Failed to load profile.' and Retry.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:27-30: 'Failed to load profile' with longer explanation.
- Fix: Match punctuation/error placement.
