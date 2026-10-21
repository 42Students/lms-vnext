# U006 — AdminAssignmentContentWriteController gap audit v2

## Files read / citation aliases
- `LC` — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java`
- `LS` — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentContentWriteService.java`
- `LD` — `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java`
- `LM` — `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java`
- `LF` — `docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx`
- `LA` — `docs/legacy-source/frontend/src/api/Services/AdminAssignmentContentService.js`
- `NR` — `src/app/api/courses/assignments/route.ts`
- `NS` — `src/modules/courses/assignment-service.ts`
- `NV` — `src/modules/courses/assignment-validation.ts`
- `NF` — `src/modules/courses/faculty-assignment-authoring-service.ts`
- `NP` — `src/components/courses/college-assignment-create.tsx`
- `NB` — `src/db/schema/assessments.ts`
- `NM` — `src/db/schema/course-assignment-materials.ts`

Closure: administrator UI builder + REST client; Spring controller + LessonContentsDTO + AssignmentContentWriteService + LessonContents entity, including tenant and assignment validation and R2 metadata dependencies. vNext Post/GET course assignment route, typed service + validation, admin create panel, faculty authoring, course assignment and material models. Every `LC:44-60` citation resolves to the corresponding full file:1-based lines above. **Backend writer rather than entire listing scope**; UI-only facets cite its owning legacy builder. Do not interpret a missing direct authoring feature as unavailable in every other role until linked API verified.

## 23 mandatory facets, detailed gaps
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-006-001 | F01 | LC:24-27 dedicated POST /api/v1/admin/assignments/content/save | NR:34-55 POST /api/courses/assignments, generic create | GAP | P2 | Document old endpoint retirement and update all admin builders and clients. | S |
| G2-2-006-002 | F01 | LF:28-44 modal reached from admin assignment list; LA:4-5 API service | NP:91-100 inline create panel + NP:127 disclosure, not modal | GAP | P2 | Restore modal-style creation or approve inline-panel redesign. | S |
| G2-2-006-003 | F02 | LF:80-135 course/lesson/audience/details editor, LF:143-181 resources, LF:185-252 save | NP:100-163 Course/Lesson, Audience, Title, Points, disclosure Deadline/Instructions/Methods, confirm | GAP | P2 | Reproduce legacy order and dedicated resource steps. | S |
| G2-2-006-004 | F03 | LF:143-147 Add attachment type and resources, LF:163-181 upload handling | NP:127-140 only Instructions textarea/MethodPicker | MISSING | P1 | Implement 1-30 resource builder (INSTRUCTIONS, PDF, FILE, LINK) with title/reorder and upload. | S |
| G2-2-006-005 | F03 | LF:163-167 PDF-specific upload error toast, LF:185-189 wait uploads | NP:100-163 no authoring file upload controls | MISSING | P1 | Add typed file picker, in-progress indicator and prevent save until upload completes. | S |
| G2-2-006-006 | F03 | LF:254-261 dirty-close confirmation | NP:46-53 dirty close and NP:158-160 ConfirmDialog | MATCH | P3 | Preserve guard; test focus/escape. | S |
| G2-2-006-007 | F04 | LD:12-37 camel/snake fields lessonId,courseId,contentTitle,points,deadline,contentDataDTO | NV:34-60 lessonId,deliveryId,title,description,dueAt,allowedMethods,maxPoints,sequence | GAP | P2 | Document field-by-field API mapping and adapt legacy resource JSON. | S |
| G2-2-006-008 | F04 | LF:95-99 edit values from assignment, LF:103-125 loads full content data | NP:25-31 initial default create values, standalone edit via NS:186-205 | GAP | P2 | Use existing-resource detail loader in same admin edit UI, preserve scoped assignment identity. | S |
| G2-2-006-009 | F04 | LM:55-58 deadline is India wall-clock LocalDateTime | NB:41-43 timestamptz dueAt, NP:67 parseCollegeIstLocal | GAP | P2 | Preserve exact IST wall-clock interpretation when migrating legacy deadlines. | S |
| G2-2-006-010 | F05 | LC:44-60 single POST, no list pagination/table | NR:12-30 GET lesson-scoped list, NS:175-183 sequence sort | EXTRA | P3 | N/A to writer; list behavior covered by assignment oversight unit. | S |
| G2-2-006-011 | F06 | LC:51-53 requires contentType ASSIGNMENT and lessonId | NR:34-50 inferred assignment route; NV:34-37 lessonId UUID | GAP | P2 | Keep content-type invariance at route boundary and explicit lesson error. | S |
| G2-2-006-012 | F06 | LF:129-133 defaults points 0, audience ALL, methods WRITTEN_RESPONSE | NP:25-31 points 10, first lesson, methods ALL, audience shared | GAP | P2 | Restore exact initial defaults or document owner-approved redesign. | S |
| G2-2-006-013 | F06 | LS:284-285 title required trimmed max 255 | NP:116-118 input maxLength 200, NV:19-23 max 255 | GAP | P2 | Allow titles up to 255 in UI, match backend and legacy. | S |
| G2-2-006-014 | F06 | LS:300-301 points integer value 0..1000 | NP:39 and :56-59 UI 1..10000, NV:50-54 backend 0..10000 | GAP | P1 | Enforce shared 0–1000 legacy points range across UI/validation/schema. | S |
| G2-2-006-015 | F06 | LS:287-299 due date required and must be future on creation/change | NP:129 optional until publishing; NV:46-48 nullable dueAt | GAP | P1 | Decide on draft staging; if strict parity require due date for save and future check. | S |
| G2-2-006-016 | F06 | LS:152-164 1-30 resources and at least one distinct submission method | NP:60-61 one method, but no resource collection at all | MISSING | P1 | Build resource form and enforce count/unique methods/validation before save. | S |
| G2-2-006-017 | F06 | LS:172-182 resource title ≤255, one INSTRUCTIONS, nonempty sanitized HTML | NP:133-136 plain textarea 10000, no resource title/type or rich HTML | GAP | P1 | Restore typed resource editor, single instructions rule, HTML sanitizer. | S |
| G2-2-006-018 | F06 | LS:184-199 LINK requires HTTPS; PDF/FILE validate key/size | NM:7-21 only LINK materials (title ≤160, sequence ≤19), NP no authoring list | MISSING | P1 | Implement full PDF/FILE/LINK/INSTRUCTIONS set with HTTPS+file checks. | S |
| G2-2-006-019 | F06 | LS:222-239 assignment identity lesson/course immutable; faculty cannot alter class | NS:288-301 authorizes by assignment; updates omit lessonId/deliveryId | MATCH | P3 | Retain immutable lesson/audience on generic update. | S |
| G2-2-006-020 | F06 | LS:247-272 after submissions title-only edits remain allowed | NS:305-310 rejects any admin update if a submission exists | GAP | P1 | Allow title-only corrections after submissions, lock other fields. | S |
| G2-2-006-021 | F07 | LC:47-50 exact forbidden 'Admin access required' | NS:239-246 centralized courses.manage guard | GAP | P2 | Map rejected admin mutation to exact response copy and HTTP 403 as appropriate. | S |
| G2-2-006-022 | F07 | LC:51-53 exact 'Assignment and lesson are required' | NV:34-60 Zod error shape, NR:56-57 generic API error | GAP | P2 | Map missing lesson to legacy field-level/error banner wording. | S |
| G2-2-006-023 | F07 | LC:54-57 'Lesson not found', 'Cannot resolve college scope' | NS:215-247 scoped loader/requirePermission errors | GAP | P2 | Preserve distinct not-found versus unscoped forbidden states. | S |
| G2-2-006-024 | F07 | LS:153-156 'Assignment requires 1 to 30 resources' | NP:100-163 no resource collection; create can succeed without resources | MISSING | P1 | Fail missing-resource saves with exact message on legacy-compatible path. | S |
| G2-2-006-025 | F07 | LS:157-164 'Choose distinct valid submission methods' | NP:60-61 only empty methods validation | GAP | P2 | Reject duplicates and invalid methods in both client and API with exact message. | S |
| G2-2-006-026 | F07 | LS:284-301 exact title/points/deadline errors | NP:57-70 generic 1-10000/title and date messages | GAP | P2 | Align precise validation messages per field. | S |
| G2-2-006-027 | F07 | LS:127-149 precise file key, MIME, size and unavailable checks | NP:100-163 no PDF/FILE upload entry | MISSING | P1 | Port field and server errors for bad file metadata and storage outage. | S |
| G2-2-006-028 | F08 | LC:59-60 returns Response OK 'Assignment saved' | NR:52-55 201 {assignment}, NP:86 success 'Assignment draft created. Publish it...' | GAP | P2 | Preserve legacy success semantics or explicitly migrate to staged-publish UX. | S |
| G2-2-006-029 | F08 | LF:234-246 toast 'Assignment created'/'Assignment updated', failure 'Failed to save assignment' | NP:80-88 generic error and inline success, no same toast | GAP | P2 | Restore exact legacy toast variants if clone requirement includes operations feedback. | S |
| G2-2-006-030 | F09 | LF:28-44 AdminAssignmentBuilderModal, LF:254-261 confirm when dirty | NP:100 inline form, NP:153-160 confirm create/discard | GAP | P2 | Restore modal shell (course/lesson/section, resources, submit); preserve discard confirm. | S |
| G2-2-006-031 | F09 | LF:149-181 upload control and UploadFromLinkButton import | NP:100-163 no upload/link importer | MISSING | P1 | Add upload/from-link UI with safe server attestation. | S |
| G2-2-006-032 | F10 | LC:44-60 POST save with @Valid DTO, writer.save returns LessonContents | NR:34-55 create only; PATCH elsewhere, returns {assignment} | GAP | P2 | Map create/update to typed endpoints preserving expected response or formally version contract. | S |
| G2-2-006-033 | F10 | LS:207-321 @Transactional save updates old content row, class, resources, submissions and flags | NS:249-269 inserts course_assignments DRAFT only; no resource transaction | GAP | P1 | Persist resource structures atomically with assignment metadata, preserve legacy edit semantics. | S |
| G2-2-006-034 | F10 | LS:313-321 new row sets facultyId null for super-admin, active/enabled true | NB:60-64 createdByUserId required; NB:46-48 defaults DRAFT | GAP | P2 | Map author identity and enabled/active flags to staged status model explicitly. | S |
| G2-2-006-035 | F10 | LS:245-272 prevents deadline/points/resources/audience changes after learner submissions | NS:305-310 rejects any update after submission | GAP | P1 | Support legacy title-only edits; preserve all other post-submission immutable fields. | S |
| G2-2-006-036 | F11 | LC:46-50 superadmin or faculty type ADMIN, explicit 403 | NS:239-246 `courses.manage` for shared, NS:219-237 delivery-scoped requireDeliveryContentMutation | GAP | P1 | Verify super-admin acting-college and ADMIN-only scopes; ensure faculty cannot use admin shared authoring. | S |
| G2-2-006-037 | F11 | LC:54-58 resolves lesson->course->college and requirePerformAdminActionForCollege | NS:215-247 loads offering scope and central permission | MATCH | P3 | Preserve scoped permission chain and cross-tenant denial. | S |
| G2-2-006-038 | F12 | LS:81-103 faculty teaching or admin/superadmin, class-college and active audience checks | NS:219-247 offering/delivery scope checks; class IDs replaced with delivery UUID | GAP | P2 | Verify current class audience and teaching authorization on create/edit against legacy. | S |
| G2-2-006-039 | F12 | LS:247-272 submitted assignment cannot disable or modify except title | NS:305-310 no edit whatsoever after submissions; NF:84-86 title-only faculty | GAP | P1 | Align admin title-only edit with existing faculty model. | S |
| G2-2-006-040 | F12 | LS:277-283 soft-disable when enabled=false without resource payload | NS:403-425 transition PUBLISH/ARCHIVE rather than enabled boolean | GAP | P2 | Map legacy soft disable to ARCHIVE and prevent submission history loss. | S |
| G2-2-006-041 | F12 | LS:175-183 one INSTRUCTIONS, server-sanitized HTML | NP:133-136 plain textarea in disclosure | GAP | P2 | Carry rich-content sanitization and instruction resource rules. | S |
| G2-2-006-042 | F13 | LF:30-35 lessons/classes/details loading + error states, LF:185-189 blocks uploads | NP:98-100 no-lessons state; :71-90 pending/error; no upload-loading | GAP | P2 | Restore detailed class/options-loading failures and upload pending guard. | S |
| G2-2-006-043 | F13 | LF:103-128 edit detail failure warns 'Assignment details could not be loaded. Refresh and retry.' | NP:100-163 creation only; update in standalone actions | GAP | P2 | Provide scoped edit-detail loading/error and safe retry. | S |
| G2-2-006-044 | F14 | LF:163-183 presigned PDF/FILE R2 direct upload, Link importer LF:8-10 | NP:100-163 none; NM:7-21 links only materials | MISSING | P1 | Add persisted scanned/attested file materials (PDF/FILE), upload and from-link controls. | S |
| G2-2-006-045 | F14 | LS:105-149 enforces tenant key org/college assignments, 50MiB limit, file metadata | NM:7-21 no file materials; NP no size checking | MISSING | P1 | Design vNext tenant-scoped private-file grants and verify size/MIME/virus attestation. | S |
| G2-2-006-046 | F15 | LC:44-60 no emails or notifications emitted by admin save directly | NS:249-269 insert only; no email/send in creation path | MATCH | P3 | N/A direct email on save; learner publication notifications separate. | S |
| G2-2-006-047 | F16 | LF:28 modal AntD responsive; resource upload/scroll content | NP:91-100 small-screen stack and sm:two-column fields, no modal | GAP | P2 | Compare phone/tablet layouts and modal scroll/focus; restore upload touch controls. | S |
| G2-2-006-048 | F17 | LF:28-29 AntD Modal+Form validation/error per field | NP:100 role region, labels, Alert and ConfirmDialog, no legacy modal keyboard context | GAP | P2 | Validate focus trapping, Escape/return focus and error announcements for clone. | S |
| G2-2-006-049 | F18 | LF:234-235 'Assignment created' toast | NP:86 'Assignment draft created. Publish it to let learners submit.' | GAP | P3 | Match exact notification text or record deliberate draft UX. | S |
| G2-2-006-050 | F18 | LF:129-130 points 0 and audience ALL; NP:116-125 Title/Points, Audience shared | NP:25-31 points 10, methods all; :108 Audience label | GAP | P2 | Restore wording/default values per legacy copy source. | S |
| G2-2-006-051 | F19 | LS:208-321 transactional save, one lesson lookup and class scope checks | NS:249-269 single insert, NP:65-66 local sections list and filters | GAP | P2 | Avoid high-volume option fetch and guarantee resources atomicity. | S |
| G2-2-006-052 | F20 | LF:43-44 request token prevents stale lesson/class lookup races, LF:199-208 stale version warning | NS:305-312 locks row and optional timestamp token | GAP | P1 | Require expectedUpdatedAt on admin edit and protect read-modify-save race with robust CAS. | S |
| G2-2-006-053 | F20 | LS:296-298 India clock determines future deadline | NP:67 IST parser; NS:259-261 JS Date instant, publish NS:413-418 | GAP | P2 | Test DST-free IST wall-clock, seconds truncation and future cutoff in all entry paths. | S |
| G2-2-006-054 | F20 | LS:146-149 sanitizes original filename, LS:180-203 sanitizes HTML | NP:133-136 plain text; NM:19 URL constraints | GAP | P2 | Add equivalent HTML/filename safety in full resources editor. | S |
| G2-2-006-055 | F21 | LS:18,105-149 R2StorageUtils HEAD metadata verification, fails 503 on outage | NM:7-21 links-only material table, no private file grant in NP | MISSING | P1 | Wire vNext attested R2 upload lifecycle and safe retries. | S |
| G2-2-006-056 | F21 | LF:8-10 UploadFromLinkButton and uploadFileViaPresign | NP:100-163 no authoring storage integration | MISSING | P1 | Integrate link import and upload with tenant-based access checks. | S |
| G2-2-006-057 | F22 | LM:17-70 lesson_contents row stores content_data JSON, classId, facultyId, active/enabled, deadline wall-clock, version | NB:26-74 separate course_assignments with deliveryId, description, status, methods JSON, timestamp with zone, updatedAt | GAP | P1 | Write field-level migration mapping and preserve versions, audience, content resource payload. | S |
| G2-2-006-058 | F22 | LS:152-164 1-30 typed resources nested JSON | NM:7-21 normalized links only max sequence 19; lacks PDF/FILE/INSTRUCTIONS | GAP | P1 | Add appropriate normalized/material payload tables and constraints for all types. | S |
| G2-2-006-059 | F22 | LM:68-70 optimistic @Version persistent | NB:70-74 updatedAt but no integer version; NS:311-312 conditional optional version check | GAP | P1 | Require non-optional CAS token for admin edits, including post-submission title edits. | S |
| G2-2-006-060 | F22 | NB:77-135 unique active lesson/title/sequence indexes (not in LC writer) | LM:17-70 lesson_contents entity includes no equivalent uniqueness evidence | EXTRA | P3 | Preserve uniqueness hardening; align duplicate-name errors. | S |
| G2-2-006-061 | F23 | LC:44-60 single save creates active/enabled assignment with required deadline | NB:46-48 DRAFT, NP:129 optional deadline until publish | EXTRA | P2 | Explicitly record intentional draft/publish split and migration owner decision. | S |
| G2-2-006-062 | F23 | LF:143-181 rich resources and attachments supported by legacy | NP:100-163 not included, NM:7-21 link-only | MISSING | P1 | Restoration prerequisite before claiming exact admin assignment authoring parity. | S |

## Unit summary
- **Rows:** 62. **Verdicts:** GAP 43; MISSING 12; MATCH 4; EXTRA 3. **Severity:** P2 31; P1 24; P3 7.
- **Top gap 1 (P1):** Legacy typed 1-30 resource builder, safe file uploads, HTTPS links, storage attestation and required instructions are not implemented in the vNext admin-create path; schema is link-only (F03/F06/F14/F21/F22).
- **Top gap 2 (P1):** API and business validation diverge: 0-1000 legacy points vs 1-10000 UI, mandatory future deadline vs optional draft, different defaults and methods, title max 200 UI vs 255 backend (F06/F07).
- **Top gap 3 (P1):** Legacy post-submission title corrections and record-version concurrency conflict handling are not preserved in admin update (F06/F10/F12/F20/F22).

### UNKNOWN / runtime checks
- Validate exact backend responses/field errors on real client for course, lesson and class scope; DTO @Valid is present, but role middleware and deployed DB migrations are independent checks.
- Verify all file storage calls in an authenticated college selected-scope environment and the difference between legacy public R2 keys and vNext private scanned grants.
- Verify responsive modal keyboard behavior at mobile/tablet widths; static source cannot certify pixel-level or screen-reader behavior.
