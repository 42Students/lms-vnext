# Work packet (wave 2): edit src/app/(authenticated)/hr/conversations/page.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-002  [P2] GAP  facet F01  effort M
- Legacy: Main action opens General conversation drawer directly (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:162-167`)
- vNext now: Header primary action is Notification inbox; General is inline disclosure/form (`src/app/(authenticated)/hr/conversations/page.tsx:77-82`)
- Fix: Restore prominent Message the placement cell action that opens general composer.

## G2-13-004-003  [P2] GAP  facet F01  effort M
- Legacy: Clicking drive thread routes directly to drive Discussion tab (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:128-129`)
- vNext now: All thread rows navigate to standalone /hr/conversations/{threadId} (`src/app/(authenticated)/hr/conversations/page.tsx:187-191`)
- Fix: Keep direct drive Discussion link or show canonical alias and back-to-drive for drive threads.

## G2-13-004-004  [P2] GAP  facet F02  effort M
- Legacy: PageShell wraps ListingPageHeader then single Card workspace (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:159-171`)
- vNext now: PageHeader, optional notices, filters and tabs, list separated by border (`src/app/(authenticated)/hr/conversations/page.tsx:75-136`)
- Fix: Clone enclosing shell/Card, spacing and header order.

## G2-13-004-006  [P2] GAP  facet F02  effort M
- Legacy: Toolbar contains number of conversations and search when more than six (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:171-182`)
- vNext now: Search/order form always visible, two Tab bars follow (`src/app/(authenticated)/hr/conversations/page.tsx:114-135`)
- Fix: Match conditional search display when few threads; optional advanced controls elsewhere.

## G2-13-004-007  [P2] GAP  facet F02  effort S
- Legacy: Legacy list has icon, preview, gold unread tag, relative timestamp (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:191-219`)
- vNext now: New list uses title text, info unread badge, preview and relative date, no message icon (`src/app/(authenticated)/hr/conversations/page.tsx:187-197`)
- Fix: Restore icon and badge tone/spacing and row density.

## G2-13-004-008  [P2] GAP  facet F03  effort S
- Legacy: Thread icon MessageOutlined, unread dot for unread (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:200-203`)
- vNext now: No thread icon or dot in row list (`src/app/(authenticated)/hr/conversations/page.tsx:187-195`)
- Fix: Add icon plus dot when unread.

## G2-13-004-009  [P2] GAP  facet F03  effort S
- Legacy: LastBody displayed with single-line ellipsis (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:204-216`)
- vNext now: Preview is line-clamp-2, prefixed sender identity (`src/app/(authenticated)/hr/conversations/page.tsx:192-194`)
- Fix: Match old one-line ellipsis or document sender prefix enhancement.

## G2-13-004-010  [P2] GAP  facet F03  effort S
- Legacy: Unread count appears as gold Tag N new (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:206-211`)
- vNext now: Unread count info-tone Badge N new (`src/app/(authenticated)/hr/conversations/page.tsx:190-191`)
- Fix: Align yellow/gold visual and exact badge typography.

## G2-13-004-011  [P2] GAP  facet F03  effort S
- Legacy: Thread subject is backend subject or Drive/General fallback (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:205-207`)
- vNext now: Drive row is companyName · jobTitle; General fallback (`src/app/(authenticated)/hr/conversations/page.tsx:189-190`)
- Fix: Confirm backend subject ordering and fallback names match.

## G2-13-004-012  [P2] GAP  facet F03  effort M
- Legacy: Timestamps from momentFromApi(relative `fromNow`) (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:215-217`)
- vNext now: Custom timeAgo floors minute/hour/day; no month/year term (`src/app/(authenticated)/hr/conversations/page.tsx:29-38`)
- Fix: Use Moment-equivalent relative humanization, including month/year and future timestamps.

## G2-13-004-021  [P2] GAP  facet F06  effort S
- Legacy: Search is conditional free text with allowClear, prefix icon (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:173-182`)
- vNext now: Search label+input maxLength 120 with Search button; no explicit allowClear (`src/app/(authenticated)/hr/conversations/page.tsx:123-126`)
- Fix: Restore clear affordance and icon, decide 120 max as enhancement.

## G2-13-004-032  [P2] GAP  facet F09  effort M
- Legacy: General uses right Drawer width=480, title Placement cell · General (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:224-224`)
- vNext now: New General opens inline Disclosure with full detail link (`src/app/(authenticated)/hr/conversations/page.tsx:136-161`)
- Fix: Restore 480px drawer and title for pixel parity, or document approved deviation.

## G2-13-004-046  [P2] GAP  facet F13  effort S
- Legacy: Empty no search says No messages yet. Write to placement cell, or open drive... (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:184-188`)
- vNext now: New EmptyState says No matching conversations with placement cell (`src/app/(authenticated)/hr/conversations/page.tsx:187-197`)
- Fix: Differentiate true zero vs filtered no matches and restore exact true-empty text.

## G2-13-004-047  [P2] GAP  facet F13  effort S
- Legacy: Filtered empty says No conversations match your search (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:184-186`)
- vNext now: New generic No matching conversations and Reset link (`src/app/(authenticated)/hr/conversations/page.tsx:195-197`)
- Fix: Use exact filtered-empty text.

## G2-13-004-048  [P2] GAP  facet F13  effort S
- Legacy: General no messages shows Questions that are not about one drive go here (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:229-232`)
- vNext now: New General disclosure shows history/no inline empty guidance (`src/app/(authenticated)/hr/conversations/page.tsx:139-160`)
- Fix: Restore no-messages guidance in General.

## G2-13-004-052  [P2] GAP  facet F16  effort M
- Legacy: Old inbox Card and 480px Drawer; narrow Drawer adapts by AntD internals (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:171-224`)
- vNext now: New inline General section and scroll cue max-h-72 (`src/app/(authenticated)/hr/conversations/page.tsx:136-160`)
- Fix: Compare widths 375/768/1280 and preserve drawer/touch behavior.

## G2-13-004-053  [P2] GAP  facet F16  effort S
- Legacy: Old list row single line preview and relative date (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:191-219`)
- vNext now: New line-clamp-2 and stacked date paragraph (`src/app/(authenticated)/hr/conversations/page.tsx:187-196`)
- Fix: Audit overflow, long names, unread badge wrapping.

## G2-13-004-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy primary CTA Message the placement cell (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:165-167`)
- vNext now: New primary CTA Notification inbox; General via Open general conversation (`src/app/(authenticated)/hr/conversations/page.tsx:77-82`)
- Fix: Restore exact primary CTA in header.

## G2-13-004-058  [P2] GAP  facet F18  effort S
- Legacy: Legacy search placeholder Search by drive or message (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:174-180`)
- vNext now: New label Search by drive or message, input has no placeholder (`src/app/(authenticated)/hr/conversations/page.tsx:123-125`)
- Fix: Restore placeholder and search icon.

## G2-13-004-059  [P2] GAP  facet F18  effort S
- Legacy: Legacy subtitle counts all conversations and unread messages (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:162-166`)
- vNext now: New includes literal conversation(s) on this page (`src/app/(authenticated)/hr/conversations/page.tsx:77-80`)
- Fix: Use singular/plural natural text and full-scope metric.

## G2-13-004-073  [P2] GAP  facet F23  effort M
- Legacy: Old General compose in drawer with draft discard confirmation (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:224-238`)
- vNext now: New General disclosure plus separate full-detail reply form (`src/app/(authenticated)/hr/conversations/page.tsx:136-169`)
- Fix: Restore single-action compose without separate open step.
