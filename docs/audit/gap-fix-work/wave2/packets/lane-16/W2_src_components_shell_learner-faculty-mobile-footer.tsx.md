# Work packet (wave 2): edit src/components/shell/learner-faculty-mobile-footer.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:117-149`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:88-112`
- Fix: Audit teacher mobile footer exact Courses/Quizzes/Assignments/Profile items against chosen `navigation` (vNext dynamically picks from sidebar).

## G2-3-033-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:69-111`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:88-112`
- Fix: Audit learner mobile icon/label order Courses, Alerts, Classes, Placements, Projects, Profile against dynamically filtered vNext items.

## G2-3-033-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:81-86`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:99-107`
- Fix: Legacy alerts Badge renders unread capped 99+, vNext counters and badge display may use different cap/fallback.

## G2-3-033-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:30-62`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:88-112`
- Fix: Legacy bottom nav includes five college-admin icon destinations; vNext generated footer uses scopedShellNavigation; verify count/order at 320px.

## G2-3-033-023  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:152-187`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:88-112`
- Fix: Legacy TPO/recruiter footer role-specific array and More destination; vNext maps generic nav, compare exact filtering/order and final overflow.

## G2-3-033-040  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:30-149`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:88-112`
- Fix: Legacy footer shows role-specific destinations and suppresses inaccessible menu options; vNext nav filtered via scopedShellNavigation. Verify audience route matrix.

## G2-3-033-042  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:81-86`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:70-77`
- Fix: Ensure per-role alert badge respects tenant/membership privacy when user switches workspace; legacy footer uses account-specific unread source.

## G2-3-033-047  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:81-86`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:70-77`
- Fix: Legacy unread badge zero/empty via AntD overflowCount, vNext hidden if unread null/zero. Check offline/count zero.

## G2-3-033-071  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:81-86`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:59-78`
- Fix: Race when active role/college changes during badge fetch: vNext must abort/discard old count and avoid cross-tenant badge.

## G2-3-033-014  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:130-142`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:92-107`
- Fix: Legacy teacher icon paths quiz.svg and assignment active.svg; vNext item.icon/activeIcon dynamic, ensure identical 24px assets.

## G2-3-033-064  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:69-111`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:92-107`
- Fix: Legacy learner mobile labels Alerts and Classes, vNext item.visibleLabel from sidebar may differ. Compare each label.

## G2-3-033-065  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:117-149`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:92-107`
- Fix: Legacy teacher mobile label Quizzes/Assignments vs vNext nav sidebar wording; confirm no 'All Quizzes' leakage.
