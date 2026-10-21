# Work packet: edit src/modules/placements/recruiter-grant-expiry-policy.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-14-016-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy recruiter enters college only with current grant capability `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAccessService.java:66-90`
- vNext now: New effective grant evaluated with active, verified, unexpired and capability `src/modules/placements/recruiter-grant-expiry-policy.ts:22-37`
- Fix: Document and migrate verification/expiry fields before enabling access

## G2-14-016-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy extend accepts 0 months for no end date `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:87-105`
- vNext now: New EXTEND rejects zero and requires expiry `src/modules/placements/tpo-recruiter-grant-write-model.ts:10-14` `src/modules/placements/recruiter-grant-expiry-policy.ts:5-19`
- Fix: Decide whether indefinite grants intentionally prohibited and surface migration policy

## G2-14-016-030  [P1] GAP  facet F10  effort L
- Legacy: Legacy checks ACTIVE, not deleted, and validUntil null or future `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-85`
- vNext now: New additionally requires VERIFIED, nonnull future validUntil `src/modules/placements/recruiter-grant-expiry-policy.ts:22-37`
- Fix: Backfill valid expiry and verification, keep access fail-closed

## G2-14-016-035  [P1] GAP  facet F11  effort L
- Legacy: Legacy check requires usable recruiter, live college, active grant and capability `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAccessService.java:39-85`
- vNext now: New hasActiveRecruiter plus effective grant including verification `src/modules/placements/recruiter-profile-service.ts:16-25` `src/modules/placements/recruiter-grant-expiry-policy.ts:22-37`
- Fix: Reconcile all role, tenant, company and verification rules in auth matrix

## G2-14-016-039  [P1] GAP  facet F12  effort L
- Legacy: Legacy ACTIVE plus null expiry grants indefinite access `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-85`
- vNext now: New null validUntil always denied `src/modules/placements/recruiter-grant-expiry-policy.ts:22-37`
- Fix: Define intentional forced-expiry policy and migrate open-ended grants

## G2-14-016-064  [P1] GAP  facet F22  effort M
- Legacy: Legacy null validUntil represents indefinite allowed `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:45-47` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-85`
- vNext now: New nullable but effective auth disallows null `src/db/schema/placements.ts:233-234` `src/modules/placements/recruiter-grant-expiry-policy.ts:22-37`
- Fix: Backfill cutoff dates or explicit grandfather treatment
