# UX route /tpo/recruiters/campaigns/[batchId]

- **Slice:** chat-5, middle third of /tpo, route 77/126; archetype: campaign review / messaging.
- **Previous weakness:** 320px layouts and older route skeletons need source review for min-width, touch area, link contrast and duplicated semantic landmarks.
- **Changes:** page-level safe responsive width and high-contrast teal action text; 44px controls wherever smaller classes were present; redundant nested main landmarks flattened. Where an existing alias/page already satisfies these standards, it remains unchanged rather than adding a fictitious replacement. Headings, copy (including original campaign wording), tabs, navigation, data and permissions stay exact.
- **States:** existing `loading.tsx` plus explicit page data/denied/empty guards preserved; no optimistic writes or invented provider delivery. The route has no direct `DataTable` invocation; callers must supply `empty` when one is introduced.
- **Tests:** `tests/unit/chat5-ux-tpo-middle-third.test.ts` case `UX-tpo-recruiters-campaigns-batchid--01`. Source-level verification authored; orchestrator browser, assistive-technology and test execution is required before page list may be checked.

**Status:** source pass and audit note authored, full CI/device evidence pending.
