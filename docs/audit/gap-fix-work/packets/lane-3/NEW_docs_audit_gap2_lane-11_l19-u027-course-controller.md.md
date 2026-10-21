# Work packet: NEW / MISSING items from docs/audit/gap2/lane-11/l19-u027-course-controller.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md

## G2-19-027-009  [P1] GAP  facet F04  effort L
- Legacy: Create request fields `course_name`, `short_title`, `dept_id`, `parent_course_id`, `active`, `enabled`, `allowed_for_display`, `meta_data`, optional created_by_org_id; CourseDTO.java:12-31
- vNext now: vNext `{departmentId,name,code,shortTitle,officialCode,cardColor,takeaways,description}` strict input; validation.ts:15-65
- Fix: Document per-field semantic/JSON-key mapping and decide legacy visibility/parent/metadata fields; reject spoofed creator organization.

## G2-19-027-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy validates short_title required/max255, course_name required/max255, dept_id positive; CourseDTO.java:14-21
- vNext now: vNext name required max255, code required max64 regex, shortTitle optional max120; validation.ts:15-55
- Fix: Align Short display name required in Super Admin entry and maximum to chosen legacy value, allow no internal code or document generation.
