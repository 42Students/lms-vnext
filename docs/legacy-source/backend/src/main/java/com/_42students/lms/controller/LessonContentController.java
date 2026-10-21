package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ClassContentOrderRequest;
import com._42students.lms.dto.request.ContentProgressSaveRequest;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.response.ContentProgressResponse;
import com._42students.lms.dto.response.LessonContentsGradesResponse;
import com._42students.lms.dto.response.MetricsResponseDTO;
import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.model.Course;
import com._42students.lms.model._Class;
import com._42students.lms.dto.response.FacultyCourseClassMappingDTO;
import com._42students.lms.service.ClassService;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.CourseSlugResolver;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import org.springframework.web.bind.annotation.*;

import com._42students.lms.model.Learner;
import com._42students.lms.service.LearnerContentProgressService;
import com._42students.lms.service.LearnerService;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/lesson/contents")
@Slf4j
@Validated
public class LessonContentController extends BaseController{
    @Autowired
    LessonContentsService lessonContentsService;

    @Autowired
    LessonService lessonService;

    @Autowired
    ClassService classService;

    @Autowired
    CourseSlugResolver courseSlugResolver;

    @Autowired
    CourseService courseService;

    @Autowired(required = false)
    FacultyService facultyService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired
    AccessControlService accessControlService;

    @Autowired(required = false)
    ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    LearnerService learnerService;

    @Autowired(required = false)
    LearnerContentProgressService learnerContentProgressService;

    /**
     * Ensures principal has access to the given lesson content. Uses class or course on content;
     * if both are null, resolves scope via lesson → course. Fails closed if access control is unavailable.
     */
    private void requireAccessToLessonContent(UserPrincipal principal, LessonContents content) {
        if (accessControlService == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access control not available");
        if (principal == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        if (principal.isLearner()
                && (Boolean.TRUE.equals(content.getIsDeleted()) || !content.isEnabled() || !content.isActive())) {
            // Scope access is not publication access. A learner with a stale/bookmarked id must
            // not be able to resurrect disabled, inactive or soft-deleted content.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found");
        }
        if (content.getClassId() != null && content.getClassId() > 0) {
            accessControlService.requireAccessClass(principal, content.getClassId());
            // Safety: scoped superadmin must not act outside JWT scope
            if (scopeResolutionService != null && accessControlService.isSuperAdmin(principal)) {
                Integer collegeId = scopeResolutionService.resolveClassToCollegeId(content.getClassId());
                if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped superadmin: college mismatch");
                }
                if (principal.getOrganizationId() != null && collegeId != null) {
                    Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                    if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped superadmin: organization mismatch");
                    }
                }
            }
            return;
        }
        if (content.getCourseId() != null) {
            accessControlService.requireAccessCourse(principal, content.getCourseId());
            // Safety: scoped superadmin must not act outside JWT scope
            if (scopeResolutionService != null && accessControlService.isSuperAdmin(principal)) {
                Integer collegeId = scopeResolutionService.resolveCourseToCollegeId(content.getCourseId());
                if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped superadmin: college mismatch");
                }
                if (principal.getOrganizationId() != null && collegeId != null) {
                    Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                    if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped superadmin: organization mismatch");
                    }
                }
            }
            return;
        }
        Lesson lesson = lessonService.fetchCourseId(content.getLessonId());
        if (lesson == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot determine scope for this content");
        accessControlService.requireAccessCourse(principal, lesson.getCourseId());
        // Safety: scoped superadmin must not act outside JWT scope
        if (scopeResolutionService != null && accessControlService.isSuperAdmin(principal)) {
            Integer collegeId = scopeResolutionService.resolveCourseToCollegeId(lesson.getCourseId());
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped superadmin: college mismatch");
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped superadmin: organization mismatch");
                }
            }
        }
    }

    /**
     * Invariant: when an endpoint accepts both a classId and a courseId, they must belong to the same college.
     * This protects against cross-college mismatches (data bugs or tampering) even if the caller has access to both IDs.
     * Also enforces scoped-superadmin (org/college) constraints when available.
     */
    private void requireClassMatchesCourse(UserPrincipal principal, Integer classId, Integer courseId) {
        // Fail closed. This previously returned silently when scopeResolutionService was absent,
        // which made the cross-college invariant evaporate rather than be enforced — the opposite
        // of what a guard should do when it cannot do its job.
        if (scopeResolutionService == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scope resolution unavailable; cannot verify class/course tenancy");
        }
        if (classId == null || classId <= 0) return;
        if (courseId == null || courseId <= 0) return;

        Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(classId);
        Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
        if (classCollegeId != null && courseCollegeId != null && !classCollegeId.equals(courseCollegeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CLASS_COURSE_COLLEGE_MISMATCH");
        }

        if (principal != null && accessControlService != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && classCollegeId != null && !principal.getCollegeId().equals(classCollegeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped superadmin: college mismatch");
            }
            if (principal.getOrganizationId() != null && classCollegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(classCollegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Scoped superadmin: organization mismatch");
                }
            }
        }
    }

    private void requireAccessControlAvailable() {
        if (accessControlService == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access control not available");
    }

    private UserPrincipal requirePrincipal() {
        if (securityContextUtil == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Security context not available");
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        if (p == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        return p;
    }

    private void requireNotLearner(UserPrincipal principal, String action) {
        if (principal == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        if (principal.isLearner())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners cannot " + action);
    }

    // /{id}/playback-url removed: lesson video now stores a plain public R2 URL directly on the
    // content (see LessonContentsServiceImpl for the full reasoning) and is returned as part of
    // the normal lesson-content read/list endpoints below — no separate signed-URL round trip.

    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create contents for a lesson", notes = "Requires course access for the lesson's course.")
    public ResponseEntity createLessonContents(@Valid @RequestBody LessonContentsDTO lessonContentsDTO)
            throws Exception {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        requireNotLearner(principal, "create lesson contents");
        Lesson lesson = lessonService.fetchCourseId(lessonContentsDTO.getLessonId());
        if (lesson == null)
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found", null), HttpStatus.NOT_FOUND);
        accessControlService.requireAccessCourse(principal, lesson.getCourseId());

        Integer classId = lessonContentsDTO.getClassId();
        if (classId != null && classId > 0) {
            accessControlService.requireAccessClass(principal, classId);
            if (scopeResolutionService != null) {
                Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(classId);
                Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(lesson.getCourseId());
                if (classCollegeId != null && courseCollegeId != null && !classCollegeId.equals(courseCollegeId)) {
                    return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "CLASS_COURSE_COLLEGE_MISMATCH", null),
                            HttpStatus.BAD_REQUEST);
                }
                if (accessControlService.isSuperAdmin(principal)) {
                    if (principal.getCollegeId() != null && classCollegeId != null && !principal.getCollegeId().equals(classCollegeId)) {
                        return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin: college mismatch", null),
                                HttpStatus.FORBIDDEN);
                    }
                    if (principal.getOrganizationId() != null && classCollegeId != null) {
                        Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(classCollegeId);
                        if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin: organization mismatch", null),
                                    HttpStatus.FORBIDDEN);
                        }
                    }
                }
            }
        }

        if (classId != null && classId > 0) {
            accessControlService.requireCurrentCourseAudienceClass(classId, lesson.getCourseId());
        }

        lessonContentsDTO.setCourseId(lesson.getCourseId());
        // College admin / superadmin can create on behalf of a selected faculty.
        // Non-admin faculty can only create as themselves.
        boolean isAdminFaculty = principal != null
                && principal.isFaculty()
                && principal.getFacultyType() != null
                && "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        if (!isAdminFaculty) {
            lessonContentsDTO.setFacultyId(principal.getId());
        } else {
            // If UI didn't send facultyId, default to self.
            if (lessonContentsDTO.getFacultyId() == null || lessonContentsDTO.getFacultyId() <= 0) {
                lessonContentsDTO.setFacultyId(principal.getId());
            }
        }
        // 8.5: contentTitle is unbounded, user-controlled free text and doesn't belong at INFO
        // level. lessonId/contentType are bounded/structured (an id and a fixed content-type
        // string) and stay at INFO for basic operational visibility; the title moves to DEBUG.
        log.info("Creating lesson content: lessonId={}, contentType={}",
            lessonContentsDTO.getLessonId(),
            lessonContentsDTO.getContentType());
        log.debug("Creating lesson content title: {}", lessonContentsDTO.getContentTitle());
        try {
            LessonContents lessonContents = lessonContentsService.createLessonContents(lessonContentsDTO);
            log.info("Created lesson content with id: {}", lessonContents.getId());
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessonContents), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/fetch", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch lesson contents for a lesson", notes = "Admin/faculty see all content; learners see only generic + their class content.")
    public ResponseEntity fetchLessonContents(@RequestParam int lessonId)
            throws Exception {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        Lesson lesson = lessonService.fetchCourseId(lessonId);
        if (lesson == null)
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found", null), HttpStatus.NOT_FOUND);
        accessControlService.requireAccessCourse(principal, lesson.getCourseId());
        List<LessonContents> lessonContents;
        if (principal.isLearner() && learnerService != null) {
            if (principal.getId() == null || principal.getId() <= 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid learner id is required");
            Learner learner = learnerService.getLearnerDetails(String.valueOf(principal.getId()));
            Integer courseClassId = learner == null ? null : classForCourse(principal, learner, lesson.getCourseId());
            if (courseClassId != null && courseClassId > 0) {
                // Fail closed on cross-college mismatches: never join class+course content if IDs don't align.
                if (scopeResolutionService != null) {
                    Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(courseClassId);
                    Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(lesson.getCourseId());
                    if (classCollegeId != null && courseCollegeId != null && !classCollegeId.equals(courseCollegeId)) {
                        lessonContents = lessonContentsService.fetchLessonContents(lessonId);
                    } else {
                        lessonContents = lessonContentsService.fetchCombinedLessonContents(lessonId, courseClassId);
                    }
                } else {
                    lessonContents = lessonContentsService.fetchCombinedLessonContents(lessonId, courseClassId);
                }
            } else {
                lessonContents = lessonContentsService.fetchLessonContents(lessonId);
            }
        } else {
            lessonContents = lessonContentsService.fetchLessonContents1(lessonId);
        }
        lessonContents = lessonContentsService.toListSafeForResponse(lessonContents);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessonContents), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchSpecificLessonContents", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get combined generic & class-specific lesson contents for a lesson", notes = "Requires class and lesson's course access. Optimized single-query approach: fetches both generic (class_id < 1) and class-specific contents in one database call. Admin with classId=0 sees all content.")
    public ResponseEntity getSpecificLessonContents(@RequestParam int lessonId, @RequestParam int classId)
            throws Exception {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        Lesson lesson = lessonService.fetchCourseId(lessonId);
        if (lesson == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        accessControlService.requireAccessCourse(principal, lesson.getCourseId());
        List<LessonContents> lessonContents;
        boolean isAdminUser = (principal.getId() != null && principal.getId() == 0)
                || "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        if (classId <= 0 && isAdminUser) {
            lessonContents = lessonContentsService.fetchLessonContents1(lessonId);
        } else {
            accessControlService.requireAccessClass(principal, classId);
            requireClassMatchesCourse(principal, classId, lesson.getCourseId());
            accessControlService.requireTeachingScope(principal, lesson.getCourseId(), classId);
            lessonContents = lessonContentsService.fetchCombinedLessonContents(lessonId, classId);
        }
        lessonContents = lessonContentsService.toListSafeForResponse(lessonContents);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessonContents), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchSpecificLessonContentsMetrics", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get metrics for combined generic & class-specific lesson contents", notes = "Requires class and lesson's course access. Admin with classId=0 sees all content.")
    public ResponseEntity fetchSpecificLessonContentsMetrics(@RequestParam int lessonId, @RequestParam int classId)
            throws Exception {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        requireNotLearner(principal, "view lesson content metrics");
        Lesson lesson = lessonService.fetchCourseId(lessonId);
        if (lesson == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        accessControlService.requireAccessCourse(principal, lesson.getCourseId());
        boolean isAdminUser = (principal.getId() != null && principal.getId() == 0)
                || "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        List<LessonContents> lessonContents;
        if (classId <= 0 && isAdminUser) {
            lessonContents = lessonContentsService.fetchLessonContents1(lessonId);
        } else {
            accessControlService.requireAccessClass(principal, classId);
            requireClassMatchesCourse(principal, classId, lesson.getCourseId());
            accessControlService.requireTeachingScope(principal, lesson.getCourseId(), classId);
            lessonContents = lessonContentsService.fetchCombinedLessonContents(lessonId, classId);
        }
        
        // Build metrics from the combined results
        Map<String, Integer> metricsResponse = new HashMap<>();
        for (LessonContents content : lessonContents) {
            String contentType = content.getContentType();
            metricsResponse.merge(contentType, 1, Integer::sum);
        }
        
        MetricsResponseDTO metricsResponseDTO = new MetricsResponseDTO();
        metricsResponseDTO.setMetricsResponse(metricsResponse);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), metricsResponseDTO), HttpStatus.OK);
    }


    @RequestMapping(value = "/fetchSpecificLessonContentsGrades", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get grades info for combined generic & class-specific lesson contents", notes = "Requires class and lesson's course access. Admin with classId=0 sees all content.")
    public ResponseEntity fetchSpecificLessonContentsGrades(@RequestParam int lessonId, @RequestParam int classId)
            throws Exception {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        requireNotLearner(principal, "view lesson content grades");
        Lesson lesson = lessonService.fetchCourseId(lessonId);
        if (lesson == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        accessControlService.requireAccessCourse(principal, lesson.getCourseId());
        boolean isAdminUser = (principal.getId() != null && principal.getId() == 0)
                || "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        List<LessonContents> lessonContents;
        if (classId <= 0 && isAdminUser) {
            lessonContents = lessonContentsService.fetchLessonContents1(lessonId);
        } else {
            accessControlService.requireAccessClass(principal, classId);
            requireClassMatchesCourse(principal, classId, lesson.getCourseId());
            accessControlService.requireTeachingScope(principal, lesson.getCourseId(), classId);
            lessonContents = lessonContentsService.fetchCombinedLessonContents(lessonId, classId);
        }
        
        // Map to grade response DTOs
        List<LessonContentsGradesResponse> lessonContentsGradesResponses = lessonContents.stream()
                .map(content -> {
                    LessonContentsGradesResponse response = new LessonContentsGradesResponse();
                    response.setLessonId(content.getLessonId());
                    response.setLessonContentId(content.getId());
                    response.setPoints(content.getPoints());
                    response.setCourseName(content.getCourseName());
                    response.setClassId(content.getClassId());
                    response.setFacultyId(content.getFacultyId());
                    response.setCourseId(content.getCourseId());
                    Course course = content.getCourseId() != null ? courseService.fetchCourse(content.getCourseId()) : null;
                    response.setCourseSlug(course != null ? course.getSlug() : null);
                    response.setLessonContentName(content.getContentTitle());
                    return response;
                })
                .toList();
        
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessonContentsGradesResponses), HttpStatus.OK);
    }

    /** courseSlug (public identifier, used by course-filter dropdowns) takes precedence over a raw courseId if both are supplied. */
    private Integer resolveCourseId(String courseSlug, Integer courseId) {
        if (courseSlug == null || courseSlug.isBlank()) return courseId;
        com._42students.lms.model.Course course = courseService.fetchCourseBySlug(courseSlug.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        return course.getId();
    }

    @RequestMapping(value = "/fetchAllAssignmentsByFacultyId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all assignments created by a faculty", notes = "Requires faculty schedule access. Pass page/size for a paginated PageResponseDTO; omit both for the legacy unpaginated array.")
    public ResponseEntity fetchAllAssignments(@RequestParam int facultyId,
                                               @RequestParam(required = false) Integer courseId,
                                               @RequestParam(required = false) String courseSlug,
                                               @RequestParam(required = false) Integer page,
                                               @RequestParam(required = false) Integer size)
            throws Exception {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        requireNotLearner(principal, "fetch faculty assignments");
        if (facultyId <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "facultyId must be a positive integer");
        accessControlService.requireAccessFacultySchedule(principal, facultyId);
        // requireAccessFacultySchedule resolves to a bare college match for anyone who isn't the
        // faculty themselves, so any faculty account in the college could read any colleague's
        // authored assignment list. Matches the same restriction already applied to faculty
        // announcements/notifications: a plain faculty account may only fetch their own list;
        // admin may fetch anyone's.
        if (!accessControlService.isSuperAdmin(principal)
                && !accessControlService.canPerformAdminActionForCollege(principal, principal != null ? principal.getCollegeId() : null)
                && (principal == null || principal.getId() == null || !principal.getId().equals(facultyId))) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot view another faculty's assignments");
        }
        Integer resolvedCourseId = resolveCourseId(courseSlug, courseId);
        if (page != null || size != null) {
            PageResponseDTO<LessonContents> paged = lessonContentsService.fetchAllAssignmentsPaged(
                    facultyId, resolvedCourseId, page == null ? 0 : page, size == null ? 20 : size);
            paged.setContent(lessonContentsService.toListSafeForResponse(paged.getContent()));
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), paged), HttpStatus.OK);
        }
        List<LessonContents> lessonContents = lessonContentsService.fetchAllAssignments(facultyId);
        lessonContents = lessonContentsService.toListSafeForResponse(lessonContents);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessonContents), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchAllAssignmentsByLearnerId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all assignments for a learner", notes = "Requires learner access. Pass page/size for a paginated PageResponseDTO; omit both for the legacy unpaginated array.")
    public ResponseEntity fetchAllAssignmentsByLearnerId(@RequestParam int learnerId,
                                                          @RequestParam(required = false) Integer courseId,
                                                          @RequestParam(required = false) String courseSlug,
                                                          @RequestParam(required = false) Integer page,
                                                          @RequestParam(required = false) Integer size)
            throws Exception {
        requireAccessControlAvailable();
        if (learnerId <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "learnerId must be a positive integer");
        UserPrincipal principal = requirePrincipal();
        if (principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners may only fetch their own assignments");
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        Integer resolvedCourseId = resolveCourseId(courseSlug, courseId);
        if (page != null || size != null) {
            PageResponseDTO<LessonContents> paged = lessonContentsService.fetchAllAssignmentsByLearnerIdPaged(
                    learnerId, resolvedCourseId, page == null ? 0 : page, size == null ? 20 : size);
            paged.setContent(lessonContentsService.toListSafeForResponse(paged.getContent()));
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), paged), HttpStatus.OK);
        }
        List<LessonContents> lessonContents = lessonContentsService.fetchAllAssignmentsByLearnerId(learnerId);
        lessonContents = lessonContentsService.toListSafeForResponse(lessonContents);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessonContents), HttpStatus.OK);
    }

    @RequestMapping(value = "/coursesForClass", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Distinct courses with content in a learner's class", notes = "Backs the course-filter dropdown on the All Quizzes / All Assignments pages. classId is resolved server-side from the learner, not client-supplied.")
    public ResponseEntity fetchCoursesForClass(@RequestParam int learnerId) throws Exception {
        requireAccessControlAvailable();
        if (learnerId <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "learnerId must be a positive integer");
        UserPrincipal principal = requirePrincipal();
        if (principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !principal.getId().equals(learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners may only fetch their own course list");
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessonContentsService.fetchCoursesForClass(learnerId)), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchAllByFacultyId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all lesson contents by faculty ID", notes = "Requires faculty schedule access.")
    public ResponseEntity fetchAllByFacultyId(@RequestParam int facultyId)
            throws Exception {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        requireNotLearner(principal, "fetch faculty lesson contents");
        if (facultyId <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "facultyId must be a positive integer");
        accessControlService.requireAccessFacultySchedule(principal, facultyId);
        List<LessonContents> lessonContents = lessonContentsService.fetchAllByFacultyId(facultyId);
        lessonContents = lessonContentsService.toListSafeForResponse(lessonContents);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lessonContents), HttpStatus.OK);
    }


   

    

    @RequestMapping(value = "/fetchUniqueClassesByCourseId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch unique class IDs by course ID", notes = "Requires course access.")
    public ResponseEntity<Map<Integer, String>> fetchUniqueClassIdsByCourseId(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        Integer courseCollegeId = scopeResolutionService != null ? scopeResolutionService.resolveCourseToCollegeId(resolvedCourseId) : null;
        List<Integer> uniqueClassIds = lessonContentsService.fetchUniqueClassIdsByCourseId(resolvedCourseId);
        Map<Integer, String> classDetails = new HashMap<>();
        for (Integer classId : uniqueClassIds) {
            if (classId == null || classId <= 0) continue;
            if (scopeResolutionService != null && courseCollegeId != null) {
                Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(classId);
                if (classCollegeId != null && !classCollegeId.equals(courseCollegeId)) continue;
                if (accessControlService.isSuperAdmin(principal) && principal.getCollegeId() != null && !principal.getCollegeId().equals(classCollegeId)) continue;
            }
            String className = classService.getClassNameById(String.valueOf(classId));
            classDetails.put(classId, className);
        }
        return new ResponseEntity<>(classDetails, HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchClassesForCourseSyllabus", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch current eligible classes for a course", notes = "Current target selector: active teaching override, current batch semester curriculum, or live elective-backed class. Historical classes remain reviewable through existing content but are not offered as new targets.")
    public ResponseEntity<Map<Integer, String>> fetchClassesForCourseSyllabus(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) Integer includeHistoricalClassId,
            @RequestParam(required = false, defaultValue = "false") boolean includeHistorical) {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        if (scopeResolutionService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Course audience resolution unavailable");
        }

        Map<Integer, String> classDetails = new java.util.LinkedHashMap<>();
        for (_Class eligibleClass : scopeResolutionService.resolveCurrentEligibleClassesForCourse(resolvedCourseId)) {
            if (eligibleClass == null || eligibleClass.getId() <= 0) continue;
            classDetails.put(eligibleClass.getId(),
                    eligibleClass.getName() != null && !eligibleClass.getName().isBlank()
                            ? eligibleClass.getName()
                            : "Class " + eligibleClass.getId());
        }

        // Editing old content is different from choosing a NEW target. A promoted cohort may no
        // longer be current, but the editor still needs a human-readable label for the stored
        // historical class. Only re-include it when this course actually has content on that
        // class; the write path still requires current eligibility for any scope change.
        List<Integer> historicalClassIds = lessonContentsService.fetchUniqueClassIdsByCourseId(resolvedCourseId);
        if (includeHistorical) {
            for (Integer historicalClassId : historicalClassIds) {
                addHistoricalCourseClassLabel(principal, resolvedCourseId, historicalClassId, classDetails);
            }
        } else if (includeHistoricalClassId != null && includeHistoricalClassId > 0
                && historicalClassIds.contains(includeHistoricalClassId)) {
            addHistoricalCourseClassLabel(principal, resolvedCourseId, includeHistoricalClassId, classDetails);
        }
        return new ResponseEntity<>(classDetails, HttpStatus.OK);
    }

    private void addHistoricalCourseClassLabel(UserPrincipal principal,
                                               int courseId,
                                               Integer classId,
                                               Map<Integer, String> classDetails) {
        if (classId == null || classId <= 0 || classDetails.containsKey(classId)) return;
        Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
        Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(classId);
        if (courseCollegeId == null || !courseCollegeId.equals(classCollegeId)
                || !accessControlService.canAccessClass(principal, classId)) {
            return;
        }
        String historicalName = classService.getClassNameById(String.valueOf(classId));
        classDetails.put(classId,
                (historicalName != null && !historicalName.isBlank()
                        ? historicalName
                        : "Class " + classId) + " (historical scope)");
    }

    @PutMapping(value = "/class-content-order", produces = "application/json", consumes = "application/json")
    @ApiOperation(value = "Update per-class content order for a lesson", notes = "Admin/faculty only. Reordering affects only the specified class; other classes keep default order. Requires class and course access.")
    public ResponseEntity<Response<String>> updateClassContentOrder(@RequestBody @Valid ClassContentOrderRequest request) {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        if (!principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admin may reorder class content");
        }
        accessControlService.requireAccessClass(principal, request.getClassId());
        Lesson lesson = lessonService.fetchCourseId(request.getLessonId());
        if (lesson == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        accessControlService.requireAccessCourse(principal, lesson.getCourseId());
        requireClassMatchesCourse(principal, request.getClassId(), lesson.getCourseId());
        lessonContentsService.updateClassContentOrder(request.getLessonId(), request.getClassId(), request.getOrderedContentIds());
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), "Order updated"), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchById/{id}", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get lesson content by ID", notes = "Requires class or course access for the content.")
    public ResponseEntity fetchLessonContentById(@PathVariable Integer id) {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        LessonContents content = lessonContentsService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found"));
        requireAccessToLessonContent(principal, content);
        lessonContentsService.toListSafeForResponse(java.util.Collections.singletonList(content));
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), content), HttpStatus.OK);
    }

    // 2.6: the stored content URL is a permanently-public bearer token -- no expiry, no per-user
    // authorisation, no revocation short of deleting the object outright. This endpoint is
    // additive: it does not change how the stored URL works (still directly public, still what
    // every current player/viewer uses), it adds a second, narrower way to reach the same object
    // that expires and requires the same access check as any other content read. Full closure
    // (frontend switching playback away from the stored URL to this endpoint) is a separate,
    // larger change not attempted here.
    @RequestMapping(value = "/{id}/playback-url", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get a time-limited presigned URL for this content's file", notes = "Requires class or course access for the content. Returns null url if the content has no attached file.")
    public ResponseEntity getPlaybackUrl(@PathVariable Integer id) {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        LessonContents content = lessonContentsService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found"));
        requireAccessToLessonContent(principal, content);
        com._42students.lms.dto.response.PlaybackUrlResponseDTO url = lessonContentsService.generatePlaybackUrl(content);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), url), HttpStatus.OK);
    }

    @RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Update a lesson content", notes = "Requires class or course access for the content.")
    public ResponseEntity updateLessonContent(@PathVariable Integer id, @Valid @RequestBody LessonContentsDTO lessonContentsDTO) {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        requireNotLearner(principal, "update lesson contents");
        Optional<LessonContents> existing = lessonContentsService.findById(id);
        if (existing.isEmpty())
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson content not found", null), HttpStatus.NOT_FOUND);
        LessonContents lc = existing.get();
        requireAccessToLessonContent(principal, lc);

        // Re-validate any attempted scope changes (lessonId/classId) so updates can't be used for IDOR.
        Integer targetLessonId = lessonContentsDTO.getLessonId() != null ? lessonContentsDTO.getLessonId() : lc.getLessonId();
        Lesson targetLesson = targetLessonId != null ? lessonService.fetchCourseId(targetLessonId) : null;
        if (targetLessonId != null && targetLesson == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson not found", null), HttpStatus.NOT_FOUND);
        }
        if (targetLesson != null) {
            accessControlService.requireAccessCourse(principal, targetLesson.getCourseId());
            lessonContentsDTO.setCourseId(targetLesson.getCourseId());
        }

        Integer targetClassId = lessonContentsDTO.getClassId() != null ? lessonContentsDTO.getClassId() : lc.getClassId();
        if (targetClassId != null && targetClassId > 0) {
            accessControlService.requireAccessClass(principal, targetClassId);
        }
        if (scopeResolutionService != null && targetLesson != null && targetClassId != null && targetClassId > 0) {
            Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(targetClassId);
            Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(targetLesson.getCourseId());
            if (classCollegeId != null && courseCollegeId != null && !classCollegeId.equals(courseCollegeId)) {
                return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "CLASS_COURSE_COLLEGE_MISMATCH", null),
                        HttpStatus.BAD_REQUEST);
            }
            if (accessControlService.isSuperAdmin(principal)) {
                if (principal.getCollegeId() != null && classCollegeId != null && !principal.getCollegeId().equals(classCollegeId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin: college mismatch", null),
                            HttpStatus.FORBIDDEN);
                }
                if (principal.getOrganizationId() != null && classCollegeId != null) {
                    Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(classCollegeId);
                    if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                        return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin: organization mismatch", null),
                                HttpStatus.FORBIDDEN);
                    }
                }
            }
        }
        boolean scopeChanged = targetClassId != null && targetClassId > 0
                && (!Objects.equals(lc.getClassId(), targetClassId)
                    || (targetLesson != null && !Objects.equals(lc.getCourseId(), targetLesson.getCourseId())));
        if (scopeChanged) {
            accessControlService.requireCurrentCourseAudienceClass(targetClassId, targetLesson.getCourseId());
        }
        try {
            LessonContents updatedContent = lessonContentsService.updateLessonContent(id, lessonContentsDTO);
            lessonContentsService.toListSafeForResponse(java.util.Collections.singletonList(updatedContent));
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), updatedContent), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete a lesson content", notes = "Requires class or course access for the content.")
    public ResponseEntity deleteLessonContent(@PathVariable Integer id) {
        requireAccessControlAvailable();
        UserPrincipal principal = requirePrincipal();
        requireNotLearner(principal, "delete lesson contents");
        Optional<LessonContents> existing = lessonContentsService.findById(id);
        if (existing.isEmpty())
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lesson content not found", null), HttpStatus.NOT_FOUND);
        LessonContents lc = existing.get();
        requireAccessToLessonContent(principal, lc);
        lessonContentsService.deleteLessonContent(id);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), "Lesson content deleted successfully", null), HttpStatus.OK);
    }

    // ---------- Learner content progress (video etc.) ----------

    @PutMapping(value = "/progress", produces = "application/json", consumes = "application/json")
    @ApiOperation(value = "Save progress for a lesson content (e.g. video position)", notes = "Learner only; requires access to the content.")
    public ResponseEntity<Response<ContentProgressResponse>> saveContentProgress(@RequestBody @Valid ContentProgressSaveRequest request) {
        requireAccessControlAvailable();
        if (learnerContentProgressService == null)
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Content progress service not available");
        UserPrincipal principal = requirePrincipal();
        if (!principal.isLearner())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners can save content progress");
        if (principal.getId() == null || principal.getId() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid learner id is required");
        if (request.getLessonContentId() == null || request.getLessonContentId() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lessonContentId must be a positive integer");
        LessonContents content = lessonContentsService.findById(request.getLessonContentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found"));
        requireAccessToLessonContent(principal, content);
        try {
            ContentProgressResponse response = learnerContentProgressService.saveProgress(principal.getId(), request);
            return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), response), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping(value = "/{id}/progress", produces = "application/json")
    @ApiOperation(value = "Get progress for one lesson content", notes = "Learner only; requires access to the content.")
    public ResponseEntity<Response<ContentProgressResponse>> getContentProgress(@PathVariable Integer id) {
        requireAccessControlAvailable();
        if (learnerContentProgressService == null)
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Content progress service not available");
        UserPrincipal principal = requirePrincipal();
        if (!principal.isLearner())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners can get content progress");
        if (principal.getId() == null || principal.getId() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid learner id is required");
        if (id == null || id <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson content id must be a positive integer");
        LessonContents content = lessonContentsService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson content not found"));
        requireAccessToLessonContent(principal, content);
        ContentProgressResponse response = learnerContentProgressService.getProgress(principal.getId(), id);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), response), HttpStatus.OK);
    }

    @GetMapping(value = "/progress", produces = "application/json")
    @ApiOperation(value = "Get progress for all content in a lesson", notes = "Learner only; returns progress for all enabled+active lesson contents in the lesson.")
    public ResponseEntity<Response<List<ContentProgressResponse>>> getLessonContentProgress(@RequestParam int lessonId) {
        requireAccessControlAvailable();
        if (learnerContentProgressService == null)
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Content progress service not available");
        UserPrincipal principal = requirePrincipal();
        if (!principal.isLearner())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only learners can get content progress");
        if (principal.getId() == null || principal.getId() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid learner id is required");
        if (lessonId <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lessonId must be a positive integer");
        Lesson lesson = lessonService.fetchCourseId(lessonId);
        if (lesson == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        accessControlService.requireAccessCourse(principal, lesson.getCourseId());
        List<LessonContents> contents;
        if (learnerService != null) {
            Learner learner = learnerService.getLearnerDetails(String.valueOf(principal.getId()));
            Integer courseClassId = learner == null ? null : classForCourse(principal, learner, lesson.getCourseId());
            if (courseClassId != null && courseClassId > 0) {
                contents = lessonContentsService.fetchCombinedLessonContents(lessonId, courseClassId);
            } else {
                contents = lessonContentsService.fetchLessonContents(lessonId);
            }
        } else {
            contents = lessonContentsService.fetchLessonContents(lessonId);
        }
        List<Integer> trackableIds = contents.stream()
                .filter(c -> c.getId() > 0)
                .filter(c -> c.isEnabled() && c.isActive())
                .map(LessonContents::getId)
                .distinct()
                .limit(500)
                .toList();
        List<ContentProgressResponse> progressList = learnerContentProgressService.getProgressBulk(principal.getId(), trackableIds);
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), progressList), HttpStatus.OK);
    }

    /**
     * BE-0006: the class through which this learner takes this course: the home class when it has the course, otherwise the
     * elective (group-backed) class that grants it. Content and progress used to use the home class only, so an elective's
     * class-specific lessons never showed.
     */
    private Integer classForCourse(UserPrincipal principal, Learner learner, Integer courseId) {
        Integer home = learner.getClassId();
        if (courseId == null || accessControlService == null) return home;
        if (home != null && home > 0 && accessControlService.isClassCurrentlyEligibleForCourse(home, courseId)) return home;
        for (Integer c : accessControlService.resolveLearnerAudienceClassIds(principal)) {
            if (c != null && c > 0 && !c.equals(home) && accessControlService.isClassCurrentlyEligibleForCourse(c, courseId)) return c;
        }
        return home;
    }
}
