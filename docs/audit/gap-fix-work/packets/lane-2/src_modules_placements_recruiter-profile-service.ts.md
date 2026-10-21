# Work packet: edit src/modules/placements/recruiter-profile-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-10-025-055  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:137-141 — Scoped /me must show only selected-college grant.
- vNext now: src/modules/placements/recruiter-profile-service.ts:65-67; src/app/(authenticated)/hr/profile/page.tsx:112-120 — New self profile returns all context grants.
- Fix: Restrict scoped view to selected grant or explicit safe global mode

## G2-10-025-095  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:123-129 — Recruiter entity firstName,lastName,designation,contactMail,contactMobile.
- vNext now: src/modules/placements/recruiter-profile-service.ts:33-43 — Canonical users displayName/email/phoneE164 + profile title + contact digits table.
- Fix: Document field split, login phone vs public contact

## G2-14-016-035  [P1] GAP  facet F11  effort L
- Legacy: Legacy check requires usable recruiter, live college, active grant and capability `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAccessService.java:39-85`
- vNext now: New hasActiveRecruiter plus effective grant including verification `src/modules/placements/recruiter-profile-service.ts:16-25` `src/modules/placements/recruiter-grant-expiry-policy.ts:22-37`
- Fix: Reconcile all role, tenant, company and verification rules in auth matrix
