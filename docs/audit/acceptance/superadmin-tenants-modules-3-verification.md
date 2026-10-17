# Super Admin Tenants / Modules 3 — verification

Audit: `docs/audit/pages/superadmin/tenants-modules-3.md`.

These tests are written but not run by chat-4. They verify source contracts and,
for SA-tenants-modules-61, live Zod validation. Integration acceptance for
side effects and authorization must be executed by the orchestrator.

| ID | Status | Evidence |
|---|---|---|
| SA-tenants-modules-41 | DONE | `src/app/(authenticated)/activity/page.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-41` |
| SA-tenants-modules-42 | DONE | `src/app/(authenticated)/activity/page.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-42` |
| SA-tenants-modules-51 | DONE | `src/components/admin/inbound-mail-list.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-51` |
| SA-tenants-modules-52 | DONE | `src/app/(authenticated)/admin/inbound-mail/page.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-52` |
| SA-tenants-modules-55 | DONE | `src/modules/inbound-mail/admin-service.ts`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-55` |
| SA-tenants-modules-56 | DONE | `src/modules/inbound-mail/admin-service.ts`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-56` |
| SA-tenants-modules-58 | DONE | `src/components/announcements/super-admin-college-broadcast-form.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-58` |
| SA-tenants-modules-59 | DONE | `src/app/(authenticated)/admin/announcements/page.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-59` |
| SA-tenants-modules-61 | DONE | `src/modules/announcements/super-admin-college-broadcast-model.ts`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-61` |
| SA-tenants-modules-62 | DONE | `src/modules/announcements/super-admin-college-broadcast-service.ts`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-62` |
| SA-tenants-modules-63 | DONE | `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-63` |
| SA-tenants-modules-65 | DONE | `src/components/verification/SuperAdminVerificationPanel.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-65` |
| SA-tenants-modules-66 | DONE | `src/components/verification/SuperAdminVerificationPanel.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-66` |
| SA-tenants-modules-44 | DONE | `src/app/(authenticated)/activity/page.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts`, `SA-tenants-modules-44` |
 
Remaining unclosed work includes SA-tenants-modules-43/45/46/47/48/49/50/53/54/57/60/64/67/68 and other unverified audit rows. These are not BLOCKED merely because they require significant implementation.
| SA-tenants-modules-67 | DONE | `src/modules/verification/review-reasons.ts`, `src/components/verification/VerificationReviewDrawer.tsx`, `SuperAdminVerificationPanel.tsx`, `TpoVerificationPanel.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts` test `SA-tenants-modules-67`: section-specific presets, correctly titled send-back confirmation, and persisted-decision success feedback. |
| SA-tenants-modules-43 | DONE | `activity-center.tsx` shows actor/action/subject sentences, day grouping, tone and sanitized expandable metadata; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts` test `SA-tenants-modules-43`. |
| SA-tenants-modules-45 | DONE | `activity/service.ts` counts older scoped events for 50-row pages and activity center renders remaining count; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts` test `SA-tenants-modules-45`. |
