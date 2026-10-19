# UI clone checklist: vNext must look like a new module inside the old LMS

Owner goal (2026-10-19): stakeholders must not be able to tell vNext from the old LMS. Page CONTENTS (sections, wording, behaviour) stay as in vNext; EVERYTHING visual around and inside them must be a pixel-level clone. Source of truth: `docs/design/legacy-styles/` (old LMS SCSS), `old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`. When a value is not covered, read the SCSS and copy it; never guess.

Each category has ONE owner lane (single owner per file set). Owners: compare vNext to the legacy value by value, fix, write `docs/audit/ux/clone-<category>.md` listing every value checked and its result, then migrate every page that hand-rolls the element onto the shared component. Tick items in your own audit file.


## WORK STYLE (owner, binding): lift heavy, work long
Take on a LARGE amount of work per turn. Do not finish after a handful of files. Plan your whole category first (list every file/instance from grep), then work through it continuously, committing and pushing every ~10 commits, and keep going until you have pushed at least 100 commits OR your whole category is complete under the STRICT TICK RULE. Only then reply, and the reply must contain: commits pushed, items ticked, items still open and why. If you run out of room in a turn, push everything you have, then state the exact next file to continue from so the next message resumes without re-planning. Never stop to ask questions: pick the closest legacy value, note it in your audit file, and proceed.

## STRICT TICK RULE (owner, binding)
An item may be ticked ONLY when ALL of these are true; otherwise leave it unticked and write what is missing:
1. VALUE PROOF: your audit file docs/audit/ux/clone-<category>.md has, for the item, a table of every property with the legacy value (file:line in docs/design/legacy-styles/ or old-lms-shell.css) and the vNext value (file:line), and every row matches exactly. No "approximately", no "similar", no row left out. States included: default, hover, active, focus, disabled, loading, error, empty where the element has them.
2. COVERAGE PROOF: zero remaining hand-rolled instances. State the grep you ran and its output count, e.g. raw buttons: grep -rlE "<button[ >]" src --include=*.tsx must list only the shared Button file and files with a written exemption; raw selects/inputs/textareas the same; hard-coded hex colours: only in globals.css and src/components/ui; hand-rolled overlays: grep fixed inset-0 and role=dialog only in the shared Dialog/Drawer. Paste the command and count in the audit file.
3. RESPONSIVE PROOF: phone and tablet behaviour compared with the old LMS rules for the element.
4. NO REGRESSION: props and behaviour of the shared component unchanged for existing callers; valid JSX (every open/close tag name matches).
The orchestrator re-runs the greps itself and un-ticks anything that fails. Visual side-by-side verification is a separate later step (section J); do not claim it.
Format in the audit file: "- [x] item (greps: <cmd> => <count>; values: <n> rows, all match)" or "- [ ] item (missing: ...)".

## A. Foundations (owner: chat-17, with chat-12 for typography/icons)
1. Font family, weights, sizes, line-heights, letter-spacing for every text role (h1-h6, body, caption, label, helper, table text, button text, numeric/tabular).
2. Colour palette: text, muted text, borders, backgrounds, shell bg #f1f4f9, canvas, brand teal, success/warning/error/info, link colour and hover, selection colour, disabled colours.
3. Spacing scale, radii, borders, shadows, z-index layers, transitions and easing, hover/active/pressed states.
4. Scrollbars (webkit and firefox), focus rings, cursor styles, text selection, tap highlight.
5. Icons: same icon family and sizes/stroke/colour as old LMS everywhere (sidebar, buttons, tables, menus, empty states). (chat-12)
6. Avatars, logo mark and wordmark, favicon, browser tab title format. (chat-12)
7. Links: colour, underline, hover, visited, external-link treatment. (chat-12)

## B. Shell (owners: chat-13 top bar, chat-19 sidebar, chat-9 page head/canvas)
1. Top bar: 68px, border and shadow, command search + Ctrl K, + New, Messages and Notifications icon buttons with badges, org name, avatar and account menu, org/role switcher. (chat-13)
2. Notification drawer (list item layout, unread dot, grouping, mark-all-read, empty state) and the command palette results panel. (chat-13)
3. Sidebar: 96px rail, 256px hover expand and timing, icons, group headings, active bar, dividers, badges, logo, mobile drawer, scroll behaviour. (chat-19)
4. Footer (if any), route progress bar / top loader, route transition behaviour. (chat-19)
5. Page canvas (white, radius 12, border, padding 24 on #f1f4f9), page head (title + inline subtitle + right actions, no eyebrow), breadcrumbs, back links. (chat-9)
6. Responsive behaviour: the old LMS breakpoints and how every element collapses on tablet and phone. (chat-9)

## C. Forms (owner: chat-17)
1. Text input, textarea, number input, search box (with button), password, OTP input.
2. Select (native and antd-style), multi-select, searchable select, tag input, creatable select.
3. Date picker, time picker, date-range picker, calendar popup.
4. Checkbox, radio, switch/toggle, slider, segmented control.
5. File upload and dropzone, image upload, progress state, file list.
6. Labels (required asterisk), helper text, validation error text and borders, disabled and read-only states, input groups and prefixes/suffixes, form layout grids and spacing.
7. Rich text / long-form editors if present.

## D. Buttons (owner: chat-17)
Primary solid #0a7c88 white text radius 9 height 36 weight 650 14px, hover #086873; secondary outlined; danger; ghost/link; icon buttons; button groups; split buttons; sizes (small, default, large); loading state; disabled; focus ring; every raw `<button>` in src replaced by the shared Button.

## E. Data display (owners: chat-14 tables/tabs/chips, chat-2 charts/tiles)
1. Tables: header row, row height, hairlines, hover, zebra (if any), sort icons, column-filter icons, sticky header, checkbox column, row action menu, expandable rows, column widths, empty and loading states, "N items in this view / Act on all N" strip, toolbar (search, Filters, Views, Columns, Export). (chat-14)
2. Pagination and page-size selector, infinite lists. (chat-14)
3. Tabs with counts and teal underline, segmented tabs, vertical tabs. (chat-14)
4. Badges, status pills, tags, "Needs doing" chips, count bubbles, progress pills. (chat-14)
5. Accordions/collapse, steppers and timelines, description lists, list rows with icon + title + detail + pill + chevron. (chat-14)
6. Cards only for genuinely separate objects (Next up panel, report tiles); remove card-in-card. (chat-9)
7. Stat tiles, funnel strips, summary strips, progress bars, charts (colours, axes, tooltips, legends), calendar and week/day grid views. (chat-2)

## F. Overlays and feedback (owners: chat-16 overlays, chat-5 states)
1. Modals/dialogs, drawers, popconfirm: overlay colour, radius, shadow, header/footer, close icon, padding, animation, button row; every hand-rolled overlay replaced by the shared Dialog/Drawer. (chat-16)
2. Toasts/notifications/message, tooltips, popovers, dropdown and context menus (item height, hover, dividers, icons). (chat-16)
3. Alerts and banners (slim pale-yellow info strips with outlined action), inline notices. (chat-5)
4. Loading: spinner (dotted), skeletons, button loading, page loading, route loading. (chat-5)
5. Empty states and error states, 403/404/500, maintenance, session expired, offline, "could not load" with retry. (chat-5)

## G. Whole-page types (owners listed)
1. Login, OTP, sign-in method, forgot flows, public pages and apply links, onboarding. (chat-16 earlier; chat-17 for shared parts)
2. Profile, settings, account and preference pages, notification preference pages. (chat-11)
3. Messaging/chat UI, conversations list, message bubbles, composer, notifications page. (chat-11)
4. Reports, exports, import wizards and upload steps (stepper, drop area, validation table, result summary). (chat-6)
5. Print styles, PDF/certificate/offer-letter/receipt templates, email templates (layout, header, footer, button look). (chat-6)
6. Calendar views, schedule and slot pickers, kanban/board views. (chat-2, chat-14)

## H. Portals: apply shared components everywhere (owners: chat-15 HR + faculty + learner, chat-3 faculty/academics, chat-4 college admin, chat-7 learner/courses, chat-12 TPO students/companies, chat-5 TPO placements, chat-11 TPO settings, chat-6 Super Admin second third, chat-9 Super Admin last third, chat-13 Super Admin first third, chat-14 mentor)
Every page in the portal uses ONLY shared components and tokens: no raw button/select/input with class strings, no hard-coded hex, no hand-rolled modals or tables, page head on the shared PageHeader, content inside the one canvas.

## I. Behaviour and interaction parity (all owners, check in their category)
Hover and active transitions and timings, keyboard focus order and visible focus, sidebar hover delay, dropdown and modal animation, sticky elements, scroll containers, double-submit and disabled-while-pending behaviour of buttons, tooltip delays, toast durations and positions.

## J. Verification (orchestrator)
After the lanes finish: run old LMS and vNext locally one at a time, sign in with test accounts, screenshot the same screens side by side per category, file concrete gaps back to the owning lane. A category is done only when its audit file lists every value as matching.
