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

### Chat-4 functional findings work (2026-10-18; tests written, not executed)

| ID | Status | Evidence |
|---|---|---|
| SA-tenants-modules-47 | PARTIAL | `src/modules/bug-tracker/independent-finding-transition-model.ts` adds guarded NEW / CONFIRMED / IN_PROGRESS / FIXED_DEV / RELEASED_PROD / VERIFIED transitions. `independent-audit-findings-service.ts` enforces them under row lock; the PATCH endpoint returns a recoverable 422; action editor disables impossible transitions. `tests/unit/chat4-independent-findings-transition.test.ts` tests named `SA-tenants-modules-47`. Other legacy actions such as duplicate picker and similar-finding discovery still need full acceptance. |
| SA-tenants-modules-48 | PARTIAL | `src/modules/bug-tracker/independent-audit-findings-service.ts` aggregates persisted status counts and critical-open count via SQL grouping over the same authorized filters; `tracker/audit-findings/page.tsx` shows count-bearing status shortcuts. `tests/unit/chat4-independent-findings-filters.test.ts` tests `SA-tenants-modules-48`. Full legacy Area option and release-blocker semantics remain to validate. |
| SA-tenants-modules-49 | DONE (source; test pending) | `src/modules/bug-tracker/independent-finding-copy-model.ts` builds a bounded-context prompt with JSON data treated explicitly as untrusted evidence; `src/components/tracker/independent-finding-copy-action.tsx` adds the explicit Copy for Claude clipboard action with accessible fallback on detail page. `tests/unit/chat4-independent-finding-copy.test.ts` names `SA-tenants-modules-49`. |

| SA-tenants-modules-57 | DONE (source; execution pending) | `src/modules/announcements/super-admin-college-broadcast-service.ts` restricts selected/all audience to active colleges with a live active TPO membership, independently rechecks the reviewed audience, and delivers persisted notices to active TPO recipients only; `src/components/announcements/super-admin-college-broadcast-form.tsx` shows Every placement cell. Decision: colleges with no active TPO account have no responsible placement-cell receiver and are intentionally excluded. `tests/unit/chat4-gap-verified-cross-role-round2.test.ts` test `SA-tenants-modules-57`. |
