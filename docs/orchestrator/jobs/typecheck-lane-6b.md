# Job: fix the last TypeScript errors (lane chat-6)

These errors come from tsc --noEmit on origin/main. For each: open the file, fix the cause with valid strict TypeScript (no any, no ts-ignore, no new packages), keep visual output and behaviour identical, re-read the file for matching tags, imports and duplicate attributes. One proof line per error in docs/audit/ux/typecheck-lane-6b.md, tick [x], push to chatgpt/chat-6-b with [chat-6].

- [ ] src/components/admin/super-admin-company-identities.tsx(46,83): error TS17001: JSX elements cannot have multiple attributes with the same name.
- [ ] src/components/placements/tpo-trust-toggle.tsx(39,13): error TS2451: Cannot redeclare block-scoped variable 'receipt'.
- [ ] src/components/placements/tpo-trust-toggle.tsx(40,13): error TS2451: Cannot redeclare block-scoped variable 'saved'.
- [ ] src/components/placements/tpo-trust-toggle.tsx(45,13): error TS2451: Cannot redeclare block-scoped variable 'receipt'.
- [ ] src/components/placements/tpo-trust-toggle.tsx(46,13): error TS2451: Cannot redeclare block-scoped variable 'saved'.
