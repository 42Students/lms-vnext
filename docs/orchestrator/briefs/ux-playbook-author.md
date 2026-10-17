# UX playbook author brief (phase 3a)

You are the playbook author. Nothing else in the UI/UX pass starts until your playbook has been audited three times, so make it complete, concrete and consistent. Read these first: AGENTS.md, docs/design-system/lms-color-parity.md, src/app/globals.css (tokens), src/components/ui/* (existing shared components), docs/orchestrator/briefs/ui-ux-excellence-lane.md (the page checklist), docs/orchestrator/ui-ux/pages-*.md (every page that will follow your playbook).

## Product context that drives every decision
- Look and feel stays the same as the old LMS: same teal brand, same neutrals, same structure and navigation, exact legacy wording. Improve quality inside that look: spacing, hierarchy, alignment, states, motion, accessibility, polish. Never restyle the brand.
- There is a native mobile app for this product. Mobile is first-class for every role, not an afterthought. Design phone-first (320px up), then scale to tablet and desktop. Assume pages may run inside an app web view: no reliance on hover, no window.open popups, no tiny tap targets, downloads and uploads must degrade gracefully, back navigation must be predictable, respect safe areas (notches and home indicator), avoid fixed elements that fight the on-screen keyboard.
- Users are students, faculty, mentors, placement officers, college admins, recruiters and super admins. Many are on mid-range phones and unreliable networks. Fast, calm, forgiving.
- Graceful-operation rules stay: no raw error codes, no stack traces, no blank pages, no endless spinners, never lose typed work.

## Deliverables (all on main under docs/design-system and src/components/ui)
1. docs/design-system/UX-PLAYBOOK.md, the single source of truth, with these sections. Every rule must be concrete (exact Tailwind classes, token names, pixel and rem values, code snippets), not adjectives.
   - Principles (10 or fewer, each with a do and a don't example).
   - Design tokens: colour roles (map each role to an existing --lms-* token; add tokens only if a role is missing), type scale (sizes, weights, line heights for page title, section title, body, caption, table text, numerals), spacing scale, radius, borders, shadows and elevation, z-index layers, motion (durations 120/180/240 ms, easings, reduced-motion fallback), breakpoints.
   - Layout patterns: app shell on desktop and on phone (navigation, top bar, safe areas), page container widths and gutters, page header anatomy, section and card anatomy, two-column and detail layouts, sticky regions.
   - Page archetypes with a wireframe in ASCII and the exact component composition for each: dashboard, list or directory with filters, detail page with tabs, form or editor page, wizard, calendar, report or analytics, settings, inbox or thread, public and auth pages, error and empty pages.
   - Components catalogue: for each shared component (Button, Input, Select, Textarea, Checkbox/Radio/Switch, DatePicker usage, Dialog, Drawer, ConfirmDialog, Toast, Tabs, DataTable, Card, Badge/StatusBadge, EmptyState, ErrorState, Skeleton/Loading, Pagination, FilterBar, PageHeader, Breadcrumbs, Tooltip/InfoPopover, FileUpload, Avatar, Stat/KPI tile): anatomy, variants, sizes, all states (default, hover, focus, active, disabled, loading, error), props, do and don't, mobile behaviour, accessibility notes, which file implements it.
   - Mobile playbook: tables to cards (rules for which columns survive), filters in a bottom sheet, dialogs to full-screen sheets, sticky primary action bar, thumb-reach rules, 44 px targets, input modes (tel, email, numeric, date), keyboard handling, long-text truncation, number and date formatting (IST, en-IN), pull-to-refresh and infinite scroll vs pagination decision, offline and slow-network behaviour.
   - Forms playbook: labels, helper and error text placement, validation timing (on blur and on submit), focus-to-first-error, double-submit prevention, unsaved-changes guard, autosave rules, required markers, grouped sections, destructive confirmations.
   - States playbook: loading skeleton shapes per archetype, empty states (copy rules without changing legacy strings), error and retry, partial data, permission-denied, read-only, stale-data banners.
   - Accessibility checklist (WCAG 2.2 AA): landmarks, heading order, focus order and visible focus, keyboard operation for every control, aria-live for async status, contrast 4.5:1 text and 3:1 UI, target size, reduced motion, screen-reader names for icon buttons, error association.
   - Content rules: tone, capitalisation, number/date/currency formats, truncation, never invent copy: legacy strings are fixed.
   - Per-role notes (learner, faculty, mentor, TPO, college admin, recruiter, super admin): the top 5 jobs to be done and the page patterns that serve them.
   - Anti-patterns list (the mistakes lanes are likely to make, each with the fix).
   - Definition of excellent: a 100-point per-page scoring rubric that auditors and lanes use.
2. Upgrade the shared components in src/components/ui to match the playbook exactly (new components where the catalogue needs them: Tabs, Card, Skeleton, Pagination, FilterBar, StatTile, Checkbox/Radio/Switch, BottomSheet, Breadcrumbs, Tooltip, FileUpload). Keep every existing prop working (backwards compatible) so no page breaks, and keep existing tests passing. Add unit tests named UX-PLAYBOOK-NN for logic.
3. Three reference implementations, fully built and wired, to prove the patterns: pick one directory/list page, one form/editor page, one detail page with tabs, and one dashboard, each from a different role. Make them flawless on phone and desktop, every state covered. Record the file paths in the playbook as "copy these".
4. docs/design-system/UX-PLAYBOOK-CHANGELOG.md listing every shared component change.

## Process
- Work in big rounds, push to chatgpt/chat-12-b every ~5 files. You cannot run tests or see pages: keep TypeScript strict-clean, keep JSX balanced, and reuse existing patterns. The orchestrator runs typecheck, lint and tests and will send failures back.
- When finished, reply with the list of files and an honest list of weak spots. Then three audits follow (two by other builders, one by the orchestrator) using docs/design-system/UX-AUDIT-RUBRIC.md. Expect to be sent findings and to fix every one.
- No page-level rollout happens until the audits sign off.
