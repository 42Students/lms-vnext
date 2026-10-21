# Work packet: edit src/modules/projects/mentor-reassignment-workload-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md

## G2-7-021-016  [P1] GAP  facet F04  effort M
- Legacy: reassign-mentor.js:127-153 list contains every nonarchived project and workload active counts
- vNext now: mentor-reassignment-workload-service.ts:72-95 workload excludes ARCHIVED and COMPLETED
- Fix: Include completed-but-not-archived projects in workload or clarify legacy Active definition

## G2-7-021-055  [P1] GAP  facet F12  effort M
- Legacy: reassign-mentor.js:109 excludes only ARCHIVED, includes READY and other nonarchived
- vNext now: mentor-reassignment-workload-service.ts:89-92 workload excludes COMPLETED, list excludes archived only
- Fix: Make workload and table use consistent nonarchived status set

## G2-7-021-059  [P1] GAP  facet F12  effort M
- Legacy: reassign-mentor.js:127-153 workload count from all nonarchived projects
- vNext now: mentor-reassignment-workload-service.ts:72-95 server aggregate with status exception
- Fix: Match legacy workload denominator and at-risk grouping
