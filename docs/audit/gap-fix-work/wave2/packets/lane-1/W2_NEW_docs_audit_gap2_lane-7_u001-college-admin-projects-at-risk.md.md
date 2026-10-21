# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md

29 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md

## G2-7-001-003  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:181-183: Open navigates to Summary with `from=at-risk` and `reason`.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:118-125,159-161: title link drops context; separate Open retains it.
- Fix: Add origin and encoded reasons to title link.

## G2-7-001-004  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:209-212: review action goes to `/projects/submissions?tab=submitted&projectId=...`.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:167-169: goes to single-workspace delivery.
- Fix: Restore deep link to filtered submission dashboard or document intended change.

## G2-7-001-006  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:324-349: three Statistic Cards in a Row.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:84-94: three small FilterChipLinks.
- Fix: Implement three full-size statistic-card quick filters.

## G2-7-001-007  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:351-419: single Card with title, search/export controls and Ant table.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:95-193: separate filter form, list toolbar, article list and pagination.
- Fix: Restore ordered report sections and table surface.

## G2-7-001-009  [P2] MISSING  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:397-403: blue closable tag for active quick filter.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:84-94: selected chip link with no close button.
- Fix: Provide close action that clears just riskBucket.

## G2-7-001-012  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:220-223; components/admin/projects/adminProjectUtils.js:64-75: title/name/projectTitle fallback with `Workspace` placeholder.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:127: raw project.title.
- Fix: Match fallback/placeholder display.

## G2-7-001-013  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:226-228: mentor shown via primary role-aware FACULTY member or project.mentor; absent `—`.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:130-133: `Mentor: name` or `No primary mentor`.
- Fix: Render Mentor field with em dash and matching selection.

## G2-7-001-014  [P2] MISSING  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:231-233: actual workspace Status tag via statusColor/statusLabel.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:141-145: only Risk/Watch status badge.
- Fix: Add actual workspace status tag separately from severity.

## G2-7-001-015  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:236-243; components/admin/projects/adminProjectUtils.js:290-300: severity `1 signal`/`2 signals`/`3 signals`, gold/orange/red.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:142-145: binary Risk/Watch.
- Fix: Display exact N-signals severity labels and tier colors.

## G2-7-001-017  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:259-266: Inactive `—` unless stalled; then Today/Nd colored by days.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:151-157: always prints integer `N day(s)`.
- Fix: Only show age for stalled; use legacy short labels/color.

## G2-7-001-018  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:269-272: independent Blocker column or `—`.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:147-150: conditional banner, no missing-value slot.
- Fix: Restore blocker field in its own table column.

## G2-7-001-020  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:221-223: sortable Workspace header.
- vNext now: V/components/projects/project-admin-collection-controls.tsx:105-114: sorting in separate select.
- Fix: Add clickable sortable Workspace header.

## G2-7-001-022  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:259-262: sortable Inactive column.
- vNext now: V/components/projects/project-admin-collection-controls.tsx:106-113: sort select only.
- Fix: Render header control for inactivity sorting.

## G2-7-001-025  [P2] GAP  facet F05  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:164: filter/search immediately resets page to 0.
- vNext now: V/components/projects/project-admin-collection-controls.tsx:73-85,151-163: GET form applies only on click; page may be preserved.
- Fix: Reset page on criteria change and align interaction timing.

## G2-7-001-027  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:355-363: live clearable search input `Search workspace title or ID`, prefix search icon.
- vNext now: V/components/projects/project-admin-collection-controls.tsx:77-85: labelled form input `Workspace title or slug`.
- Fix: Restore exact placeholder/icon/clearable behavior.

## G2-7-001-028  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:166-168: clicking active signal toggles it OFF.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:85-93: clicking active link retains selected riskBucket.
- Fix: Make active filter click clear selection.

## G2-7-001-046  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:413-417: two different no-results messages for empty report vs unmatched search.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:106-109: single `No at-risk projects` empty state.
- Fix: Differentiate no signals, search mismatch, and out-of-range page.

## G2-7-001-052  [P2] GAP  facet F16  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:324-349: statistic cards xs=24/sm=12/md=8.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:84-94: flex chips at all widths.
- Fix: Restore 1/2/3 responsive statistic grid.

## G2-7-001-053  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:405-410: table x=max-content horizontal scroll.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:110-183: responsive stacked list.
- Fix: Use horizontally scrollable eight-column table on phone.

## G2-7-001-056  [P2] GAP  facet F17  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:218-278: accessible sortable table headers.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:110-183: no table column headers.
- Fix: Expose aria-sort, keyboard sorting, table headers.

## G2-7-001-057  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:298-301: dynamic `N workspace(s) need attention... Reason counts cover the whole college.`
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:75-76: static `Workspaces with no recent activity...`.
- Fix: Restore dynamic subtitle and exact singular/plural.

## G2-7-001-059  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:285-286: `Select a college to continue`, `Choose a college in the header above to see its at-risk projects.`
- vNext now: V/components/projects/project-admin-missing-college.tsx:7-10: `No college selected`, generic text.
- Fix: Restore exact no-college messages.

## G2-7-001-068  [P2] GAP  facet F22  effort S
- Legacy: LBE/dto/projects/ProjectWorkspaceDTO.java:8-33: numeric ID, mentor fallback, status, blocker, lastActivityAt, resolvedMembers.
- vNext now: V/modules/projects/admin-insights-service.ts:603-615,648-715: UUID and separate primary mentor, blocker summary, derived reasons.
- Fix: Provide display adapter for columns and legacy status.

## G2-7-001-070  [P2] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:236-242: N-signal severity and full status.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:142-145: condensed Risk/Watch.
- Fix: Restore both original visual signals.

## G2-7-001-008  [P3] MISSING  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:38-40: Stalled/Active blocker/Pending review use clock/warning/file icons.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:85-93: chip text/count only.
- Fix: Restore icons in statistic cards.

## G2-7-001-010  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:364-393: download icon button text `Export CSV`.
- vNext now: V/components/projects/project-at-risk-page-export.tsx:25-27: `Export this page` without icon.
- Fix: Restore download icon and exact action label.

## G2-7-001-011  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:195-212: Edit icon reassignment and FileText icon review actions.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:162-169: plain text links.
- Fix: Apply corresponding action icons.

## G2-7-001-016  [P3] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:246-255: colored risk-reason tags use row's severity hue.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:171-180: all warning badges.
- Fix: Color reason labels according to severity.

## G2-7-001-064  [P3] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:181-183: encodeURIComponent of project identifier and reason.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:118-125,159-161: raw UUID slug in title link; reason encoded in Open.
- Fix: Encode all dynamic route segments consistently.
