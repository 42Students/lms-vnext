# Work packet (wave 2): edit src/components/admin/managed-college-subdomain.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-college-subdomain.md

## G2-9-031-004  [P2] GAP  facet F02  effort M
- Legacy: Small Web address Card, Reload in header, helper, live banner, input and actions `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:120-160`
- vNext now: Large header, managed section, custom-domain disclosure, no Card framing `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-42` `src/components/admin/managed-college-subdomain.tsx:50-91`
- Fix: Restore compact Card structure/spacing.

## G2-9-031-005  [P2] GAP  facet F02  effort S
- Legacy: Explains address works immediately with HTTPS once allotted `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:128-130`
- vNext now: Warns routed only when wildcard DNS/TLS ready `src/components/admin/managed-college-subdomain.tsx:75-76`
- Fix: Use accurate readiness-aware legacy explanation.

## G2-9-031-006  [P2] GAP  facet F02  effort M
- Legacy: Green bordered success callout Live at with clickable external hostname `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:132-138`
- vNext now: Current hostname in plain definition list, no green live badge/link `src/components/admin/managed-college-subdomain.tsx:55-58`
- Fix: Render Live at banner and safe https external link.

## G2-9-031-007  [P2] GAP  facet F02  effort S
- Legacy: Input and Allot/Change/Remove same horizontal row, max-width560 `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:140-158`
- vNext now: Input with suffix and action row below it `src/components/admin/managed-college-subdomain.tsx:59-75`
- Fix: Align actions with input at desktop; wrap mobile.

## G2-9-031-008  [P2] MISSING  facet F03  effort S
- Legacy: Small Reload button with ReloadOutlined icon `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:125-126`
- vNext now: No explicit Reload button, relies on page navigation/refresh `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-42` `src/components/admin/managed-college-subdomain.tsx:50-91`
- Fix: Add Reload with old wording and loading indicator.

## G2-9-031-009  [P2] GAP  facet F03  effort S
- Legacy: Primary Allot or Change, red Remove button `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:153-156`
- vNext now: Allot/Change, secondary gray Remove `src/components/admin/managed-college-subdomain.tsx:69-75`
- Fix: Restore Remove danger styling.

## G2-9-031-010  [P2] GAP  facet F03  effort S
- Legacy: Green CheckCircleFilled and LinkOutlined on current host `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:132-138`
- vNext now: Unadorned Current definition `src/components/admin/managed-college-subdomain.tsx:55-58`
- Fix: Add status/link icons to live callout.

## G2-9-031-011  [P2] GAP  facet F03  effort M
- Legacy: Only change to existing host triggers confirmation; initial allot saves directly `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:80-90`
- vNext now: Both Allot and Change trigger ConfirmDialog `src/components/admin/managed-college-subdomain.tsx:69-83`
- Fix: Keep initial allot immediate, confirm moving a live address.

## G2-9-031-014  [P2] MISSING  facet F04  effort S
- Legacy: User can click live https current host in new tab `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:132-138`
- vNext now: Current text not link `src/components/admin/managed-college-subdomain.tsx:55-58`
- Fix: Restore safe link target=_blank rel=noopener noreferrer.

## G2-9-031-017  [P2] GAP  facet F05  effort S
- Legacy: On typing strips invalid characters and lowercases immediately `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:141-150`
- vNext now: Keeps raw input, normalizes only for validation/save `src/components/admin/managed-college-subdomain.tsx:61-64`
- Fix: Normalize to lowercase and strip bad characters as typed.

## G2-9-031-018  [P2] GAP  facet F05  effort S
- Legacy: Placeholder kluniversity and addonAfter .baseDomain `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:146-149`
- vNext now: No placeholder, suffix rendered separate span `src/components/admin/managed-college-subdomain.tsx:59-67`
- Fix: Restore exact placeholder/suffix inside input addon.

## G2-9-031-019  [P2] GAP  facet F05  effort S
- Legacy: Button disabled if no dirty change, empty or loadError `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:153-156`
- vNext now: Allot/Change enabled for unchanged host if label nonblank `src/components/admin/managed-college-subdomain.tsx:69-74`
- Fix: Disable unchanged host and loading failure.

## G2-9-031-021  [P2] GAP  facet F06  effort S
- Legacy: Subdomain Input aria label Subdomain, maxLength30 `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:141-152`
- vNext now: Label Subdomain, maxLength63, no placeholder `src/components/admin/managed-college-subdomain.tsx:59-65`
- Fix: Apply old max30 and placeholder.

## G2-9-031-022  [P2] GAP  facet F06  effort S
- Legacy: Input and addon in single Ant control `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:140-152`
- vNext now: Flex Input plus separate suffix `src/components/admin/managed-college-subdomain.tsx:60-67`
- Fix: Use addonAfter UI under shared theme.

## G2-9-031-023  [P2] GAP  facet F06  effort S
- Legacy: Changing live host asks Move this college to HOST? `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:81-87`
- vNext now: Change this college's live web address? generic title `src/components/admin/managed-college-subdomain.tsx:78-87`
- Fix: Include proposed full host in title.

## G2-9-031-024  [P2] GAP  facet F06  effort S
- Legacy: Remove dialog title includes current host `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:93-100`
- vNext now: Remove this managed web address? title, current shown in body `src/components/admin/managed-college-subdomain.tsx:78-85`
- Fix: Use current host in title.

## G2-9-031-034  [P2] GAP  facet F09  effort S
- Legacy: Move confirm Move / Keep current `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:83-86`
- vNext now: Change / default Cancel `src/components/admin/managed-college-subdomain.tsx:78-83`
- Fix: Use Move and Keep current.

## G2-9-031-042  [P2] GAP  facet F12  effort S
- Legacy: 3–30 letters/digits/hyphen with fixed ends `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:10,55-59`
- vNext now: 1–63 UX pattern + shared available label checks `src/components/admin/managed-college-subdomain.tsx:15-16` `src/modules/tenant-domains/managed-subdomain-model.ts:5-14`
- Fix: Enforce exact bounds or owner approve loosening.

## G2-9-031-047  [P2] GAP  facet F13  effort S
- Legacy: Reload rescans current address `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:28-47`
- vNext now: Rerender from initial on route refresh; no explicit Reload `src/components/admin/managed-college-subdomain.tsx:17-21`
- Fix: Provide Reload and reset stale state.

## G2-9-031-048  [P2] MISSING  facet F14  effort S
- Legacy: Current full address is clickable safe external HTTPS link `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:132-137`
- vNext now: No live host link `src/components/admin/managed-college-subdomain.tsx:55-58`
- Fix: Restore target blank noopener link.

## G2-9-031-051  [P2] GAP  facet F16  effort M
- Legacy: Small Card, toolbar maxwidth560, inline host badge `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:120-160`
- vNext now: Responsive two-column definition list and separate button row `src/components/admin/managed-college-subdomain.tsx:50-91`
- Fix: Reproduce compact desktop card, keep mobile wraps.

## G2-9-031-054  [P2] GAP  facet F18  effort S
- Legacy: Title Web address, Reload, helper It works straight away, with HTTPS `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:120-140`
- vNext now: Title Web address · Managed subdomain, readiness warning `src/components/admin/managed-college-subdomain.tsx:50-57`
- Fix: Match main title and concise helper while showing readiness caveat.

## G2-9-031-056  [P2] GAP  facet F18  effort S
- Legacy: Live at and external host link label `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:132-138`
- vNext now: Platform domain and Current labels `src/components/admin/managed-college-subdomain.tsx:55-58`
- Fix: Render exact Live at copy.

## G2-9-031-060  [P2] GAP  facet F20  effort M
- Legacy: dirty if value nonempty and differs from current; parent notified `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:23-25`
- vNext now: Label change state but no parent dirty callback `src/components/admin/managed-college-subdomain.tsx:15-21`
- Fix: Add unsaved-change warning before leaving page.

## G2-9-031-066  [P2] GAP  facet F23  effort S
- Legacy: Legacy shows current host live green callout `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:132-138`
- vNext now: New Current DL and ready warnings without green callout `src/components/admin/managed-college-subdomain.tsx:55-58`
- Fix: Restore visual live badge to match legacy.

## G2-9-031-055  [P3] GAP  facet F18  effort S
- Legacy: Placeholder kluniversity and Allot/Change/Remove exact copy `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:146-156`
- vNext now: Allot/Change/Remove preserved but placeholder absent `src/components/admin/managed-college-subdomain.tsx:59-75`
- Fix: Restore placeholder.
