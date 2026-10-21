# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l11-u017-tpo-more.md

23 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u017-tpo-more.md

## G2-11-017-003  [P2] GAP  facet F02  effort S
- Legacy: Groups Work, Insights, Account, in that order (more.js:19-46).
- vNext now: Students and operations, Relationships and account (tpo-utility-model.ts:9-69).
- Fix: Restore three groups, headings and order.

## G2-11-017-004  [P2] GAP  facet F02  effort M
- Legacy: Three Card containers; Work spans two rows in asymmetric 1.2fr/0.8fr desktop grid (_tpo-more.scss:53-79).
- vNext now: Stacked section blocks; links inner grid switches to two columns at 768 (more/page.tsx:24-69).
- Fix: Use original card, 900px break and 1.2/0.8 grid.

## G2-11-017-005  [P2] MISSING  facet F03  effort M
- Legacy: 11 illustrated icon tiles, 38px with border and Ant icon (_tpo-more.scss:117-137; more.js:23-43).
- vNext now: Text labels and arrow only; no item icons (more/page.tsx:44-64).
- Fix: Add each legacy icon with correct tile size.

## G2-11-017-008  [P2] GAP  facet F03  effort S
- Legacy: Compact uppercase group labels (_tpo-more.scss:42-51,67-69).
- vNext now: Large sentence-case H2 and extra group description (more/page.tsx:34-41).
- Fix: Clone uppercase labels, remove extra descriptions.

## G2-11-017-010  [P2] GAP  facet F04  effort S
- Legacy: Requests explanatory copy: What students asked you to decide: withdrawals, off-campus offers, registration changes (more.js:24).
- vNext now: Triage pending student placement requests and review recorded decisions (tpo-utility-model.ts:20-25).
- Fix: Restore full exact description.

## G2-11-017-011  [P2] GAP  facet F04  effort S
- Legacy: Calendar: Talks, deadlines and rounds (more.js:25).
- vNext now: Open placement interviews and scheduled events (tpo-utility-model.ts:26-31).
- Fix: Restore description.

## G2-11-017-012  [P2] GAP  facet F04  effort S
- Legacy: Reports: Placement summary, by branch, by company and more (more.js:34).
- vNext now: Explore placement performance and exportable reports (tpo-utility-model.ts:32-37).
- Fix: Restore report description.

## G2-11-017-013  [P2] GAP  facet F04  effort S
- Legacy: Notifications: Everything that has notified you (more.js:40).
- vNext now: Read, filter and acknowledge your own notifications (tpo-utility-model.ts:38-43).
- Fix: Restore notification copy.

## G2-11-017-014  [P2] GAP  facet F04  effort S
- Legacy: Audit log: Who did what, and when (more.js:42).
- vNext now: Review recorded placement decisions and activity (tpo-utility-model.ts:44-49).
- Fix: Restore audit copy.

## G2-11-017-015  [P2] GAP  facet F04  effort S
- Legacy: Profile: Your own account details (more.js:43).
- vNext now: View your own college membership and profile (tpo-utility-model.ts:62-67).
- Fix: Restore profile copy.

## G2-11-017-016  [P2] GAP  facet F05  effort S
- Legacy: Work exact order Placement eligibility, Requests, Calendar, Announcements, Messages, Placement team (more.js:21-29).
- vNext now: Students, Requests, Calendar, Reports, Notifications, Audit log (tpo-utility-model.ts:11-50).
- Fix: Rebuild Work list with exact order.

## G2-11-017-017  [P2] GAP  facet F05  effort S
- Legacy: Insights exactly Reports; Account Notifications, Settings, Audit log, Profile (more.js:31-45).
- vNext now: No Insights; Account group Companies, Profile only (tpo-utility-model.ts:53-69).
- Fix: Restore Insights and Account list ordering.

## G2-11-017-028  [P2] MISSING  facet F12  effort S
- Legacy: Badge only when positive Number counts; 99+ cap (more.js:52-63,102).
- vNext now: No number badges (more/page.tsx:44-64).
- Fix: Handle 0, missing, NaN, 99 and 100 correctly.

## G2-11-017-034  [P2] GAP  facet F16  effort M
- Legacy: Desktop two-column group layout >=900, one column <=899 (_tpo-more.scss:53-61,180-190).
- vNext now: Outer group always stacked, inner links two columns >=768 (more/page.tsx:24-44).
- Fix: Use original 899/900 breakpoint and outer grid behavior.

## G2-11-017-035  [P2] GAP  facet F16  effort M
- Legacy: Rows min-height68 desktop, 64 mobile and glyph tiles 38/36px (_tpo-more.scss:82-88,192-218).
- vNext now: Links 44 mobile and 36 desktop, no glyph tiles (more/page.tsx:44-63).
- Fix: Match min-heights, padding 12x14/11x12 and tile dimensions.

## G2-11-017-038  [P2] GAP  facet F18  effort S
- Legacy: Subtitle: Secondary placement tools, insights and account controls that stay out of your main day-to-day navigation. (more.js:70-74).
- vNext now: Quick access to the placement tools, recruiter relationships and account pages available to your TPO membership (more/page.tsx:18-22).
- Fix: Restore exact subtitle and final period.

## G2-11-017-039  [P2] GAP  facet F18  effort S
- Legacy: Exact headings Work/Insights/Account and 11 labels (more.js:19-46).
- vNext now: Changed group headings, adds Companies/Students, omits team (tpo-utility-model.ts:9-69).
- Fix: Use exact heading and link labels from legacy-copy-B.

## G2-11-017-040  [P2] MISSING  facet F19  effort M
- Legacy: getCounts caches promise for 5000ms and resets on rejection (TpoHubService.js:37-48).
- vNext now: No fetch/deduplication on page (more/page.tsx:8-78).
- Fix: Implement bounded dedupe to avoid repeat expensive counts.

## G2-11-017-041  [P2] MISSING  facet F20  effort M
- Legacy: Failed fetch sets countFailed but retains last known counts; Retry clears (more.js:59-65).
- vNext now: No badge state or retry (more/page.tsx:8-78).
- Fix: Preserve last-good counts, show warning, prevent stale async overwrite.

## G2-11-017-002  [P3] GAP  facet F01  effort S
- Legacy: Page data-testid=tpo.more (more.js:68).
- vNext now: No test-id on More page (more/page.tsx:16-22).
- Fix: Restore legacy route test identifier.

## G2-11-017-006  [P3] GAP  facet F03  effort S
- Legacy: Ant RightOutlined chevron translated 2px on hover (more.js:103; _tpo-more.scss:172-176).
- vNext now: Plain → arrow translated 4px (more/page.tsx:54-59).
- Fix: Use equivalent chevron and 2px motion.

## G2-11-017-033  [P3] GAP  facet F15  effort S
- Legacy: Reads unread and pending counters, never sends message/email (more.js:59-65; TpoWorkspaceController.java:267-274).
- vNext now: Static navigation triggers no notifications (more/page.tsx:16-78).
- Fix: Restore passive unread state only, no outbound notification.

## G2-11-017-037  [P3] GAP  facet F17  effort S
- Legacy: Sections labelled via aria-labelledby visible group heading (more.js:82-85).
- vNext now: aria-label rather than labelledby (more/page.tsx:29-36).
- Fix: Tie group accessible name to visible Work/Insights/Account header id.
