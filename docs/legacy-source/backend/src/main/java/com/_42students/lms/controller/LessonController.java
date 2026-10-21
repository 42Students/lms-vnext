package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.LessonDTO;
import com._42students.lms.dto.response.Datum;
import com._42students.lms.dto.response.LessonResponseDTO;
import com._42students.lms.dto.response.PointsResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.StudentAssignment;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/lesson")
@Slf4j
@Validated
public class LessonController extends BaseController {

    @Autowired
    LessonService lessonService;

    @Autowired
    CourseSlugResolver courseSlugResolver;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    /**
     * Lessons are admin-managed structure, so every lesson mutation needs college-admin rights on
     * top of course scope — requireAccessCourse alone is satisfied by any enrolled learner (its
     * learner branch only checks that the course is taught to their class) and by any faculty in
     * the college. Mirrors CourseController's guard for the course record itself.
     *
     * <p>A global superadmin is allowed outright rather than routed through
     * requirePerformAdminActionForCollege, because that method fails closed on a null collegeId —
     * so an unresolvable course would otherwise lock even a global superadmin out of lesson
     * management. Scoped superadmins are already constrained by the JWT-scope checks at each call
     * site, and still go through the college check below.
     */
    private void requireLessonAdminRights(UserPrincipal principal, int courseId) {
        if (accessControlService.isGlobalSuperAdmin(principal)) return;
        Integer collegeId = scopeResolutionService != null
                ? scopeResolutionService.resolveCourseToCollegeId(courseId)
                : null;
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
    }

    /**
     * Reorders a course's lessons in one request.
     *
     * <p>Lesson sequence was a number typed into a modal, one lesson at a time — reordering a
     * twelve-lesson course meant twelve modals and twelve numbers, and a mistake left two lessons
     * sharing a position with nothing on screen showing it. Taking the whole sequence at once
     * keeps the ordering internally consistent and lets the console offer drag-and-drop.
     *
     * <p>Sequence is assigned from position in the submitted list rather than trusted from the
     * client, so duplicate or sparse orders cannot be produced. Every lesson is checked to belong
     * to the named course before anything is written: without that, passing another course's
     * lesson id would rewrite its position from outside its own scope.
     */
    @org.springframework.web.bind.annotation.PutMapping("/reorder")
    @ApiOperation(value = "Reorder a course's lessons", notes = "Requires college-admin rights on the course.")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity reorderLessons(@RequestBody java.util.Map<String, Object> body,
                                         javax.servlet.http.HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        Object rawCourseId = body != null ? body.get("courseId") : null;
        Object rawIds = body != null ? body.get("lessonIds") : null;
        if (!(rawCourseId instanceof Number) || !(rawIds instanceof java.util.List)) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "courseId and lessonIds are required", null), HttpStatus.BAD_REQUEST);
        }
        int courseId = ((Number) rawCourseId).intValue();
        java.util.List<?> rawList = (java.util.List<?>) rawIds;
        if (rawList.isEmpty()) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "lessonIds must not be empty", null), HttpStatus.BAD_REQUEST);
        }
        requireLessonAdminRights(principal, courseId);

        java.util.List<Integer> orderedIds = new java.util.ArrayList<>();
        for (Object o : rawList) {
            if (!(o instanceof Number)) {
                return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "lessonIds must be numeric", null), HttpStatus.BAD_REQUEST);
            }
            orderedIds.add(((Number) o).intValue());
        }

        try {
            int updated = lessonService.reorderLessons(courseId, orderedIds);
            if (auditLogService != null) {
                auditLogService.log(httpRequest, "LESSON_REORDER", "lesson", String.valueOf(courseId),
                        null, null, java.util.Map.of("count", String.valueOf(updated)));
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Lesson order updated", updated), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a lesson for course", notes = "Requires course access.")
    public ResponseEntity createLesson(@javax.validation.Valid @RequestBody LessonDTO lessonDTO,
                                       javax.servlet.http.HttpServletRequest httpRequest)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        int resolvedCourseId = courseSlugResolver.resolve(lessonDTO.getCourseSlug(), lessonDTO.getCourseId());
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
            Integer collegeId = scopeResolutionService.resolveCourseToCollegeId(resolvedCourseId);
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create lessons in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create lessons within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        // requireAccessCourse alone is NOT sufficient here: for a learner it returns true for any
        // course their class is taught (canAccessCourse's learner branch), and for a non-learner it
        // reduces to a plain college match. Without the admin check below, any enrolled learner
        // could create lessons in their own course, and any faculty could add lessons to courses
        // they don't teach. Lessons are an admin-managed structure (the only UI is the admin
        // console's Lessons screen — faculty author lesson *contents*, not lessons), so require
        // college-admin rights on top of scope, exactly as CourseController does for courses.
        requireLessonAdminRights(principal, (resolvedCourseId));
        Lesson lesson = lessonService.createLesson(lessonDTO);
        if (auditLogService != null && lesson != null) {
            Integer collegeId = scopeResolutionService != null
                    ? scopeResolutionService.resolveCourseToCollegeId(resolvedCourseId) : null;
            auditLogService.log(httpRequest, "LESSON_CREATE", "lesson", String.valueOf(lesson.getId()), null, collegeId,
                    java.util.Map.of(
                            "lessonName", lesson.getLessonName() != null ? lesson.getLessonName() : "",
                            "courseId", resolvedCourseId));
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),lesson), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetch", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get lessons for a course", notes = "Use courseSlug or courseId; requires course access.")
    public ResponseEntity getLessons(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(securityContextUtil.getAuthenticatedUserPrincipal(), resolvedCourseId);
        List<Lesson> lessons = lessonService.getLessons(resolvedCourseId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessons), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchAll", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get lessons", notes = "Super-admin: all lessons. Others: lessons for principal's college only.")
    public ResponseEntity getAllLessons() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        List<Lesson> lessons;
        if (accessControlService.isSuperAdmin(principal)) {
            Integer scopedCollegeId = principal != null ? principal.getCollegeId() : null;
            Integer scopedOrgId = principal != null ? principal.getOrganizationId() : null;
            if (scopedCollegeId != null) lessons = lessonService.findByCollegeId(scopedCollegeId);
            else if (scopedOrgId != null) lessons = lessonService.findByOrganizationId(scopedOrgId);
            else lessons = lessonService.findAll();
        } else if (principal != null && principal.isLearner()) {
            // A learner previously received EVERY lesson in their whole college here — including
            // courses in other departments and programs they have no enrolment in — which
            // bypassed the teaching-assignment scoping canAccessCourse applies everywhere else.
            // Return only lessons for courses the learner can actually access.
            Integer learnerCollegeId = principal.getCollegeId();
            if (learnerCollegeId == null && scopeResolutionService != null) {
                learnerCollegeId = scopeResolutionService.resolveFullScope(principal.getId()).getCollegeId();
            }
            if (learnerCollegeId == null) {
                lessons = List.of();
            } else {
                lessons = lessonService.findByCollegeId(learnerCollegeId).stream()
                        .filter(l -> accessControlService.canAccessCourse(principal, l.getCourseId()))
                        .collect(java.util.stream.Collectors.toList());
            }
        } else {
            Integer collegeId = principal != null ? principal.getCollegeId() : null;
            if (collegeId == null) lessons = List.of();
            else lessons = lessonService.findByCollegeId(collegeId);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessons), HttpStatus.OK);
    }

    /**
     * Non-security #31: paginated counterpart of fetchAll.
     *
     * <p>fetchAll returns every lesson in the caller's scope in one response — for an unscoped
     * super-admin, every lesson on the platform. Additive rather than a change to fetchAll, so no
     * existing caller's response shape moves; that breaking-change risk is what deferred this
     * before.
     */
    @RequestMapping(value = "/fetchAllPaged", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get lessons, paginated", notes = "Same scope as fetchAll; returns a PageResponseDTO instead of a plain array.")
    public ResponseEntity getAllLessonsPaged(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100));

        if (accessControlService.isSuperAdmin(principal)) {
            Integer scopedCollegeId = principal.getCollegeId();
            Integer scopedOrgId = principal.getOrganizationId();
            if (scopedCollegeId != null) {
                return pageResponse(lessonService.findByCollegeIdPaged(scopedCollegeId, pageable));
            }
            if (scopedOrgId != null) {
                return pageResponse(lessonService.findByOrganizationIdPaged(scopedOrgId, pageable));
            }
            return pageResponse(lessonService.findAllPaged(pageable));
        }

        if (principal.isLearner()) {
            // The learner branch filters by per-course access in memory, exactly as fetchAll does,
            // because access depends on teaching assignments the query cannot join on. Paging is
            // therefore applied after that filter rather than in the database: this bounds the
            // response, not the query. Learners are college-scoped already, so the query itself
            // was never the unbounded case this finding is about.
            Integer learnerCollegeId = principal.getCollegeId();
            if (learnerCollegeId == null && scopeResolutionService != null) {
                learnerCollegeId = scopeResolutionService.resolveFullScope(principal.getId()).getCollegeId();
            }
            List<Lesson> accessible = learnerCollegeId == null ? List.of()
                    : lessonService.findByCollegeId(learnerCollegeId).stream()
                            .filter(l -> accessControlService.canAccessCourse(principal, l.getCourseId()))
                            .collect(java.util.stream.Collectors.toList());
            return pageResponse(toPage(accessible, pageable));
        }

        Integer collegeId = principal.getCollegeId();
        if (collegeId == null) {
            return pageResponse(org.springframework.data.domain.Page.empty(pageable));
        }
        return pageResponse(lessonService.findByCollegeIdPaged(collegeId, pageable));
    }

    private static org.springframework.data.domain.Page<Lesson> toPage(
            List<Lesson> all, org.springframework.data.domain.Pageable pageable) {
        int from = (int) Math.min(pageable.getOffset(), all.size());
        int to = Math.min(from + pageable.getPageSize(), all.size());
        return new org.springframework.data.domain.PageImpl<>(all.subList(from, to), pageable, all.size());
    }

    private ResponseEntity pageResponse(org.springframework.data.domain.Page<Lesson> page) {
        com._42students.lms.dto.response.PageResponseDTO<Lesson> body =
                com._42students.lms.dto.response.PageResponseDTO.<Lesson>builder()
                        .content(page.getContent())
                        .totalElements(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .size(page.getSize())
                        .number(page.getNumber())
                        .first(page.isFirst())
                        .last(page.isLast())
                        .build();
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), body), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchCourseId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get courseId for a lessonId", notes = "Requires course access for the lesson's course.")
    public ResponseEntity fetchCourseId(@RequestParam int lessonId)
            throws Exception {
        Lesson lesson = lessonService.fetchCourseId(lessonId);
        if (lesson == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found", null), HttpStatus.NOT_FOUND);
        }
        // Collapse "exists but no access" (403) and "not found" into a single 404 — otherwise
        // this endpoint leaked "this lesson ID is real, in another tenant" via the 403/404 split.
        try {
            accessControlService.requireAccessCourse(securityContextUtil.getAuthenticatedUserPrincipal(), lesson.getCourseId());
        } catch (org.springframework.security.access.AccessDeniedException | org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lesson.getCourseId()), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchGrades", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch grades of lessons for a course", notes = "Use courseSlug or courseId; courseSlug takes precedence. Requires course access.")
    public ResponseEntity fetchGrades(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        UserPrincipal gradesPrincipal = securityContextUtil.getAuthenticatedUserPrincipal();
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(gradesPrincipal, resolvedCourseId);
        boolean isLearnerRequest = gradesPrincipal != null && gradesPrincipal.isLearner();
        List<LessonResponseDTO> lessonContents = lessonService.getLessonContents(resolvedCourseId);
        List<PointsResponseDTO> pointsResponseDTOS = new ArrayList<>();
        for (LessonResponseDTO lessonResponseDTO : lessonContents) {
            PointsResponseDTO pointsResponseDTO = new PointsResponseDTO();
            Lesson lesson = lessonResponseDTO.getLesson();
            List<LessonContents> lessonContentsList = lessonResponseDTO.getLessonContents();
            if (lessonContentsList == null) lessonContentsList = Collections.emptyList();
            // This generic path did not apply the enabled/active filter that the class-specific
            // path applies (LessonContentsServiceImpl#fetchCombinedLessonContents), so learners
            // could infer the existence and point values of unpublished or hidden assessments.
            if (isLearnerRequest) {
                lessonContentsList = lessonContentsList.stream()
                        .filter(c -> c != null && c.isEnabled() && c.isActive())
                        .collect(java.util.stream.Collectors.toList());
            }
            pointsResponseDTO.setLessonName(lesson != null ? lesson.getLessonName() : null);
            List<Datum> datumList = new ArrayList<>();
            for (LessonContents lessonContents1 : lessonContentsList) {
                long points = lessonContents1.getPoints();
                String title = lessonContents1.getContentTitle();
                Datum datum = new Datum();
                datum.setPoints(points);
                datum.setTitle(title);
                datumList.add(datum);
            }
            pointsResponseDTO.setData(datumList);
            pointsResponseDTOS.add(pointsResponseDTO);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase()
                ,pointsResponseDTOS), HttpStatus.OK);
    }


    @RequestMapping(value = "/fetchGradesByCourseAndClass", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch grades of lessons for a course and class", notes = "Requires class and course access.")
    public ResponseEntity fetchGradesByCourseAndClass(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId,
            @RequestParam int classId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessClass(principal, classId);
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        // 6.3: this endpoint only ever merges submission scores for the requesting LEARNER's own
        // work (see the isLearner() guard below) -- a faculty account calling an endpoint named
        // "grades by course AND class" got max-points-only with no scores and no explanation why.
        // A real class-wide gradebook view (every learner's score against every content item) is
        // a genuinely different, larger feature -- new per-class aggregation queries and a
        // multi-learner response shape, not implemented here. Reject explicitly instead of
        // silently returning a response that looks like an empty gradebook.
        if (principal != null && principal.isFaculty()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This endpoint returns one learner's own grades and is not available to faculty. "
                            + "A class-wide gradebook view does not exist yet.");
        }
        List<LessonResponseDTO> lessonContents = lessonService.getLessonContentsByCourseAndClass(resolvedCourseId, classId);

        // Bug fix: the Grading tab was only ever showing the max points possible per content item
        // (LessonContents.getPoints()), never the learner's actual score. Resolve the requesting
        // learner's own submissions (IDOR-safe: scoped via principal.getId(), same pattern as
        // AssignmentController#fetchSubmissionsByLearnerId) and merge the actual pointsObtained
        // into the response alongside the existing max-points value.
        Map<Integer, StudentAssignment> latestSubmissionByContentId = new HashMap<>();
        if (principal != null && principal.isLearner() && principal.getId() != null) {
            int learnerId = principal.getId();
            List<StudentAssignment> submissions = lessonService.fetchSubmissionsByLearnerAndCourse(learnerId, resolvedCourseId);
            for (StudentAssignment sa : submissions) {
                StudentAssignment existing = latestSubmissionByContentId.get(sa.getLessonContentId());
                // Keep the LATEST attempt, matching this map's name and the learner's expectation
                // that the Grading tab reflects their most recent submission. This previously kept
                // whichever attempt had the HIGHEST pointsObtained, so a learner who resubmitted
                // and scored lower kept seeing their old, better score — and a regrade downward
                // was invisible. Prefer the highest attemptNumber, falling back to id (which is
                // monotonic) when attempt numbers are equal or unset on legacy rows.
                if (existing == null || isLaterAttempt(sa, existing)) {
                    latestSubmissionByContentId.put(sa.getLessonContentId(), sa);
                }
            }
        }

        List<PointsResponseDTO> pointsResponseDTOS = new ArrayList<>();
        for (LessonResponseDTO lessonResponseDTO : lessonContents) {
            PointsResponseDTO pointsResponseDTO = new PointsResponseDTO();
            Lesson lesson = lessonResponseDTO.getLesson();
            List<LessonContents> lessonContentsList = lessonResponseDTO.getLessonContents();
            if (lessonContentsList == null) lessonContentsList = Collections.emptyList();
            pointsResponseDTO.setLessonName(lesson != null ? lesson.getLessonName() : null);
            List<Datum> datumList = new ArrayList<>();
            for (LessonContents lessonContents1 : lessonContentsList) {
                String title = lessonContents1.getContentTitle();
                Datum datum = new Datum();
                datum.setTitle(title);
                StudentAssignment submission = latestSubmissionByContentId.get(lessonContents1.getId());
                if (submission != null) {
                    // Historical-integrity fix (Prompt 13): a learner's already-submitted score must
                    // be shown against the max points that applied WHEN THEY SUBMITTED, not whatever
                    // the quiz/assignment's max points happens to be today. StudentAssignment.points
                    // is already frozen at submission time for exactly this purpose (set in
                    // AssignmentServiceImpl#setStudentAssignmentFromLessonContent) but was never
                    // read here — this endpoint always used the live LessonContents.points instead,
                    // silently changing an already-graded learner's displayed denominator (e.g.
                    // "8/10" becoming "8/15") whenever faculty edited the quiz/assignment afterward.
                    // Fall back to the live value for old rows predating this field being populated
                    // (legacy data — better than a misleading "0" denominator).
                    datum.setPoints(submission.getPoints() > 0 ? submission.getPoints() : lessonContents1.getPoints());
                    datum.setPointsObtained(submission.getPointsObtained());
                    datum.setGraded(submission.getGraded() == 1);
                } else {
                    datum.setPoints(lessonContents1.getPoints());
                }
                datumList.add(datum);
            }
            pointsResponseDTO.setData(datumList);
            pointsResponseDTOS.add(pointsResponseDTO);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), pointsResponseDTOS), HttpStatus.OK);
    }


    /**
     * True when {@code candidate} is a later submission than {@code current} for the same content:
     * higher attemptNumber, or (when attempt numbers tie or are unset on legacy rows) a higher id,
     * which is monotonic.
     */
    private static boolean isLaterAttempt(StudentAssignment candidate, StudentAssignment current) {
        int candidateAttempt = candidate.getAttemptNumber();
        int currentAttempt = current.getAttemptNumber();
        if (candidateAttempt != currentAttempt) {
            return candidateAttempt > currentAttempt;
        }
        return candidate.getId() > current.getId();
    }

    /**
     * A lesson an admin or faculty member switched off (active or enabled = false) is left out for
     * students. Both switches were editable in the admin console but nothing read them, so a
     * "disabled" lesson stayed on every student's syllabus. Staff still get every lesson to edit.
     */
    static List<LessonResponseDTO> visibleTo(UserPrincipal principal, List<LessonResponseDTO> lessons) {
        if (principal == null || !principal.isLearner() || lessons == null) return lessons;
        return lessons.stream()
                .filter(dto -> dto != null && dto.getLesson() != null
                        && dto.getLesson().isActive() && dto.getLesson().isEnabled())
                .collect(java.util.stream.Collectors.toList());
    }

    @RequestMapping(value = "/fetchGenericCourseContents", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get generic lessons & lesson contents for a course", notes = "Use courseSlug or courseId; courseSlug takes precedence. Requires course access (faculty/admin of course's college).")
    public ResponseEntity getLessonContents(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(securityContextUtil.getAuthenticatedUserPrincipal(), resolvedCourseId);
        List<LessonResponseDTO> lessons = lessonService.getLessonContents(resolvedCourseId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                visibleTo(securityContextUtil.getAuthenticatedUserPrincipal(), lessons)), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchSpecificCourseContents", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get specific lessons & lesson contents for a course", notes = "Use courseSlug or courseId; courseSlug takes precedence. Requires class and course access.")
    public ResponseEntity getSpecificLessonContents(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId,
            @RequestParam int classId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessClass(principal, classId);
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        List<LessonResponseDTO> lessons = lessonService.getSpecificLessonContents(resolvedCourseId, classId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), visibleTo(principal, lessons)), HttpStatus.OK);
    }

   
    @Deprecated
    @RequestMapping(value = "/getlessoncontentsByCourseAndClass", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "[Deprecated] Use fetchSpecificCourseContents instead.", notes = "Same as fetchSpecificCourseContents. Use courseSlug or courseId; courseSlug takes precedence. Requires class and course access.")
    public ResponseEntity getLessonContentsByCourseAndClass(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId,
            @RequestParam int classId) {
        // 6.2: was a byte-for-byte duplicate of getSpecificLessonContents above -- every future
        // fix had to be applied twice, with no sunset date and no usage telemetry to know if this
        // could just be removed. Delegates instead, so the two can never drift again.
        return getSpecificLessonContents(courseSlug, courseId, classId);
    }

    @RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Update a lesson", notes = "Requires course access for the lesson's course.")
    public ResponseEntity updateLesson(@PathVariable Integer id, @Valid @RequestBody LessonDTO lessonDTO,
                                       javax.servlet.http.HttpServletRequest httpRequest) {
        Lesson existing = lessonService.findById(id).orElse(null);
        if (existing == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found", null), HttpStatus.NOT_FOUND);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // Prevent cross-tenant moves via course_id/course_slug changes in an update payload.
        if (lessonDTO.getCourseId() != 0 || (lessonDTO.getCourseSlug() != null && !lessonDTO.getCourseSlug().trim().isEmpty())) {
            int requestedCourseId = courseSlugResolver.resolve(lessonDTO.getCourseSlug(), lessonDTO.getCourseId());
            if (requestedCourseId != 0 && requestedCourseId != existing.getCourseId()) {
                accessControlService.requireAccessCourse(principal, requestedCourseId);
                if (scopeResolutionService != null) {
                    Integer fromCollegeId = scopeResolutionService.resolveCourseToCollegeId(existing.getCourseId());
                    Integer toCollegeId = scopeResolutionService.resolveCourseToCollegeId(requestedCourseId);
                    if (fromCollegeId != null && toCollegeId != null && !fromCollegeId.equals(toCollegeId)) {
                        return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(),
                                "Cannot move lesson to a course in a different college", null), HttpStatus.FORBIDDEN);
                    }
                }
            }
        }
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
            Integer collegeId = scopeResolutionService.resolveCourseToCollegeId(existing.getCourseId());
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update lessons in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update lessons within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessCourse(principal, existing.getCourseId());
        // See createLesson: requireAccessCourse passes for any enrolled learner and for any
        // faculty in the college, so renaming/re-sequencing a lesson needs the admin check too.
        requireLessonAdminRights(principal, (existing.getCourseId()));
        try {
            Lesson updatedLesson = lessonService.updateLesson(id, lessonDTO);
            if (auditLogService != null) {
                Integer collegeId = scopeResolutionService != null
                        ? scopeResolutionService.resolveCourseToCollegeId(existing.getCourseId()) : null;
                auditLogService.log(httpRequest, "LESSON_UPDATE", "lesson", String.valueOf(id), null, collegeId,
                        java.util.Map.of(
                                "lessonName", updatedLesson != null && updatedLesson.getLessonName() != null
                                        ? updatedLesson.getLessonName() : "",
                                "courseId", existing.getCourseId()));
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), updatedLesson), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // BE-0144: the service's own 400/409 (blank name, duplicate name or position, class-specific content) reach the
            // admin with their reason; only unexpected failures fall through to the generic answer below.
            HttpStatus status = e.getStatus();
            return new ResponseEntity(new Response(status.name(), e.getReason() != null ? e.getReason() : status.getReasonPhrase(), null), status);
        } catch (RuntimeException e) {
            // Don't echo raw exception text to the client: it leaks JPA/constraint internals.
            log.warn("Lesson operation failed: {}", e.getMessage(), e);
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found or the operation could not be completed", null), HttpStatus.NOT_FOUND);
        }
    }

    @RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete a lesson", notes = "Requires course access for the lesson's course.")
    public ResponseEntity deleteLesson(@PathVariable Integer id, javax.servlet.http.HttpServletRequest httpRequest) {
        Lesson existing = lessonService.findById(id).orElse(null);
        if (existing == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found", null), HttpStatus.NOT_FOUND);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
            Integer collegeId = scopeResolutionService.resolveCourseToCollegeId(existing.getCourseId());
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete lessons in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete lessons within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessCourse(principal, existing.getCourseId());
        // See createLesson. This is the most destructive operation in the module (it cascades to
        // every content row in the lesson and permanently deletes the backing R2 files), so it
        // must not be reachable by a learner or by a faculty member who merely shares the college.
        requireLessonAdminRights(principal, (existing.getCourseId()));
        try {
            lessonService.deleteLesson(id);
            // Lesson deletion cascades to every content row in the lesson AND permanently removes
            // the backing files from R2. It is the most destructive operation in the module and
            // previously left no audit record whatsoever.
            if (auditLogService != null) {
                Integer collegeId = scopeResolutionService != null
                        ? scopeResolutionService.resolveCourseToCollegeId(existing.getCourseId()) : null;
                auditLogService.log(httpRequest, "LESSON_DELETE", "lesson", String.valueOf(id), null, collegeId,
                        java.util.Map.of(
                                "lessonName", existing.getLessonName() != null ? existing.getLessonName() : "",
                                "courseId", existing.getCourseId()));
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Lesson deleted successfully", null), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // BE-0144: the service's own 400/409 (blank name, duplicate name or position, class-specific content) reach the
            // admin with their reason; only unexpected failures fall through to the generic answer below.
            HttpStatus status = e.getStatus();
            return new ResponseEntity(new Response(status.name(), e.getReason() != null ? e.getReason() : status.getReasonPhrase(), null), status);
        } catch (RuntimeException e) {
            // Don't echo raw exception text to the client: it leaks JPA/constraint internals.
            log.warn("Lesson operation failed: {}", e.getMessage(), e);
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found or the operation could not be completed", null), HttpStatus.NOT_FOUND);
        }
    }

    // A deleted lesson had no recovery path through the product at all. These two endpoints back
    // the restore screen. Restoring does NOT bring back the lesson's content rows or any uploaded
    // file already destroyed by best-effort R2 cleanup — see LessonServiceImpl#restoreLesson.

    @RequestMapping(value = "/deleted", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "List soft-deleted lessons for a college", notes = "Requires admin rights for the college.")
    public ResponseEntity fetchDeletedLessons(@RequestParam Integer collegeId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                lessonService.fetchDeletedLessons(collegeId)), HttpStatus.OK);
    }

    @RequestMapping(value = "/restore/{id}", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Restore a soft-deleted lesson", notes = "Requires admin rights for the lesson's college. Content is not restored.")
    public ResponseEntity restoreLesson(@PathVariable Integer id, @RequestParam Integer collegeId,
                                        javax.servlet.http.HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            Lesson restored = lessonService.restoreLesson(id, collegeId);
            if (auditLogService != null) {
                auditLogService.log(httpRequest, "LESSON_RESTORE", "lesson", String.valueOf(id), null, collegeId,
                        java.util.Map.of("lessonName", restored != null && restored.getLessonName() != null ? restored.getLessonName() : ""));
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Lesson restored. Content and files are not automatically restored.", restored), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        }
    }
}

