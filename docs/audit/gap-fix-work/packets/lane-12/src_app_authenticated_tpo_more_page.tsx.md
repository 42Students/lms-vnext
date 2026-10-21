# Work packet: edit src/app/(authenticated)/tpo/more/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l11-u017-tpo-more.md

## G2-11-017-029  [P1] GAP  facet F12  effort M
- Legacy: 11 fixed destination links including settings/team even if elsewhere (more.js:19-46).
- vNext now: 8 link entries restricted to implemented pages (tpo-utility-model.ts:9-70; more/page.tsx:71-75).
- Fix: Restore all 11 destinations and safe permission handling.
