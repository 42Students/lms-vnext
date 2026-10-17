# UI/UX excellence lane brief (phase 3, starts after gaps closed and dev deployed green)

Goal: every page, modal, drawer and surface in vNext has the best possible UI/UX for its users, not just functional parity. You are working one slice of pages (list in `docs/orchestrator/ui-ux/pages-<area>.md`). Work through the whole slice in big rounds and push to your `chatgpt/chat-N-b` branch after every ~10 pages.

## Hard rules (unchanged)
- Legacy wording stays exact (nav labels, titles, buttons, messages). Improve layout, hierarchy, spacing, interaction and states, never the words. If a string truly must change, keep the legacy string and add the improvement around it.
- Follow AGENTS.md: central permission checks, same-origin checks on mutating routes, GET never writes, no AI features.
- Graceful operation rules stay: no raw error codes, no stack traces, guarded actions, friendly errors, no blank pages or endless spinners.
- Do not remove or weaken existing tests. Keep tests passing; add tests named with `UX-<area>-<page>-NN` for behaviour you add.
- Never touch production. Dev only.

## What "excellent" means for each page (check every item)
1. Clear hierarchy: one obvious primary action, a scannable page header (title, short helper line only if the legacy page has one, primary action on the right), sensible grouping into cards or sections, consistent spacing from the design tokens (no one-off pixel values).
2. Responsive from 320px to wide desktop: tables become cards or scroll with sticky first column on mobile, no horizontal page scroll, touch targets at least 44px, sheets instead of tiny popovers on mobile.
3. All states designed: loading skeletons that match the final layout, honest empty states with the next step, error states with retry, partial-data states, disabled states that explain why.
4. Forms: labels always visible, inline validation next to the field on blur and on submit, focus moves to the first error, submit button shows progress and prevents double submit, unsaved-changes protection, sensible defaults and input types (tel, email, date, number with inputMode), no data loss on errors.
5. Tables and lists: sticky headers, readable density, sort and filter state in the URL, clear row actions, bulk actions with confirmation, pagination or virtualisation for long lists, zero layout shift.
6. Modals and drawers: focus trap, Escape and backdrop close (with unsaved protection), focus returns to the trigger, scroll lock, titled with aria-labelledby, primary action last, destructive actions need confirmation with consequence stated.
7. Feedback: toasts for success, inline for validation, undo where cheap, optimistic updates only when safe, confirm irreversible actions.
8. Accessibility: semantic landmarks and headings in order, visible keyboard focus, contrast 4.5:1, aria-live for async status, no colour-only meaning, reduced-motion respected.
9. Polish: consistent icons and badge colours for statuses across roles, subtle transitions (150-200ms), no layout jumps, truncation with title tooltips for long text, sensible number/date formatting (IST, en-IN).
10. Performance feel: above-the-fold content first, no heavy client work on render, images sized.

## How to work
- Reuse shared components (`PageHeader`, `DataTable`, `Dialog`, `ConfirmDialog`, `Toast`, `Input`, `Select`, `Textarea`, `Button`). If a shared component lacks something several pages need, improve the shared component once (note it in your handoff so others pull it), do not fork it.
- Per page write a short note `docs/audit/ux/<route-with-dashes>.md` (what was weak, what you changed, states covered, tests). Tick the page in the page list.
- Touch only the pages in your list plus shared components. Pull origin main before every round; resolve conflicts by keeping main for code you did not author.
- You cannot run tests or the browser: write code carefully, keep TypeScript strict-clean (no implicit any, handle undefined, escape nothing needed), and keep JSX balanced. The orchestrator runs typecheck, lint, unit and browser tests and will send failures back.

## Lane slices (area to lane)
- /tpo (126 pages): chat-12 first third, chat-5 second third, chat-2 last third (by route order in pages-tpo.md)
- /admin (111): chat-13 first third, chat-6 second third, chat-9 last third (pages-admin.md)
- /college (85): chat-4 first half, chat-11 second half
- /learn (43) and /quiz, /dashboard, /notifications: chat-7
- /teacher (36) and /teach: chat-3
- /mentor (26) and /hr (22): chat-14
- /recruiter (17), /tracker (6), /superadmin, /activity and all public and auth pages (login, join, invites, privacy, request-demo, forbidden, home, company-share, enterprises, universities): chat-15 and chat-16 split by route order
