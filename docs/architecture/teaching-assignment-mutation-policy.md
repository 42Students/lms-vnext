# Teaching-assignment mutation compatibility policy

**Decision:** Retire destructive legacy faculty-course association replacement and hard deletion. Preserve audit/history and vNext's class/semester delivery + college membership boundaries. This is a deliberate lifecycle change, not a route omission.

## Legacy operation crosswalk

| Legacy Spring endpoint | Former behavior | Authorized vNext replacement |
| --- | --- | --- |
| `PUT /api/v1/faculty-teaching-assignments/update/{id}` | Overwrite faculty, course/section and assignment fields | Change only `PRIMARY`/`CO_TEACHER` role with `PATCH /api/courses/teaching-assignments/{assignmentId}`. To replace the faculty or class, end the old row and create a new one under the target delivery. |
| `DELETE /api/v1/faculty-teaching-assignments/delete/{id}` | Physically remove association | Intentionally unsupported; use lifecycle `DELETE /api/courses/teaching-assignments/{assignmentId}`, which sets `endedAt` and retains history. |
| `PUT /api/v1/faculty-teaching-assignments/deactivate/{id}` | Soft-deactivate association | Lifecycle `DELETE` above, with a stable `endedAt` and history. |
| Legacy integer association IDs | Numeric primary keys | The vNext route may resolve a verified same-college `legacyIdMap` crosswalk; never infer a UUID or look up across colleges. |

## Why these mutations differ

vNext teaching authorization is attached to a concrete course delivery and a college membership. A wholesale reassignment would silently mutate teaching access for learner data, existing assessments, grades and activity/audit history. Preserve the old association as ended, then create a scoped, active association for the replacement teacher/section. Hard-deleting a historical teaching row would remove provenance relevant to attendance and content.

The same-origin write routes must recheck the authenticated principal's persisted `courses.manage` permission and the target college/delivery. A cross-college full-update request is not converted to a series of writes. Version and uniqueness conflicts remain visible. `includeEnded=true` on the guarded list read is the supported history view.

## Affected administrative workflows

College Admin course/section faculty allocation, Super Admin acting-college academic setup, faculty reassignments during semester promotion, historical audit reports, and bulk association imports must use the explicit `end → create` lifecycle. Callers must not assume `DELETE` means physical removal or that a legacy `PUT` can move an assignment between colleges.

Restore full-update/hard-delete only after a separate owner-approved migration and explicit downstream academic-history impact review. Neither operation is available through the vNext public API at this time.
