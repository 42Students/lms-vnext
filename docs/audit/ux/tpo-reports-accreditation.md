# UX route /tpo/reports/accreditation

- **Slice:** chat-5, middle third of /tpo, route 82/126; archetype: read-only report.
- **Previous weakness:** 320px layouts and older route skeletons need source review for min-width, touch area, link contrast and duplicated semantic landmarks.
- **Changes:** preserved original report heading, filters, figures and permissions while adopting accessible link colour and 44px controls. Both wide report tables are now shared responsive `DataTable` components: all eleven placed-student fields and all six preview evidence fields remain accessible via phone cards and More details. No new PII or inferred denominators.
- **States:** existing `loading.tsx`, no-report completeness warnings and bounded 50-row previews remain. Both `DataTable` instances now receive explicit legacy-scoped `empty` copy; no actions or provider claims are invented.
- **Tests:** `tests/unit/chat5-ux-tpo-middle-third.test.ts` cases `UX-tpo-reports-accreditation-01` and `UX-tpo-reports-accreditation-02`. Source-level verification authored; orchestrator browser, assistive-technology and test execution is required before page list may be checked.

**Status:** source pass and audit note authored, full CI/device evidence pending.
