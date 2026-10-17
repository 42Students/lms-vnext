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

| SA-tenants-modules-50 | DONE | `src/components/tracker/audit-finding-filter-memory.tsx`, `src/app/(authenticated)/tracker/audit-findings/page.tsx`; `tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts` test `SA-tenants-modules-50`: remembered allowlisted filters, harmless board-local restoration, explicit default reset |

## Chat-6 UNCONFIRMED decisions, 2026-10-18

| SA-tenants-modules-54 | BLOCKED (provider credentials) | Inbound receiver may only run with verified signed provider and safe tenant threading; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-tenants-modules-54` |
| SA-tenants-modules-60 | NOT-A-GAP (row granularity) | Per-college broadcast notices preserve independent retries and audit; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-tenants-modules-60` |
| SA-tenants-modules-68 | DONE (source) | VerificationReviewDrawer has 50-event history and masked identity-number guidance; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-tenants-modules-68` |

## chat-13 2026-10-18 independent Activity and Tracker cross-check
| Gap | Decision | Evidence |
|---|---|---|
| SA-tenants-modules-43 | DONE (source) | Activity feed groups by day and retains safe metadata descriptions. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-43` (written, not run). |
| SA-tenants-modules-45 | DONE (source) | Activity uses a bounded 50-event page and grouped timeline. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-45` (written, not run). |
| SA-tenants-modules-46 | PARTIAL (source) | Recorded import state is shown; manual GitHub Sync now is not configured. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-46` (written, not run). |
| SA-tenants-modules-47 | DONE (source) | Finding detail mutations include severity, assignee, duplicate, fix commit, comment and status. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-47` (written, not run). |
| SA-tenants-modules-48 | DONE (source) | Audit board has Open / Release / All and severity filters. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-48` (written, not run). |
| SA-tenants-modules-50 | DONE (source) | Audit board remembers allowlisted filters in localStorage. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-50` (written, not run). |
| SA-tenants-modules-54 | BLOCKED (source) | Inbound mail provider signature/credentials must be verified before intake can run. Provider proof required. |
| SA-tenants-modules-60 | NOT-A-GAP (source) | Selected-college broadcast preserves separate receipt/retry/audit records; one synthetic row would obscure deliveries. Owner decision retained. |
| SA-tenants-modules-67 | DONE (source) | Verification drawer supports section-specific SEND_BACK workflows and feedback. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-67` (written, not run). |
| SA-tenants-modules-68 | DONE (source) | Verification drawer shows persisted decision history and masked-ID posture. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-68` (written, not run). |

### Chat-4 follow-up acceptance, 2026-10-18

| SA-tenants-modules-47 | PARTIAL (transactional safety) | independent-audit-findings-service.ts prevents chained duplicate findings, clears duplicateOf after reasoned reopen, and keeps status transitions under locked transaction. tests/unit/chat4-independent-findings-transition.test.ts tests SA-tenants-modules-47. Full history and candidate search still need acceptance. |
| SA-tenants-modules-48 | PARTIAL (corrected query) | independent-audit-findings-service.ts now has a valid SQL facet block with source path/JSONB path search, explicit view/area/kind filters and independent status/severity counts scoped by persisted authorization. tests/unit/chat4-independent-findings-filters.test.ts tests SA-tenants-modules-48. No browser/database test run. |

Source inspections and regression tests authored, **not executed**. No UX page restyling is part of these records.
