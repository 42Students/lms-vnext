# Work packet: edit src/modules/people/college-faculty-detail-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md

## G2-19-019-039  [P1] GAP  facet F13  effort M
- Legacy: FacultyTeachingAssignmentServiceImpl.java:201-236 annotates unresolved faculty/course/class/batch as metadataIncomplete, does not present healthy unnamed entity
- vNext now: src/modules/people/college-faculty-detail-service.ts:68-120 inner joins current delivery/course; orphan rows may disappear
- Fix: Expose orphan/degraded records in authorized admin audit instead of silently filtering them via joins
