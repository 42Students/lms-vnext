# UX rollout — /activity/[eventId]

- Scope: `src/app/(authenticated)/activity/[eventId]/page.tsx`; tests `UX-activity-event-detail-01`.
- Before: event detail had no breadcrumb and lengthy structured metadata could crowd narrow displays; plain card styling duplicated shared primitive; navigation target lacked a strong focus outline.
- Changes: shared Breadcrumbs and Card; breadcrumb derives last label from the existing event summary (no invented copy); event timestamp marked up as a machine-readable time while still displayed in en-IN/IST; long metadata confined to an independent scroll area with mobile padding, safe focusable Back link.
- States: Super Admin/College Admin guard, missing record -> notFound, existing safe redaction and graceful loading/error retained.
- Verification: `tests/unit/UX-activity-event-detail-01.test.ts` authored, not executed; source-only until CI and device capture. Checklist unticked until tests pass.
