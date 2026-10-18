# Chat-14 UX rollout handoff — /mentor and /hr
**Date:** 2026-10-18 · **Branch:** `chatgpt/chat-14-b`
**Source reference:** `docs/design-system/UX-PLAYBOOK.md` (SIGNED OFF), `docs/orchestrator/briefs/ui-ux-excellence-lane.md`, `pages-mentor.md` and `pages-hr.md`.

## Source implementation counts
| Coverage | Count |
|---|---:|
| Inventoried routes reviewed | 48 |
| Mentor routes reviewed | 26 of 26 |
| HR routes reviewed | 22 of 22 |
| Routes with source improvements | 46 |
| Intentional redirect/re-export routes left unchanged | 2 (`/hr/colleges`, `/hr/messages`) |
| Per-route notes created | 48 |
| Per-route source-contract tests authored | 48 |
| High-risk page-contract tests authored | 6 |
| New or changed role-specific UI component forks | 0 |
| Legacy visible route, title, action, or status copy rewritten | 0 |

## Applied source rules
- Prefer fluid `min-w-0 max-w-full` route containers to prevent unnecessary page overflow, while retaining existing cards, filters, and real data.
- Upgrade existing `min-h-10` controls in route sources to `min-h-11` to meet 44px phone target guidance.
- Preserve the shell's one main landmark by changing nested HR route-local `<main>` wrappers to `<div>`; keep all existing alert roles, content and data contracts.
- Preserve native table content and column authorization. Four HR table surfaces now have keyboard-focusable, horizontally scrollable regions. Selection history and issued offers use separate accessible names.
- Preserve existing `PageHeader`, `FilterBar`, `Input`, `Select`, shared applicant `Drawer`, authorized role guards, tenant-scoped queries, forms and empty/error states. No independent UI primitives or invented records.
- No new `DataTable` instances were introduced; existing table content and explicit empty-state branches were not removed.

## Evidence and validation status
Per-page notes: `docs/audit/ux/mentor*.md` and `docs/audit/ux/hr*.md`, with a route and specific test name.
Source regression files: `tests/unit/ux-chat14-mentor-01.test.ts`, `-02.test.ts`, `-03.test.ts`; `tests/unit/ux-chat14-hr-01.test.ts`, `-02.test.ts`, `-03.test.ts`; `tests/unit/ux-chat14-high-risk-contracts.test.ts`.

**NOT SIGNED OFF at per-page/device level:** git source assertions were reviewed, but this lane has no local repository checkout capable of running Vitest/TypeScript/lint/browser/screen reader. The orchestrator must run strict TypeScript, complete unit suite, `ux:guard`, and actual 320/360/390 phone, keyboard, WebView and AT checks. In keeping with the inventory's own precondition, route checklist boxes remain unticked until those tests pass. Source-level changes do not imply a witnessed 90/100 page score.

## Follow-up focus for Audit 3
- Validate card/table alternatives and horizontal scroll on all 48 pages, including company reports and recruiter job details.
- Validate focus/keyboard/escape/back handling on the recruiter applicant drawer, all linked review forms and mobile filters.
- Validate slow connection, partial/denied/empty/error/loading and draft-preservation states using real authorized fixture accounts.
- Run page-specific unit contracts and detect formatting or type errors before orchestrator merges into production branch.
