# Work packet: edit src/app/(authenticated)/admin/people/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/superadmin-people.md

## G2-8-002-019  [P2] GAP  facet F07  effort S
- Legacy: `.../superadmin/people.js:14-19`: missing-scope warning says `Select a college to continue` / `Choose a college in the header above to see its people directory.`
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:113-119`: `Select a college scope` / `Use the Super Admin scope selector ...`
- Fix: Restore exact legacy no-college message pair (may append separate global-scope explanation)
