# UX playbook audit rubric (brutal, exhaustive)

Used for the three audits of docs/design-system/UX-PLAYBOOK.md and the upgraded src/components/ui. Audit 1 and Audit 2 are done by two different builder lanes, Audit 3 by the orchestrator in a real browser. Each auditor writes docs/design-system/audits/UX-AUDIT-<n>.md with findings, severity (BLOCKER, MAJOR, MINOR, NIT), the exact file and section, and the exact fix. Findings are fixed by the author, then the next audit starts from the fixed version. No sign-off while any BLOCKER or MAJOR remains.

Do not be polite. Assume the playbook is wrong until proven right. Try to break every rule.

## A. Completeness (can a lane build any page without guessing?)
1. Every section required by docs/orchestrator/briefs/ux-playbook-author.md exists and is concrete (exact classes, tokens, sizes, snippets). List every rule that is vague or an adjective.
2. Walk 25 real pages chosen across all roles from docs/orchestrator/ui-ux/pages-*.md (at least 3 per role, including the most complex: TPO students grid, drive workspace, college people directory, learner course workspace, recruiter drive page, super admin tenants, login, quiz attempt, calendar, inbox). For each, state which archetype and components apply and where the playbook gives no answer. Every gap is a finding.
3. Every shared component has anatomy, variants, sizes, all states, props, mobile behaviour, accessibility notes, implementation file. Missing item = finding.
4. Every state (loading, empty, error, partial, denied, read-only, stale) has a defined pattern per archetype.

## B. Consistency and correctness
5. Colours: every role maps to an existing --lms-* token with the exact legacy value; no invented brand colours; contrast of every text and UI pairing computed (4.5:1 and 3:1). List failing pairs.
6. Type, spacing, radius, shadow, motion scales are internally consistent; no two rules conflict; no one-off values.
7. The playbook never changes legacy wording, navigation labels or structure.
8. The code of the upgraded components matches the playbook text exactly (class names, sizes, behaviours). Diff them. Every mismatch is a finding.
9. Backwards compatibility: every existing prop and usage of every upgraded component still type-checks and behaves the same. Search the repo for usages and spot-check at least 30 call sites.
10. No component relies on hover, no component uses window.confirm/alert/prompt, no raw error text.

## C. Mobile and the native app (highest scrutiny)
11. Every archetype has an explicit phone layout at 320, 360 and 390 px widths; no horizontal page scroll; targets at least 44 px; thumb-reach for primary actions.
12. Tables become cards with a rule for which columns survive; filters use a bottom sheet; dialogs become full-screen sheets; sticky action bars respect safe areas and the on-screen keyboard.
13. Web-view hazards covered: no popups or new-window links without fallback, file upload and download fallbacks, back button behaviour, text selection and long-press, pinch zoom not blocked, viewport meta, 100vh problems (use dvh), input zoom on iOS (inputs at least 16 px), date and number input modes.
14. Slow and offline networks: skeletons, retry, timeouts, no layout shift, optimistic updates only when safe.

## D. Accessibility (WCAG 2.2 AA)
15. Landmarks, heading order, focus order, visible focus ring in every component, keyboard operation (Tab, Shift+Tab, Enter, Space, Escape, arrows for tabs/menus), focus trap and return in dialogs and drawers, aria-live regions for async status, names for icon-only buttons, form errors associated with fields, reduced motion, target size, no colour-only meaning.
16. Screen-reader announcements for toasts, loading, validation, pagination.

## E. Engineering quality
17. TypeScript strict-clean, no any, no unbalanced JSX, no impure render code, no dead props, no duplicated components. Check tests exist for logic.
18. Performance: no heavy client-only work on render, images sized, no layout shift, lists virtualised or paginated beyond 100 rows.
19. Reference implementations: each of the four is complete on phone and desktop, uses only playbook components, covers every state, and is what a lane should copy. Find every deviation.

## F. Anti-drift safeguards
20. The playbook includes the 100-point per-page rubric and an anti-patterns list; verify they are specific enough that two different lanes would score the same page within 5 points.
21. List the ten most likely ways 13 different builders will still produce inconsistent pages, and the rule or lint that would prevent each.

## Output format
For every finding: ID (A-03), severity, location, what is wrong, why it matters, exact fix. End with: counts per severity, a verdict (BLOCKED / PASS WITH FIXES / PASS) and the three riskiest things you could not verify.
