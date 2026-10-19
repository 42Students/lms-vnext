# North Star TPO visual sweep — chat-2

Date: 2026-10-19  
Branch: `chatgpt/chat-2-b`  
Source: `docs/orchestrator/queues/master-queue.md` North Star; `docs/design/old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, `legacy-styles/components___{variables,button,form,dropdown,header,common,antddesign,typo}.scss`.

## Visual contract (shell and global look only)

- Inherit the app-level **one** white `#fff` canvas on `#f1f4f9`, 1px `#e5e9f0` border, 12px radius, 24px padding; no second page canvas or redundant outer card.
- H1 old LMS TPO look: 30px, 600, `#172033`, Inter; section typography stays in its existing hierarchy. Preserve all content, order, labels, forms, query keys and behaviour.
- Primary action: shared Button or token-backed style, teal `#0a7c88`, **white** label, 36px high, 9px radius, 14px/650; secondary actions white/hairline. Inputs/selects should use the shared component's styling rather than one-off 44px controls.
- Search/filter toolbars and tab rows sit directly on canvas; sections are distinguished by headings, spacing and thin dividers. Only true independent panels, warnings, grouped report tiles and separate objects retain cards.
- Mobile: preserve responsive columns, touch target and keyboard focus visibility; do not remove functional loading, error or empty states.

## File inventory and required fixes

| Files / surface | Drift / planned correction |
|---|---|
| `src/app/(authenticated)/tpo/calendar/{page.tsx,interviews/page.tsx,rounds/page.tsx,export/page.tsx}` | Eliminate redundant outer filter cards; align search controls, primary action labels, section counts, table/list surfaces and links with shell tokens. |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/{interview-slots,rounds,rounds/[roundId]/slots,rounds/[roundId]/results,candidate-schedule,drive-day}/page.tsx` | Fix primary/secondary actions, page headlines, filter/control surrounds and list hairlines; keep round/slot semantics and all safety states. |
| `src/app/(authenticated)/tpo/recruiters/campaigns/{page.tsx,new/page.tsx,preview/page.tsx,[batchId]/page.tsx,drafts/[campaignId]/page.tsx}` | Campaign CTA white-on-teal, correct 36px action height and 9px radius; remove redundant filter chrome; retain draft and receipt object boundaries. |
| `src/app/(authenticated)/tpo/settings/{page.tsx,public-link/page.tsx,public-page/page.tsx,recruiters/page.tsx,team/page.tsx,trusted/page.tsx}` | Replace native hard-coded form styles with common Input/Select/Button skins where safe, remove redundant section surface shells, keep real grant/team tables and status notices. |
| `src/app/(authenticated)/tpo/settings/{after-college,blocked-dates,branding,job-types,notices,notifications,prep-readiness,rules,season,see,templates}/page.tsx` | Standardize heading, action, control and table text/radius/border overrides; preserve independent settings controls. |
| `src/app/(authenticated)/tpo/reports/page.tsx` and `src/app/(authenticated)/tpo/reports/*/page.tsx` | Restore direct-on-canvas heading and filter/summary separation; preserve real report choice tiles/charts/tables but use canonical tokens. |
| `src/components/placements/{tpo-round-calendar-control,tpo-interview-reschedule-form,tpo-interview-slot-planner,tpo-round-reorder,tpo-round-results-import,tpo-round-result-recorder,tpo-round-result-entry-form,tpo-round-apply-control,tpo-bulk-round-result-recorder,tpo-week-hour-calendar}.tsx` | Audit inline action/control utility classes, use shared Button/Input/Select styling and old LMS table hairlines. |
| `src/components/placements/{tpo-settings-nav,tpo-recruiter-grant-controls,tpo-public-placement-content-editor,tpo-public-placement-toggle,tpo-report-presentation,tpo-report-saved-filters,tpo-report-record-links}.tsx` | Align tab/link active treatment, primary actions, settings borders and section styling; preserve data/action logic. |
| `src/components/tpo/{tpo-campaign-compose,tpo-campaign-send-control,tpo-communication-settings-editors,tpo-public-join-link-card,tpo-team-forms,tpo-team-ask-panel,tpo-team-handover,tpo-trusted-domain-editor}.tsx` | Fix custom teal/dark-text buttons, native fields and per-section chrome; keep all validation/confirmation and functionality. |
| `src/components/placements/placement-report-ui.tsx` | Shared by non-TPO consumers: avoid destructive visual changes; use shared tokens only if an update is proven safe for all consumers. |

## Ownership and execution

- **Do not touch:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/**` (chat-17); `src/components/shell/sidebar-nav.tsx` and `shell-model.ts` (chat-19); `src/components/shell/topbar/**` and `app-shell.tsx` (chat-13).
- Work only on TPO page-level and TPO-specific component files. Do not broaden to college, HR, recruiter or learner views of shared placements controls.
- This is a source sweep, not a live visual diff; no CI/tests are run per owner. Source review after edits must ensure imports and JSX remain balanced.

## Execution record (source sweep completed 2026-10-19)

- **94 changed files** relative to the original synchronized `main` snapshot (`9f45f5477ef3193a7a32e0ce67e6688a9e4037f4`): 47 TPO page routes, 17 TPO-specific placements components, 29 TPO components, and this audit document. Updates were committed in successive `[chat-2]` batches to `chatgpt/chat-2-b` only.
- **Calendar and interviews:** calendar lists and export, interview readiness, round schedule control, candidate schedule and interview slots, round staging/results import/apply, week/hour calendar, and drive-day pages: tokenized links/actions, legacy 9px action corners, 36px desktop height with mobile touch target preserved, single-canvas filter dividers and list hairlines.
- **Campaigns:** audience selection/compose, drafts, receipts, preview and dispatch controls: white-on-teal action contrast, campaign view underline tabs, filter toolbar on the page canvas, no extra campaign-list cards. Confirmation, eligible-audience checks and delivery status stay unchanged.
- **Settings and people:** recruiter grants, placement team, public join links, public placements controls, trusted domains, notification preferences, notices, job types, readiness, SMS limits, branding, seasons and rules: use the existing canonical tokens and light section dividers instead of repeated white cards. Retained distinct status/alert panels, real tables, report tiles and preview objects.
- **Reports:** report home and individual report filters/actions use the canonical link/primary tokens, action radii and toolbar treatment. Real report-choice tiles, summary elements and charts remain distinct objects and retain their content/order.
- **Source safety:** edits were constrained to utility-class strings and ordinary form/section outer wrappers, with no API, application state, validation, routes, labels, test assertions or migrations changed. Shared `src/components/ui/**`, app tokens, sidebar, shell and topbar files stayed untouched. Verified sampled edited sources for literal hard-coded hex/RGB, inappropriate dark-on-primary action text and retained focus/phone utility classes.
- **Not a runtime certification:** per the owner's directive, neither application code nor CI/tests were executed. Exact visual parity still depends on chat-17's shared control skins and page canvas, chat-19's sidebar, chat-13's topbar, and the orchestrator's screenshot comparison against the running old LMS. Report any remaining runtime-only diffs in this file after screenshots rather than changing functional page content.
