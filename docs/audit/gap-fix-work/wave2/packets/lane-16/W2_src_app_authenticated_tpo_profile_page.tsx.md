# Work packet (wave 2): edit src/app/(authenticated)/tpo/profile/page.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:65-69,102-107 — Profile title and How students and recruiters see you in the placement workspace subtitle.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:46-48 — Profile title, description Your signed-in college membership and available faculty-backed profile information.
- Fix: Restore exact source page subtitle.

## G2-19-030-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:101-118 — ListingPageHeader then live refresh alert, TpoProfileCard.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:45-124 — PageHeader then Account details section and read-only note.
- Fix: Match source card-first layout and heading hierarchy.

## G2-19-030-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:51-57 — Ant Descriptions 1 column, label width160, small density.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:67-114 — sm two-column grid, labels above values.
- Fix: Match label/value layout and source one-column order.

## G2-19-030-008  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:50-61 — Card title How students and recruiters see you, help note for locked phone/email.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:63-65,117-123 — Account details title and generic read-only note.
- Fix: Restore source card title and phone/email hint.

## G2-19-030-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:108-113 — Refreshing profile… status and Couldn't refresh profile Alert with Retry.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — SSR data load without visible soft-refresh status.
- Fix: Preserve in-card refresh and stale-data warning after retry.

## G2-19-030-021  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:39-44 — image-by-link accepts publicUrl and shows link-specific error.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — no image URL import.
- Fix: Restore validated image link flow only if storage-policy approved.

## G2-19-030-022  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:59-60 — phone/email changed by college admin, not editable here.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:117-123 — read-only explanation mentions account/membership but not contacts.
- Fix: Keep contact locked, add source explanation.

## G2-19-030-033  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:26-27 — update Redux global profile image and trigger refresh.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:32-44 — server fetch and render, no client avatar state update.
- Fix: Synchronize changed avatar in app shell/account menu after save.

## G2-19-030-035  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:59 — non-TPO role with login user type returns null.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:38-40 — redirects unauthorized to dashboard.
- Fix: Match secure unauthorized fallback route with no data flash.

## G2-19-030-038  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:59-60 — phone/email not self-editable because login identifiers.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:117-123 — generic admin-owned account, does not expose phone/email.
- Fix: Keep contact data read-only, preserve why in source UI.

## G2-19-030-042  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:108-116 — partial refresh failure retains previous userDetails and warning with Retry.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:42-44 — SSR getOwnTpoProfile error boundary replaces page; no retained cache.
- Fix: Restore stale-on-refresh only within same actor scope.

## G2-19-030-045  [P2] MISSING  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:28-30 — old owned R2 image removed after replacement (best effort).
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — no old asset deletion because no edit.
- Fix: Add safe cleanup after final image commit.

## G2-19-030-047  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:63-75,101-118 — scroll-container and PageShell/learn-profile-content classes.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:45-124 — max width/main spacing, responsive sm two-column data grid.
- Fix: Clone legacy canvas widths/paddings and one-column card.

## G2-19-030-048  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/userInfo.js:98-106 — 120px square avatar with editable pencil touch target.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:45-124 — no avatar; field grid collapses to one column on phone.
- Fix: Reintroduce 120px photo and accessible upload target on mobile.

## G2-19-030-050  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/userInfo.js:99-106 — avatar image alt FirstName's profile photo; upload pencil.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:59-114 — no image alt or focusable edit.
- Fix: Add descriptive alt, keyboard-operable edit control.

## G2-19-030-052  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:67-68,104-106 — Profile / How students and recruiters see you in the placement workspace.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:47-48 — Profile / Your signed-in college membership and available faculty-backed profile information.
- Fix: Use exact subtitle from legacy.

## G2-19-030-053  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:50-61 — How students and recruiters see you; Name, Role, Department, Phone, Email; Your phone and email are how you log in...
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:63-123 — Account details, Display name, College, College code, Membership status, Roles in this college and different note.
- Fix: Restore visible headings/labels/help text; distinguish intentional new fields.

## G2-19-030-055  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:108-116 — nonblocking refresh while stale data remains.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:11,42-44 — dynamic SSR, full page refetch on navigation.
- Fix: Support nonblocking refetch without scope leak.

## G2-19-030-058  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyProfileServiceImpl.java:116-130 — updates image only if nonblank HTTPS URL; empty input retains image.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:117-123 — no image mutation or clear option.
- Fix: Define remove-photo behavior without untrusted URLs.

## G2-19-030-001  [P3] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:18-29,59 — /tpo/profile route, active Redux sidebar menu profile.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:32-40 and src/components/shell/college-account-copy.ts:23-25 — /tpo/profile, account menu My Account link.
- Fix: Verify sidebar active row and account menu treatment match source.

## G2-19-030-013  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:52 — blank Name placeholder '-'.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:26 — generic Not provided for every blank field.
- Fix: Use '-' only for Name, Not set for Department/Phone/Email.

## G2-19-030-014  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:54-56 — blank Department, Phone, Email each Not set.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:26 — Not provided.
- Fix: Restore Not set placeholder for source fields.

## G2-19-030-049  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:65-70 — ListingPageHeader ariaLabel Profile overview.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:46-55 — PageHeader no explicit Profile overview aria label.
- Fix: Align labeled landmark.

## G2-19-030-051  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:115 — content aria-busy during soft refresh.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:59-124 — no soft refresh/aria-busy state.
- Fix: Restore busy announcement on same-scope refresh.
