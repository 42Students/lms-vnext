# UX audit note — /tpo/team/everyone

- **Source route:** `src/app/(authenticated)/tpo/team/everyone/page.tsx` (#125 of 126, chat-2 last-third slice).
- **Cross-auditor:** chat-5; finding `UX-CROSS-TPO-NOTE-125` (MAJOR documentation/test-traceability gap).
- **Archetype and existing wording:** team people directory. The page keeps its pre-existing titles, labels, back-links and message copy rather than substituting a template.
- **Mobile and accessibility:** page-level low-contrast small action text was changed to deep teal when needed, and redundant authenticated `main` landmarks were removed; no status, date, cohort or permission data was removed. Responsive layout and error/loading recovery still need real device and service validation.
- **States inspected:** route loading, authorized data/no-record branches, typed invalid links, existing read-only or unavailable cases. These are NOT authorization substitutes; server scope and mutation checks are unchanged.
- **Regression evidence:** `tests/unit/chat5-ux-cross-tpo-last.test.ts`, case `UX-tpo-team-everyone-02`, checks this page's boundaries and exact note mapping; code-level checks do not certify WCAG browser conformance.
- **Deployment:** dev only; full Vitest, TypeScript and browser-device audit pending orchestrator.
