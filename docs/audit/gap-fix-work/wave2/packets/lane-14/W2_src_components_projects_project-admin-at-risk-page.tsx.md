# Work packet (wave 2): edit src/components/projects/project-admin-at-risk-page.tsx

37 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u029-superadmin-at-risk.md

## G2-7-029-006  [P2] GAP  facet F02  effort S
- Legacy: superadmin/projects/at-risk/index.js:324-341 page header title and dynamic count subtitle
- vNext now: project-admin-at-risk-page.tsx:73-78 static subtitle regardless of total count
- Fix: Use dynamic N workspaces need attention when count >0

## G2-7-029-007  [P2] GAP  facet F02  effort M
- Legacy: superadmin/projects/at-risk/index.js:342-346 error alert then skeleton
- vNext now: project-admin-at-risk-page.tsx:58-68 full ErrorState and no in-page skeleton
- Fix: Match inline error placement and eight-row skeleton

## G2-7-029-008  [P2] GAP  facet F02  effort M
- Legacy: superadmin/projects/at-risk/index.js:358-383 three large Statistic Cards quick filters
- vNext now: project-admin-at-risk-page.tsx:84-94 three compact FilterChipLinks
- Fix: Render three full-width responsive statistic cards with icons/counts

## G2-7-029-009  [P2] GAP  facet F02  effort M
- Legacy: superadmin/projects/at-risk/index.js:385-436 titled Card At-risk workspaces with search and Export CSV in extra row
- vNext now: project-admin-at-risk-page.tsx:95-104 FilterBar and ListToolbar with export outside list
- Fix: Group title/search/export into one legacy Card head

## G2-7-029-010  [P2] GAP  facet F02  effort M
- Legacy: superadmin/projects/at-risk/index.js:444-459 AntD Table within Card
- vNext now: project-admin-at-risk-page.tsx:110-185 stacked article rows and badges
- Fix: Use eight-column table with horizontal scroll

## G2-7-029-011  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/at-risk/index.js:55-58 quick filters icons ClockCircle/Warning/FileText
- vNext now: project-admin-at-risk-page.tsx:84-94 plain chips with count, no icons
- Fix: Restore type-specific icons and count typography

## G2-7-029-012  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/at-risk/index.js:363-379 quick Card selected teal border/shadow
- vNext now: project-admin-at-risk-page.tsx:89-93 selected chip style via FilterChipLink
- Fix: Match selected-card teal outline and hover/pressed state

## G2-7-029-013  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/at-risk/index.js:389-397 SearchOutlined input, placeholder Search workspace title or ID
- vNext now: project-admin-at-risk-page.tsx:95 ProjectAdminFilters generic Q search
- Fix: Use exact search placeholder, icon and allowClear

## G2-7-029-015  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/at-risk/index.js:437-443 active quick-filter blue closable Tag
- vNext now: project-admin-at-risk-page.tsx:84-94 selected FilterChipLink, no closable Tag
- Fix: Display removable selected filter below card head

## G2-7-029-016  [P2] GAP  facet F03  effort M
- Legacy: superadmin/projects/at-risk/index.js:253-275 severity gold/orange/red Tag and each reason same severity color
- vNext now: project-admin-at-risk-page.tsx:141-145 Watch/Risk warning/neutral and reasons warning badges
- Fix: Map severity levels and individual reason tones from legacy

## G2-7-029-017  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/at-risk/index.js:279-285 Inactive ageColor Tag Today/3d/7d
- vNext now: project-admin-at-risk-page.tsx:151-156 integer days string
- Fix: Restore colored age Tag with Today/nd and em dash if not stalled

## G2-7-029-018  [P2] GAP  facet F04  effort M
- Legacy: superadmin/projects/at-risk/index.js:237-246 name fallback title/name/projectTitle/templateTitle/course, mentor primary role fallback
- vNext now: project-admin-at-risk-page.tsx:127-133 title and mentorName or No primary mentor
- Fix: Match normaliseCollegeScopedName fallbacks and missing mentor em dash

## G2-7-029-019  [P2] MISSING  facet F04  effort M
- Legacy: superadmin/projects/at-risk/index.js:248-250 Status humanized Tag with statusColor
- vNext now: project-admin-at-risk-page.tsx:110-181 does not render project.status
- Fix: Show status as separate column with same status mapping

## G2-7-029-021  [P2] GAP  facet F04  effort S
- Legacy: superadmin/projects/at-risk/index.js:263-275 list all risk reason chips individually colored
- vNext now: project-admin-at-risk-page.tsx:171-179 reasons array warning badges
- Fix: Match per-reason labeling/color including Pending review

## G2-7-029-022  [P2] GAP  facet F04  effort S
- Legacy: superadmin/projects/at-risk/index.js:279-286 if not stalled Inactive em dash, otherwise ageLabel
- vNext now: project-admin-at-risk-page.tsx:151-156 prints Inactive N days for all at-risk reasons
- Fix: Only show age as stalled indicator in equivalent column

## G2-7-029-023  [P2] GAP  facet F04  effort S
- Legacy: superadmin/projects/at-risk/index.js:289-292 raw blocker textOrDash
- vNext now: project-admin-at-risk-page.tsx:147-150 blocker Banner only when value
- Fix: Display blocker field in its own table column with em dash fallback

## G2-7-029-024  [P2] GAP  facet F04  effort S
- Legacy: superadmin/projects/at-risk/index.js:330-334 dynamic summary N workspace(s) with signals
- vNext now: project-admin-at-risk-page.tsx:75-76 static statement
- Fix: Render total count with singular/plural and scope note

## G2-7-029-025  [P2] GAP  facet F05  effort M
- Legacy: superadmin/projects/at-risk/index.js:235-298 table columns Workspace, Mentor, Status, Severity, Risk reasons, Inactive, Blocker, Actions
- vNext now: project-admin-at-risk-page.tsx:110-185 cards with only title/mentor/activity/severity/blocker/inactive/actions
- Fix: Restore all eight columns/order and sorting affordances

## G2-7-029-032  [P2] GAP  facet F06  effort S
- Legacy: superadmin/projects/at-risk/index.js:67 quickFilter null, 183-185 toggles same card off
- vNext now: project-admin-at-risk-page.tsx:90-93 selected chip link always links to same riskBucket; no toggle-to-all behavior
- Fix: Make pressing active bucket clear risk filter

## G2-7-029-033  [P2] GAP  facet F06  effort M
- Legacy: superadmin/projects/at-risk/index.js:68 search default empty, 69-75 debounce300ms
- vNext now: project-admin-at-risk-page.tsx:95 ProjectAdminFilters submits GET, not guaranteed 300ms
- Fix: Match 300ms only server request, instant local refinement

## G2-7-029-034  [P2] GAP  facet F06  effort S
- Legacy: superadmin/projects/at-risk/index.js:391-397 search allowClear and icon
- vNext now: project-admin-at-risk-page.tsx:95 ProjectAdminFilters with generic search
- Fix: Restore allowClear and exact placeholder

## G2-7-029-035  [P2] GAP  facet F06  effort S
- Legacy: superadmin/projects/at-risk/index.js:438-442 closable quick filter clears current filter
- vNext now: project-admin-at-risk-page.tsx:84-94 chips without close affordance
- Fix: Add closable tag or equivalent Clear one filter

## G2-7-029-043  [P2] GAP  facet F09  effort M
- Legacy: superadmin/projects/at-risk/index.js:363-380 interactive card toggles filter and selected state; no modal
- vNext now: project-admin-at-risk-page.tsx:84-94 chip Link navigation, no modal
- Fix: Match keyboard activation and pressed semantics on card

## G2-7-029-044  [P2] GAP  facet F09  effort S
- Legacy: superadmin/projects/at-risk/index.js:437-443 closable active-filter Tag
- vNext now: project-admin-at-risk-page.tsx:84-94 no closable Tag
- Fix: Add dismiss filter control matching old Tag

## G2-7-029-049  [P2] GAP  facet F10  effort M
- Legacy: superadmin/projects/at-risk/index.js:227-229 Review submission routes superadmin/projects/submissions?tab=submitted&q=title
- vNext now: project-admin-at-risk-page.tsx:167-169 direct workspace delivery?from=at-risk
- Fix: Keep direct list-level submitted filter or document intentional deeper navigation

## G2-7-029-062  [P2] GAP  facet F13  effort M
- Legacy: superadmin/projects/at-risk/index.js:346-354 risk result skeleton and error suppresses empty
- vNext now: project-admin-at-risk-page.tsx:55-68 full-page error; otherwise immediate server result
- Fix: Provide same eight-row skeleton on navigation

## G2-7-029-063  [P2] GAP  facet F13  effort S
- Legacy: superadmin/projects/at-risk/index.js:453-456 two distinct no results texts
- vNext now: project-admin-at-risk-page.tsx:106-108 one empty message
- Fix: Restore filtered vs no-college-risk distinctions

## G2-7-029-070  [P2] GAP  facet F16  effort M
- Legacy: superadmin/projects/at-risk/index.js:358-382 Col xs24 sm12 md8 for statistic cards
- vNext now: project-admin-at-risk-page.tsx:84-94 wrapping chips not three equal cards
- Fix: Restore 1/2/3 column card breakpoints and sizes

## G2-7-029-071  [P2] GAP  facet F16  effort M
- Legacy: superadmin/projects/at-risk/index.js:445-450 AntD table scroll x=max-content
- vNext now: project-admin-at-risk-page.tsx:110-181 flexible article rows, no table scroll
- Fix: Use horizontal scroll with sticky accessible headings on narrow widths

## G2-7-029-072  [P2] GAP  facet F16  effort S
- Legacy: superadmin/projects/at-risk/index.js:385-436 Space wraps inline search/export toolbar
- vNext now: project-admin-at-risk-page.tsx:95-104 separate filter and toolbar
- Fix: Match wrapping in card header and search width

## G2-7-029-073  [P2] GAP  facet F17  effort M
- Legacy: superadmin/projects/at-risk/index.js:364-375 Card role=button tabIndex=0 aria-pressed supports Enter/Space
- vNext now: project-admin-at-risk-page.tsx:90-93 FilterChipLink accessible Link
- Fix: Match pressed-toggle semantics and keyboard clear on same option

## G2-7-029-074  [P2] GAP  facet F17  effort M
- Legacy: superadmin/projects/at-risk/index.js:445-450 semantic AntD Table sortable headings
- vNext now: project-admin-at-risk-page.tsx:110-185 article list no table headings
- Fix: Restore column headers/aria-sort when table rebuilt

## G2-7-029-075  [P2] GAP  facet F17  effort S
- Legacy: superadmin/projects/at-risk/index.js:390-393 Search workspace title or ID aria-label
- vNext now: project-admin-at-risk-page.tsx:95 uses generic ProjectAdminFilters
- Fix: Restore exact accessible search label

## G2-7-029-076  [P2] GAP  facet F18  effort S
- Legacy: superadmin/projects/at-risk/index.js:329-333 At-risk projects and dynamic count subtitle
- vNext now: project-admin-at-risk-page.tsx:75-76 same title, static subtitle
- Fix: Use dynamic copy with proper plural

## G2-7-029-078  [P2] GAP  facet F18  effort S
- Legacy: superadmin/projects/at-risk/index.js:391-393 Search workspace title or ID
- vNext now: project-admin-at-risk-page.tsx:95 generic Filters without matching placeholder
- Fix: Restore exact placeholder and tooltip

## G2-7-029-080  [P2] GAP  facet F18  effort S
- Legacy: superadmin/projects/at-risk/index.js:343 Report could not be loaded
- vNext now: project-admin-at-risk-page.tsx:64 At-risk workspaces unavailable
- Fix: Match exact error heading

## G2-7-029-081  [P2] GAP  facet F18  effort S
- Legacy: superadmin/projects/at-risk/index.js:453-456 No at-risk projects detected for this college vs No at-risk workspaces match this filter
- vNext now: project-admin-at-risk-page.tsx:106-108 No at-risk projects plus generic description
- Fix: Restore conditional empty messages
