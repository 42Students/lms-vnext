# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/privacy-policy.md

20 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/privacy-policy.md

## G2-20-007-002  [P2] MISSING  facet F01  effort S
- Legacy: Hero brand link href `https://42lms.com` aria-label 'Go to 42LMS home'; `docs/legacy-source/frontend/src/pages/privacy-policy.js:36-41`
- vNext now: Static HTML has no brand link, header text only; `public/assets/static/privacy-policy-view.html:14-20`
- Fix: Restore visible branded header link with exact accessible label/destination.

## G2-20-007-003  [P2] GAP  facet F01  effort S
- Legacy: Quick links 13 in-page anchors under <nav aria-label='Privacy policy sections'>; `docs/legacy-source/frontend/src/pages/privacy-policy.js:10-24,61-67`
- vNext now: Static HTML puts same 13 anchors under collapsible <details><summary>Quick links</summary>; `public/assets/static/privacy-policy-view.html:30-48`
- Fix: Restore always-visible navigation grid/aria-label unless collapsible menu is explicitly approved.

## G2-20-007-005  [P2] GAP  facet F02  effort S
- Legacy: Layout: blue privacy-hero → intro Summary panel → quick-links navigation grid → 13 bordered section panels; `docs/legacy-source/frontend/src/pages/privacy-policy.js:36-69,69-222`, `docs/legacy-source/frontend/src/pages/privacy-policy.js:265-305`
- vNext now: Static blue header → free introductory paragraph → details Quick links → 13 unboxed text sections; `public/assets/static/privacy-policy-view.html:14-50,50-166`
- Fix: Restore intro card and each section as own bordered white panel with legacy gaps/padding.

## G2-20-007-006  [P2] GAP  facet F02  effort S
- Legacy: Intro summary h2 'Summary', explanatory paragraph, Android package name in panel; `docs/legacy-source/frontend/src/pages/privacy-policy.js:49-59`
- vNext now: Static paragraph before quick links, package name embedded in Overview rather than summary panel; `public/assets/static/privacy-policy-view.html:25-28,50-56`
- Fix: Recreate Summary h2/p/package metadata as intro panel, preserve semantic position.

## G2-20-007-008  [P2] GAP  facet F02  effort S
- Legacy: Section 1 '1. Overview' heading is h2; `docs/legacy-source/frontend/src/pages/privacy-policy.js:69-75`
- vNext now: Static uses unsemantic div '1) Overview'; `public/assets/static/privacy-policy-view.html:50-56`
- Fix: Change each static div title to h2 and numbering format '1. ...'.

## G2-20-007-009  [P2] GAP  facet F02  effort S
- Legacy: Section 2 '2. Information we collect' with three h3 subsections A/B/C; `docs/legacy-source/frontend/src/pages/privacy-policy.js:77-119`
- vNext now: Static uses div title and bold paragraph A/B/C; `public/assets/static/privacy-policy-view.html:57-89`
- Fix: Restore semantic h2/h3 hierarchy and original grouping.

## G2-20-007-010  [P2] GAP  facet F02  effort S
- Legacy: All 13 sections are independent <section id=...> with consistent boxes; `docs/legacy-source/frontend/src/pages/privacy-policy.js:69-221,298-305`
- vNext now: Static anchors attach to div headings within one content wrapper; `public/assets/static/privacy-policy-view.html:50-166`
- Fix: Wrap each anchored section and match white bordered cards at 16px intervals.

## G2-20-007-012  [P2] GAP  facet F03  effort S
- Legacy: 13 quick links in 2+ column CSS grid min 220px cells, color #266891, font-weight700; `docs/legacy-source/frontend/src/pages/privacy-policy.js:308-323`
- vNext now: Static Quick links initially collapsed in details, uses list numbering '1)' not '1.'; `public/assets/static/privacy-policy-view.html:30-47`
- Fix: Display grid on load, labels '1. Overview' ... '13. Advertising and analytics'.

## G2-20-007-023  [P2] GAP  facet F05  effort S
- Legacy: Quick links a 13-item list in array order, grid repeat(auto-fit,minmax(220px,1fr)); `docs/legacy-source/frontend/src/pages/privacy-policy.js:10-24,61-67,308-312`
- vNext now: Static 13 links in unordered list hidden under details; `public/assets/static/privacy-policy-view.html:30-47`
- Fix: Restore grid/list visual form and clickable targets while preserving exact anchor IDs and order.

## G2-20-007-032  [P2] MISSING  facet F10  effort S
- Legacy: Brand href https://42lms.com; `docs/legacy-source/frontend/src/pages/privacy-policy.js:39-41`
- vNext now: Missing brand link; `public/assets/static/privacy-policy-view.html:14-20`
- Fix: Add true home link in header without disrupting policy content.

## G2-20-007-043  [P2] GAP  facet F16  effort S
- Legacy: Hero 40/36px desktop, 30/28px phone; font 40→30px; `docs/legacy-source/frontend/src/pages/privacy-policy.js:265-285,354-365`
- vNext now: Static generic accent header p-24, h1 inline margin only; `public/assets/static/privacy-policy-view.html:14-19`
- Fix: Recreate responsive blue hero padding/font sizes, not generic terms shell.

## G2-20-007-044  [P2] GAP  facet F16  effort S
- Legacy: Card section padding24→18px under 640px; `docs/legacy-source/frontend/src/pages/privacy-policy.js:298-305,367-371`
- vNext now: Static only one generic content wrapper rather than separate cards; `public/assets/static/privacy-policy-view.html:22-24`
- Fix: Wrap each section and apply 24/18px responsive padding.

## G2-20-007-045  [P2] GAP  facet F17  effort S
- Legacy: Section headings h2/h3, nav aria-label 'Privacy policy sections', brand aria-label 'Go to 42LMS home'; `docs/legacy-source/frontend/src/pages/privacy-policy.js:39-42,61-67,69-80`
- vNext now: Static div headings and details/summary, no branded header link or nav aria-label; `public/assets/static/privacy-policy-view.html:14-20,30-50`
- Fix: Restore semantic headings, labelled nav and home link; preserve native keyboard anchor navigation.

## G2-20-007-046  [P2] GAP  facet F17  effort S
- Legacy: Quick links visible without interaction, skip directly by hash; `docs/legacy-source/frontend/src/pages/privacy-policy.js:61-67`
- vNext now: Disclosure details requires toggling, keyboard Summary first; `public/assets/static/privacy-policy-view.html:30-48`
- Fix: Ensure keyboard users see links and can tab into anchor list without first expanding if strict parity.

## G2-20-007-048  [P2] GAP  facet F18  effort S
- Legacy: Heading 'Privacy Policy' and sections numbered '1. ...'; `docs/legacy-source/frontend/src/pages/privacy-policy.js:42,10-24`
- vNext now: Heading '42LMS Privacy Policy', sections '1) ...'; `public/assets/static/privacy-policy-view.html:17,33-45`
- Fix: Restore heading and decimal-point section numbering.

## G2-20-007-007  [P3] GAP  facet F02  effort S
- Legacy: Hero title 'Privacy Policy', separate brand and effective-date line; `docs/legacy-source/frontend/src/pages/privacy-policy.js:39-45`
- vNext now: Static title '42LMS Privacy Policy', date text inside header; `public/assets/static/privacy-policy-view.html:15-19`
- Fix: Match exact heading and separate 42LMS brand anchor.

## G2-20-007-015  [P3] GAP  facet F04  effort S
- Legacy: EFFECTIVE_DATE and LAST_UPDATED 'April 20, 2026'; `docs/legacy-source/frontend/src/pages/privacy-policy.js:3-4,43-45`
- vNext now: Static header same calendar date but separator '-' instead of '\|'; `public/assets/static/privacy-policy-view.html:17-19`
- Fix: Restore pipe separator and exact spaces.

## G2-20-007-018  [P3] GAP  facet F04  effort S
- Legacy: Section 2 content about camera/microphone/storage/notifications, third-party Google/YouTube preview; `docs/legacy-source/frontend/src/pages/privacy-policy.js:92-118`
- vNext now: Static lists same categories but adds examples, links and wording; `public/assets/static/privacy-policy-view.html:71-89`
- Fix: Line-by-line legal editorial review before changing copy; do not blindly reintroduce outdated SDK claims.

## G2-20-007-020  [P3] GAP  facet F04  effort S
- Legacy: Section 4 has single sentence covering legal/business transfer; `docs/legacy-source/frontend/src/pages/privacy-policy.js:131-140`
- vNext now: Static splits legal and merger/acquisition into separate list items; `public/assets/static/privacy-policy-view.html:99-109`
- Fix: Keep identical intent; style and list granularity per legacy if literal UI clone.

## G2-20-007-049  [P3] GAP  facet F18  effort S
- Legacy: Effective metadata separator ` \| `; `docs/legacy-source/frontend/src/pages/privacy-policy.js:43-45`
- vNext now: Static uses ` - `; `public/assets/static/privacy-policy-view.html:18`
- Fix: Restore literal vertical bar for date meta.
