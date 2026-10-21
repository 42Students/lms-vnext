# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l11-u014-tpo-home.md

18 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u014-tpo-home.md

## G2-11-014-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy seven row hrefs /tpo/batches, /tpo/drives, /tpo/students, /tpo/recruiters, /tpo/requests/messages, /tpo/messages?tab=team, /tpo/calendar (homeRows.js:92-105,109-124).
- vNext now: vNext row links /tpo/batches, /tpo/placements, /tpo/students, /tpo/recruiters, /tpo/requests/messages, /tpo/team, /tpo/calendar (tpo-home-legacy-rows.ts:50-74).
- Fix: Map legacy Drives and Team/Inbox routes to correct new tabs and preserve filters.

## G2-11-014-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy intentionally minimal layout: greeting/date then one Next up card left, seven quiet rows right, no KPIs (home.js:17-20,61-118).
- vNext now: vNext adds full four-tile KPI strip BEFORE Next up and seven rows, plus optional notice (tpo/home/page.tsx:175-220).
- Fix: Remove/reposition KPI tiles as secondary disclosure; preserve greeting→next-up→seven row flow.

## G2-11-014-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy PageShell scroll-container tpo-calm-home, CSS grid Next up left and rows right desktop, stacked mobile (home.js:61-67,86-117).
- vNext now: vNext generic canvas grid 5fr/7fr at 992, Next up card + seven list rows, but KPI section interrupts and lacks legacy class styling (tpo/home/page.tsx:175-220).
- Fix: Clone original desktop split, gutters, line height, row separators and mobile stacking.

## G2-11-014-006  [P2] GAP  facet F02  effort S
- Legacy: Legacy header plain date `dddd, D MMMM`, h1 greeting, needLine paragraph together (home.js:63-68).
- vNext now: vNext date plain paragraph, PageHeader h1 greeting, needLine placed below KPI strip (tpo/home/page.tsx:175-199).
- Fix: Keep date/greeting/needs line adjacent with exact legacy spacing.

## G2-11-014-007  [P2] GAP  facet F02  effort S
- Legacy: Legacy Next up is single card with eyebrow, title, text, one primary button; clear state same panel (home.js:89-101).
- vNext now: vNext Next up section h2, title/text/button, but alternative fallback `rows.find(needsAttention)` after next returns null (tpo/home/page.tsx:199-209).
- Fix: Use old eyebrow/card copy and do not invent alternative task without verified priority.

## G2-11-014-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy row buttons each icon in left 7 icon set, text title/status, Needs you pill and right chevron (home.js:15,103-113).
- vNext now: vNext each row link has text, badge, chevron but NO left icon in markup (tpo/home/page.tsx:210-219).
- Fix: Restore original seven icons, sizes, inset and chevron alignment.

## G2-11-014-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy icon map TeamOutlined/ProjectOutlined/UserOutlined/SolutionOutlined/InboxOutlined/CommentOutlined/CalendarOutlined (home.js:15).
- vNext now: vNext omits all decorative icons and chevron uses literal › (tpo/home/page.tsx:210-218).
- Fix: Use legacy-equivalent icon set/size, avoid shifting card text.

## G2-11-014-039  [P2] GAP  facet F12  effort M
- Legacy: Legacy team asks overdue/mentions drive attention only on asks or mentions, unread alone shows status (homeRows.js:108-124).
- vNext now: vNext Team needsAttention on teamAsks+mentions, but mentions null and unread status fallback (tpo-home-legacy-rows.ts:66-71).
- Fix: Restore real mentions and overdue breakdown if available, do not infer from unread.

## G2-11-014-041  [P2] GAP  facet F13  effort M
- Legacy: Legacy initial DashboardSkeleton metrics4, label Loading placement home even though no KPI cards in final page (home.js:69-75).
- vNext now: vNext SSR server data before page renders; no in-page DashboardSkeleton, slow request waits for stream/loading boundary (tpo/home/page.tsx:48-63,175-220).
- Fix: Match initial 7-row + Next up skeleton and avoid metrics-only placeholder.

## G2-11-014-042  [P2] GAP  facet F13  effort S
- Legacy: Legacy if no urgent next shows Nothing is waiting on you. New requests, results and replies show up here first. (home.js:96-101).
- vNext now: vNext same primary copy only if next null and rows none, otherwise fallback Open row (tpo/home/page.tsx:206-209).
- Fix: Match no-upnext exact state, do not elevate attention row without priority reasoning.

## G2-11-014-046  [P2] GAP  facet F16  effort M
- Legacy: Legacy calm-home grid desktop Next up left/seven rows right, mobile stacked, no stat tiles (home.js:86-117).
- vNext now: vNext grid >=992 5fr/7fr, KPI strip 1/2/4 columns before it, list has min-h16 and paddings (tpo/home/page.tsx:180-220).
- Fix: Compare 375/768/1280 and restore legacy row height/sidebar spacing without first stats block.

## G2-11-014-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact row titles and conditional status strings seven labels (homeRows.js:92-105).
- vNext now: vNext same titles but some statuses differ due to source/needs, e.g. team asks, requests null (tpo-home-legacy-rows.ts:28-74).
- Fix: Use exact status copy for known values and informative unavailable copy for null.

## G2-11-014-058  [P2] GAP  facet F22  effort M
- Legacy: Legacy team asksOverdue/mentionsNew/unread, companyFunnel recruiterLeads, followUps[] (homeRows.js:85-105,109-124).
- vNext now: vNext teamAsks/unread, teamMentions null, CRM counts from readiness; no overdue count in row type (tpo-home-legacy-rows.ts:3-13,58-71).
- Fix: Add overdue/mentions and CRM counts where supported; avoid treating unready as zero.

## G2-11-014-059  [P2] GAP  facet F23  effort M
- Legacy: Legacy North Star of TPO Home is deliberately least cognitive load: greeting, one Next up, seven quiet rows, no KPI matrix (home.js:17-20,86-117).
- vNext now: vNext preserves Next up/seven rows but adds four big metrics before primary work (tpo/home/page.tsx:180-220).
- Fix: Remove or relocate KPI matrix under More/Operations so exact first screen stays calm.

## G2-11-014-060  [P2] GAP  facet F23  effort S
- Legacy: Legacy Home's seven icons and simple status dots are minimal visual cues (home.js:15,103-113).
- vNext now: vNext links/accessible badges improve interactions but omit icons and position needs line later (tpo/home/page.tsx:198-220).
- Fix: Clone iconography/micro-layout without discarding keyboard semantics.

## G2-11-014-011  [P3] GAP  facet F03  effort S
- Legacy: Legacy Next up eyebrow `Next up` small uppercase style vs vNext h2 heading with title (home.js:90-95).
- vNext now: vNext `<h2>` Next up 18px, title/status paragraphs (tpo/home/page.tsx:199-205).
- Fix: Match eyebrow size/weight/line height and CTA position.

## G2-11-014-013  [P3] GAP  facet F03  effort S
- Legacy: Legacy attention pill text Needs you, chevron RightOutlined (home.js:103-113).
- vNext now: vNext Badge Needs you with warning tone, literal › arrow (tpo/home/page.tsx:212-218).
- Fix: Match pill radius/background/type and chevron SVG.

## G2-11-014-020  [P3] GAP  facet F04  effort S
- Legacy: Legacy This week first event Today/Tomorrow/ddd h A or h:mm A plus +N more (homeRows.js:56-62,89-105).
- vNext now: vNext ISO date/time formatter always h:mm am/pm with IST and explicit Calendar unavailable copy (tpo-home-legacy-rows.ts:39-49,72-74).
- Fix: Align same-day labels, zero-minute hour formatting and timezone.
