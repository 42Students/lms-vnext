# Work packet (wave 2): edit src/components/placements/learner-placement-job-detail.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md, docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-18-023-002  [P2] GAP  facet F01  effort M
- Legacy: Drive detail links rule checklist; placement rules from registration and offer actions; LearnerEligibilityController.java:23-25,102-107
- vNext now: vNext `Requirements & preferences`, `Eligibility breakdown`, link Review placement rules; learner-placement-job-detail.tsx:~110-230
- Fix: Keep deep links to rule details, registration, offer and calendar with legacy route redirects.

## G2-18-023-033  [P2] GAP  facet F13  effort M
- Legacy: Legacy invalid hidden ID throws 404, invalid company preview requires application, no list partial leakage; LearnerEligibilityController.java:59-160
- vNext now: VNext no preview route, general role status fallback; learner-placement-job-detail.tsx:~117-165
- Fix: Add explicit hidden-drive/preview-unavailable states with nonleaky retry and safe navigation.

## G2-18-023-038  [P2] GAP  facet F17  effort S
- Legacy: Backend read-only, frontend opens actionable Register/Rules via links; ApplyGate.java:28-45
- vNext now: VNext block links go to profile/applications/registration, no precise action mapping; learner-placement-job-detail.tsx:~125-185
- Fix: Ensure keyboard and screen-reader users receive primary blocker and correct destination, focus after navigation.

## G2-15-005-039  [P2] GAP  facet F09  effort M
- Legacy: Legacy single applied card includes receipt and View applications/Browse drives buttons (JobDetailContent.jsx:911-1012)
- vNext now: VNext only applied badge plus Ask to withdraw in role action and My applications page link (learner-placement-jobs.tsx:286-348; learner-placement-job-detail.tsx:283-299)
- Fix: Restore visually prominent applied panel and receipt buttons adjacent to application
