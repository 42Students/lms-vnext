# UX rollout — /activity

- Scope: `src/app/(authenticated)/activity/page.tsx` and shared `activity-center.tsx`; `UX-activity-index-01`, `-02`, `UX-activity-loading-03`.
- Before: raw filter inputs had bespoke focus styles/40px targets; row actions and disclosures were shorter than the playbook minimum; empty data had no next action; cards duplicated shared layout.
- Changes: shared Input, Select, Button, Card and EmptyState; phone-first single-column filter form and wrapping actions; ≥44px row/preset/export navigation and explicit focus outlines; exact Activity Log/filters/empty wording retained. Added reset action in true empty state.
- States: scoped permissions and exports unchanged; empty/filtered/older-page navigation unchanged; existing GR-19 12-second recovery remains and shows the Activity Log heading.
- Verification: `tests/unit/UX-activity-index-01.test.ts` authored, not executed in this GitHub-only lane. Device/keyboard and CI evidence pending; page checkbox intentionally remains pending until tests pass.
