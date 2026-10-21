# Work packet (wave 2): edit src/components/admin/admin-dashboard-actions.tsx

34 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/college-admin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-004  [P2] GAP  facet F01  effort S
- Legacy: Global second shortcut Feature controls /superadmin/features `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:25-30`
- vNext now: New metric row Departments/People and global links relegated beneath metrics `src/app/(authenticated)/dashboard/page.tsx:134-165` `src/components/admin/admin-dashboard-actions.tsx:97-115`
- Fix: Restore Feature controls as second prominent shortcut

## G2-10-005-005  [P2] GAP  facet F01  effort S
- Legacy: Global third shortcut Activity log /superadmin/audit `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:31-36`
- vNext now: New global quick links are below metric area; no top Activity log card `src/app/(authenticated)/dashboard/page.tsx:120-165` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Position Activity log as third global hero card

## G2-10-005-006  [P2] GAP  facet F01  effort S
- Legacy: Global fourth shortcut Recruiter accounts /superadmin/recruiters `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:37-42`
- vNext now: New top metric People points /admin/people; recruiter shortcut not in top metrics `src/app/(authenticated)/dashboard/page.tsx:143-151` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Restore Recruiter accounts fourth global shortcut and mapped href

## G2-10-005-009  [P2] GAP  facet F02  effort S
- Legacy: Global platform hero uses eyebrow + h2 + explanatory paragraph `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:49-55`
- vNext now: New is PageHeader followed by stat grid, and separate platform quick links with a shortened heading `src/app/(authenticated)/dashboard/page.tsx:113-153` `src/components/admin/admin-dashboard-actions.tsx:98-113`
- Fix: Render the original hero eyebrow, large title and paragraph together above cards

## G2-10-005-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy global links are hoverable Ant Card with icon tile copy and RightOutlined `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:57-69`
- vNext now: New ActionLink is bordered text-only rectangle subtitle and no icon or arrow `src/components/admin/admin-dashboard-actions.tsx:11-43` `src/components/admin/admin-dashboard-actions.tsx:108-111`
- Fix: Match legacy icon-arrow card anatomy and hover elevation

## G2-10-005-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy global quick actions grid uses xs24 sm12 two columns `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:57-72`
- vNext now: New grid uses min768 two columns and lg four `src/components/admin/admin-dashboard-actions.tsx:108-113`
- Fix: Match old two-column threshold at 576px and preserve two across wide global page

## G2-10-005-013  [P2] GAP  facet F03  effort M
- Legacy: Scoped quick action cards have color-coded 28px icons and centered 24px padding `docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:9-26` `docs/design/legacy-styles/pages___admin-dashboard.scss:78-111`
- vNext now: New ActionLink has 16px padding and text-only label plus optional subtitle `src/components/admin/admin-dashboard-actions.tsx:11-43` `src/components/admin/admin-dashboard-actions.tsx:118-130`
- Fix: Use legacy color-mapped icons, 24px desktop padding, center text

## G2-10-005-014  [P2] GAP  facet F03  effort S
- Legacy: Scoped quick action heading Quick Actions `docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:3-7`
- vNext now: New heading Selected college quick actions `src/components/admin/admin-dashboard-actions.tsx:118-123`
- Fix: Restore exact Quick Actions heading

## G2-10-005-018  [P2] GAP  facet F04  effort S
- Legacy: Global four links include explanatory subtitle for each `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:18-43`
- vNext now: New global ActionLink uses descriptive subtitle or generic Open this workspace from navigation model `src/components/admin/admin-dashboard-actions.tsx:11-43` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Use exact old descriptions for the four core shortcuts

## G2-10-005-050  [P2] GAP  facet F16  effort S
- Legacy: Old scoped QuickActions grid xs1 sm2 md3 lg4 `docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:7-28`
- vNext now: New shortcut grid two at 768 and three at lg `src/components/admin/admin-dashboard-actions.tsx:118-129`
- Fix: Restore four-across from lg with responsive icon and label

## G2-10-005-051  [P2] GAP  facet F16  effort M
- Legacy: Old quick action desktop padding24 mobile16, phone horizontal layout and icon24 `docs/design/legacy-styles/pages___admin-dashboard.scss:78-111` `docs/design/legacy-styles/pages___admin-dashboard.scss:306-326`
- vNext now: New ActionLink padding16 in all breakpoints with no icon `src/components/admin/admin-dashboard-actions.tsx:11-43`
- Fix: Reproduce old mobile horizontal icon-label affordance and desktop centered version

## G2-10-005-056  [P2] GAP  facet F18  effort S
- Legacy: Global eyebrow Platform operations and title Choose the level you need to operate at. `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:49-53`
- vNext now: New only shortcut section repeats title later; Header title Overview `src/components/admin/admin-dashboard-actions.tsx:98-107` `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Restore Platform operations eyebrow and main hero h2 above cards

## G2-10-005-057  [P2] GAP  facet F18  effort S
- Legacy: Global subtitle Start with a platform-wide control below, or select a college in the header... `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:51-54`
- vNext now: New subtitle Select a college in the top bar for detailed metrics or use... `src/components/admin/admin-dashboard-actions.tsx:101-107`
- Fix: Use exact old platform introduction text

## G2-9-005-012  [P2] GAP  facet F03  effort M
- Legacy: Quick-action hover cards have colored icon tile and label (`docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:9-33`)
- vNext now: Text links in bordered cards and subtitle (`src/components/admin/admin-dashboard-actions.tsx:6-42`)
- Fix: Restore icon tile and color variables from legacy config.

## G2-9-005-013  [P2] GAP  facet F03  effort M
- Legacy: Setup Guide numbered badge/icon and arrow on every step card (`docs/legacy-source/frontend/src/components/admin/dashboard/SetupGuide.js:13-60`)
- vNext now: ActionLink card with title+subtitle only (`src/components/admin/admin-dashboard-actions.tsx:58-89`)
- Fix: Render numbered step, icon and arrow with phase color.

## G2-9-005-034  [P2] GAP  facet F09  effort M
- Legacy: Ant Collapse labeled Setting up a new college? Step-by-step setup guide (`docs/legacy-source/frontend/src/components/admin/dashboard/AdminDashboardView.js:66-77`)
- vNext now: Details summary uses COLLEGE_SETUP_GUIDE_COPY.heading instead of collapse label (`src/components/admin/admin-dashboard-actions.tsx:54-58`)
- Fix: Use full legacy collapse label; inside section still Setup Guide heading.

## G2-9-005-054  [P2] GAP  facet F16  effort M
- Legacy: Quick actions xs24 sm12 md8 lg6 (`docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:9-32`)
- vNext now: 1 mobile/2 tablet/3 lg/4 xl (`src/components/admin/admin-dashboard-actions.tsx:38-45`)
- Fix: Match old md three, lg four layout.

## G2-9-005-059  [P2] GAP  facet F18  effort M
- Legacy: Full collapsed label Setting up a new college? Step-by-step setup guide (`docs/legacy-source/frontend/src/components/admin/dashboard/AdminDashboardView.js:67-76`)
- vNext now: Summary Setup Guide (Follow in Order) (`src/components/admin/admin-dashboard-actions.tsx:54-60`)
- Fix: Restore exact label.

## G2-9-035-004  [P2] GAP  facet F01  effort S
- Legacy: Global second shortcut Feature controls /superadmin/features `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:25-30`
- vNext now: New metric row Departments/People and global links relegated beneath metrics `src/app/(authenticated)/dashboard/page.tsx:134-165` `src/components/admin/admin-dashboard-actions.tsx:97-115`
- Fix: Restore Feature controls as second prominent shortcut

## G2-9-035-005  [P2] GAP  facet F01  effort S
- Legacy: Global third shortcut Activity log /superadmin/audit `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:31-36`
- vNext now: New global quick links are below metric area; no top Activity log card `src/app/(authenticated)/dashboard/page.tsx:120-165` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Position Activity log as third global hero card

## G2-9-035-006  [P2] GAP  facet F01  effort S
- Legacy: Global fourth shortcut Recruiter accounts /superadmin/recruiters `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:37-42`
- vNext now: New top metric People points /admin/people; recruiter shortcut not in top metrics `src/app/(authenticated)/dashboard/page.tsx:143-151` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Restore Recruiter accounts fourth global shortcut and mapped href

## G2-9-035-009  [P2] GAP  facet F02  effort S
- Legacy: Global platform hero uses eyebrow + h2 + explanatory paragraph `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:49-55`
- vNext now: New is PageHeader followed by stat grid, and separate platform quick links with a shortened heading `src/app/(authenticated)/dashboard/page.tsx:113-153` `src/components/admin/admin-dashboard-actions.tsx:98-113`
- Fix: Render the original hero eyebrow, large title and paragraph together above cards

## G2-9-035-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy global links are hoverable Ant Card with icon tile copy and RightOutlined `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:57-69`
- vNext now: New ActionLink is bordered text-only rectangle subtitle and no icon or arrow `src/components/admin/admin-dashboard-actions.tsx:11-43` `src/components/admin/admin-dashboard-actions.tsx:108-111`
- Fix: Match legacy icon-arrow card anatomy and hover elevation

## G2-9-035-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy global quick actions grid uses xs24 sm12 two columns `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:57-72`
- vNext now: New grid uses min768 two columns and lg four `src/components/admin/admin-dashboard-actions.tsx:108-113`
- Fix: Match old two-column threshold at 576px and preserve two across wide global page

## G2-9-035-013  [P2] GAP  facet F03  effort M
- Legacy: Scoped quick action cards have color-coded 28px icons and centered 24px padding `docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:9-26` `docs/design/legacy-styles/pages___admin-dashboard.scss:78-111`
- vNext now: New ActionLink has 16px padding and text-only label plus optional subtitle `src/components/admin/admin-dashboard-actions.tsx:11-43` `src/components/admin/admin-dashboard-actions.tsx:118-130`
- Fix: Use legacy color-mapped icons, 24px desktop padding, center text

## G2-9-035-014  [P2] GAP  facet F03  effort S
- Legacy: Scoped quick action heading Quick Actions `docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:3-7`
- vNext now: New heading Selected college quick actions `src/components/admin/admin-dashboard-actions.tsx:118-123`
- Fix: Restore exact Quick Actions heading

## G2-9-035-018  [P2] GAP  facet F04  effort S
- Legacy: Global four links include explanatory subtitle for each `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:18-43`
- vNext now: New global ActionLink uses descriptive subtitle or generic Open this workspace from navigation model `src/components/admin/admin-dashboard-actions.tsx:11-43` `src/components/admin/admin-dashboard-actions.tsx:98-114`
- Fix: Use exact old descriptions for the four core shortcuts

## G2-9-035-050  [P2] GAP  facet F16  effort S
- Legacy: Old scoped QuickActions grid xs1 sm2 md3 lg4 `docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:7-28`
- vNext now: New shortcut grid two at 768 and three at lg `src/components/admin/admin-dashboard-actions.tsx:118-129`
- Fix: Restore four-across from lg with responsive icon and label

## G2-9-035-051  [P2] GAP  facet F16  effort M
- Legacy: Old quick action desktop padding24 mobile16, phone horizontal layout and icon24 `docs/design/legacy-styles/pages___admin-dashboard.scss:78-111` `docs/design/legacy-styles/pages___admin-dashboard.scss:306-326`
- vNext now: New ActionLink padding16 in all breakpoints with no icon `src/components/admin/admin-dashboard-actions.tsx:11-43`
- Fix: Reproduce old mobile horizontal icon-label affordance and desktop centered version

## G2-9-035-056  [P2] GAP  facet F18  effort S
- Legacy: Global eyebrow Platform operations and title Choose the level you need to operate at. `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:49-53`
- vNext now: New only shortcut section repeats title later; Header title Overview `src/components/admin/admin-dashboard-actions.tsx:98-107` `src/app/(authenticated)/dashboard/page.tsx:113-119`
- Fix: Restore Platform operations eyebrow and main hero h2 above cards

## G2-9-035-057  [P2] GAP  facet F18  effort S
- Legacy: Global subtitle Start with a platform-wide control below, or select a college in the header... `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:51-54`
- vNext now: New subtitle Select a college in the top bar for detailed metrics or use... `src/components/admin/admin-dashboard-actions.tsx:101-107`
- Fix: Use exact old platform introduction text

## G2-9-035-109  [P2] GAP  facet F16  effort S
- Legacy: Global cards: xs24 sm12 means two columns at ~576px `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:57-72`
- vNext now: New global links columns turn on at 768 and four at lg `src/components/admin/admin-dashboard-actions.tsx:108-113`
- Fix: Use legacy 576 breakpoint and maximum two columns.

## G2-9-035-110  [P2] GAP  facet F16  effort S
- Legacy: QuickActions: xs24 sm12 md8 lg6 = 1/2/3/4 cards `docs/legacy-source/frontend/src/components/admin/dashboard/QuickActionsGrid.js:7-28`
- vNext now: New min768 two/lg three `src/components/admin/admin-dashboard-actions.tsx:118-130`
- Fix: Restore responsive 1/2/3/4 grid.

## G2-9-035-112  [P2] GAP  facet F18  effort S
- Legacy: Global hero exact 'Start with a platform-wide control below...' `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:50-55`
- vNext now: New explanatory paragraph 'Select a college in the top bar...' `src/components/admin/admin-dashboard-actions.tsx:104-107`
- Fix: Restore original paragraph punctuation/casing.
