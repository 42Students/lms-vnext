# Work packet (wave 2): edit src/modules/people/learner-profile-section-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-5/u019-learner.md

## G2-1-004-020  [P2] GAP  facet F05  effort M
- Legacy: `LearnerProfileServiceImpl.java:153-169` education sorted by most recent and start/end year on read.
- vNext now: `learner-profile-section-service.ts:43-51` returns stored JSON order without derived sort.
- Fix: Apply non-destructive legacy education view sort.

## G2-1-004-038  [P2] GAP  facet F10  effort M
- Legacy: `LearnerProfileController.java:157-176` best-effort profile audit for sensitive changes.
- vNext now: `learner-profile-section-service.ts:61-69` activity event and `learner-profile-document-edit-service.ts:39-44` emits event.
- Fix: Map legacy actions and actor/subject metadata to activity taxonomy.

## G2-1-004-041  [P2] GAP  facet F11  effort M
- Legacy: `LearnerProfileController.java:178-192` actor-specific write rights extend beyond self in legacy.
- vNext now: `learner-profile-section-service.ts:15-32` permits only active owning learner.
- Fix: Document approved staff-edit restriction or create guarded correction workflow.

## G2-1-004-042  [P2] GAP  facet F12  effort M
- Legacy: `LearnerProfileServiceImpl.java:153-169` normalized and sorted qualification list.
- vNext now: `learner-profile-section-service.ts:43-51` preserved client order.
- Fix: Provide legacy view sort with no physical reorder.

## G2-1-004-056  [P2] GAP  facet F19  effort L
- Legacy: `LearnerProfileServiceImpl.java:455-469` education query uses Qualifications repository.
- vNext now: `learner-profile-section-service.ts:20-72` reads JSONB single profile.
- Fix: Check downstream eligibility queries are pointed to document qualifications.

## G2-1-004-063  [P2] GAP  facet F22  effort L
- Legacy: `LearnerProfileServiceImpl.java:153-169` qualification read sorted and stored in separate table.
- vNext now: `learner-profile-section-service.ts:36-59` UUID array under JSONB.
- Fix: Reconcile eligibility/reporting to JSON-backed qualification data.

## G2-5-019-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/learn/profile` uses one learner entity `docs/legacy-source/frontend/src/pages/learn/profile.js:1-30`
- vNext now: VNext self-profile section editor targets membership `src/modules/people/learner-profile-section-service.ts:13-19`
- Fix: Verify entry route/menu and section links on live UI.

## G2-5-019-044  [P2] GAP  facet F10  effort M
- Legacy: Legacy learner row persists JSON and cascaded Qualification records `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:163-181`
- vNext now: VNext uses transactional `jsonb_set` under profile row lock `src/modules/people/learner-profile-section-service.ts:34-60`
- Fix: Preserve child qualification updates and atomicity.

## G2-5-019-052  [P2] GAP  facet F13  effort M
- Legacy: Legacy active roster excludes suspended/deleted learners `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerRepository.java:14-27`
- vNext now: New profile writes require membership and user ACTIVE `src/modules/people/learner-profile-section-service.ts:21-32`
- Fix: Align empty and filtered roster semantics.
