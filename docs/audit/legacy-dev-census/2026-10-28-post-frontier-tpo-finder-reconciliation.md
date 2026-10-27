# Post-frontier TPO finder hardening — 2026-10-28

> This is an implementation/security hardening record, **not** page Implementation Green. Do not add page families, duplicate tracker tasks, or reset the completed static UI import inspection.

## Baseline and source reconciliation

- vNext base for the change: `b5e833560cc96fd424a187d4f9bc812dbe575752`; scoped legacy imported-UI frontend inspection is closed at **484 inspected source files, zero new static UI-folder import candidates** in `2026-10-28-derived-import-frontier-post-wave6.json`.
- Legacy `src/components/tpo/TpoCommandPalette.jsx` implements record finding, Ctrl/Cmd+K, arrow selection, open/close, recents and a special `go to` page-query mode. Current vNext already has `TopbarCommandSearch`, `TpoFindSuggestions`, `TpoFindShortcut` and `TpoFourEntitySearch`. Do not misclassify the finder as wholly absent.
- Existing vNext `src/components/shell/topbar/tpo-find-model.ts` validates an item as a `/tpo/` route, blocks protocol-relative or backslash escapes, path dot segments and encoded path separators, and validates labels and query syntax.
- Before this change, `src/components/tpo/tpo-find-shortcut.tsx` used a weaker local `safeMatch` predicate accepting encoded-dot traversal strings such as `/tpo/%2e%2e/admin`, and `tpo-four-entity-search.tsx` only checked `href.startsWith("/tpo/")`. These are **defense-in-depth path filtering discrepancies**. They do not imply that the current server returned malicious results.

## Implemented in this change

1. Both TPO shortcut and four-category search use the same established `safeTpoFindResult` validation as the topbar suggestion list, preserving the existing search API and navigation patterns.
2. `tests/unit/tpo-finder-safe-link-parity.test.ts` covers permitted scoped links and query encoding; rejects protocol links, cross-portal paths, traversal and encoded separators, controls and malformed percentages; and guards both consumers from drifting back to permissive validation.
3. No permissions, database migration, active membership, tracker, or product acceptance status is changed.

## Still outstanding for functional acceptance

- Run focused Vitest, TypeScript check, then the TPO finder browser interaction suite in a suitable runner. GitHub source edits and static checks alone do **not** establish executed tests.
- Confirm the complete legacy command-palette state set: `go to` page mode, recents and role-switch privacy, grouped record results, inactive/deleted navigation rejection, double Ctrl/Cmd+K ownership, focus restoration, keyboard navigation, mobile dialog behavior and fetch error/race handling.
- Confirm the find-suggestions API's persisted current-college and role guard, including tenant-crossing negative fixtures; backend auth cannot be replaced by client-side link validation.

**Closure gate:** this specific inconsistency is code-patched with authored regression coverage; the TPO command-search **page family remains unaccepted** pending executed and cross-role evidence.
