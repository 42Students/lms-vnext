package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.AttendanceDTO;
import com._42students.lms.dto.request.BulkRegisterRequest;
import com._42students.lms.dto.request.BulkValidateRequest;
import com._42students.lms.dto.request.LearnerDTO;
import com._42students.lms.dto.request.LearnerClassMoveDTO;
import com._42students.lms.dto.request.ProgramDTO;
import com._42students.lms.dto.response.BulkRegisterResponse;
import com._42students.lms.dto.response.BulkValidateResponse;
import com._42students.lms.dto.response.AuthResponse;
import com._42students.lms.dto.response.NewProgramDetailsDTO;
import com._42students.lms.dto.response.LearnerResponseDTO;
import com._42students.lms.dto.response.LearnerCourseHomeStatsDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.model.Attend;
import com._42students.lms.model.Learner;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.model.Course;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.LearnerCourseHomeStatsService;
import com._42students.lms.service.NewProgramService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.NotificationTemplateContextResolver;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.TestOtpService;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.service.VerificationService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.DateUtils;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import javax.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;
import com._42students.lms.security.RateLimitingService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;


@RestController
@RequestMapping("/api/v1/learner")
@Slf4j
@Validated
public class LearnerController extends BaseController {

    @Autowired
    LearnerService learnerService;

    @Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    @Autowired
    VerificationService verificationService;

    @Autowired
    SmsService smsService;
    
    @Autowired
    private NotificationTemplateContextResolver contextResolver;

    @Autowired(required = false)
    private TestOtpService testOtpService;
    
    @Autowired
    private JwtService jwtService;

    @Autowired
    RestTemplate restTemplate;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired
    private com._42students.lms.access.ScopeResolutionService scopeResolutionService;

    @Autowired
    ClassScheduleService classScheduleService;

    @Autowired
    private NewProgramService newProgramService;

    @Autowired
    private DateUtils dateUtils;

    @Autowired
    private CourseService courseService;

    @Autowired(required = false)
    private LearnerCourseHomeStatsService learnerCourseHomeStatsService;

    @Autowired(required = false)
    private CourseSlugResolver courseSlugResolver;

    @Autowired(required = false)
    private RateLimitingService rateLimitingService;

    @Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    private int otpMaxAttempts() {
        return appSettingsService != null ? appSettingsService.getOtpMaxAttempts() : 5;
    }

    private long otpWindowSeconds() {
        return appSettingsService != null ? appSettingsService.getOtpWindowSeconds() : 900;
    }

    @Autowired
    private FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired(required = false)
    private com._42students.lms.service.UserSessionService userSessionService;

    /**
     * Attendance page: courses for the dropdown. Returns list of courses for the current learner's program.
     */
    @GetMapping(value = "/attendance/courses", produces = "application/json")
    @ApiOperation(value = "Get courses for learner attendance dropdown", notes = "Returns course options for the current learner only.")
    public ResponseEntity getAttendanceCourses() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Learner only", null), HttpStatus.FORBIDDEN);
        }
        if (principal.getId() == null || principal.getId() <= 0) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "Valid learner id is required", null), HttpStatus.BAD_REQUEST);
        }
        Learner learner;
        try {
            learner = learnerService.getLearnerDetails(String.valueOf(principal.getId()));
        } catch (Exception e) {
            log.warn("Attendance courses: getLearnerDetails failed for learner {}: {}", principal.getId(), e.getMessage());
            return new ResponseEntity(new Response(HttpStatus.SERVICE_UNAVAILABLE.name(), "Learner service unavailable", null), HttpStatus.SERVICE_UNAVAILABLE);
        }
        Integer classId = learner != null ? learner.getClassId() : null;
        Integer programId = scopeResolutionService.resolveLearnerToProgramId(principal.getId());
        List<Map<String, Object>> options = new ArrayList<>();
        int index = 0;
        if (programId != null) {
            NewProgramDetailsDTO program = newProgramService.fetchProgramDetails(programId);
            if (program != null && program.getProgramStructure() != null) {
                for (NewProgramDetailsDTO.ProgramStructureWithCourses s : program.getProgramStructure()) {
            if (s.getCourses() == null) continue;
            for (NewProgramDetailsDTO.CourseInfo c : s.getCourses()) {
                if (c == null || c.getId() == 0) continue;
                String label = c.getCourseName() != null ? c.getCourseName() : (c.getShortTitle() != null ? c.getShortTitle() : (c.getFormalTitle() != null ? c.getFormalTitle() : "Course " + c.getId()));
                Map<String, Object> opt = new LinkedHashMap<>();
                opt.put("id", c.getId());
                opt.put("label", label);
                opt.put("value", label);
                opt.put("course_name", c.getCourseName());
                opt.put("short_title", c.getShortTitle());
                opt.put("formal_title", c.getFormalTitle());
                opt.put("clsid", classId);
                opt.put("key", index++);
                options.add(opt);
            }
            }
            }
        }
        // Fallback: if no courses from program (programId null, or program/structure empty), use courses from class_schedule for learner's class
        if (options.isEmpty() && learner != null && learner.getClassId() != null) {
            List<Integer> courseIds = classScheduleService.getDistinctCourseIdsByClassId(learner.getClassId());
            if (courseIds != null) {
                for (Integer courseId : courseIds) {
                    if (courseId == null) continue;
                    try {
                        Course course = courseService.fetchCourse(courseId);
                        if (course != null && course.getId() != 0) {
                            String label = course.getCourseName() != null ? course.getCourseName() : (course.getShortTitle() != null ? course.getShortTitle() : "Course " + course.getId());
                            Map<String, Object> opt = new LinkedHashMap<>();
                            opt.put("id", course.getId());
                            opt.put("label", label);
                            opt.put("value", label);
                            opt.put("course_name", course.getCourseName());
                            opt.put("short_title", course.getShortTitle());
                            opt.put("formal_title", course.getShortTitle() != null ? course.getShortTitle() : course.getCourseName());
                            opt.put("clsid", learner.getClassId());
                            opt.put("key", index++);
                            options.add(opt);
                        }
                    } catch (Exception e) {
                        log.debug("Attendance courses: skip courseId {} - {}", courseId, e.getMessage());
                    }
                }
            }
        }
        // BE-0002: offer only courses whose records this learner may open (the records endpoint checks requireAccessCourse:
        // the current semester, an override, or a live elective). Past and future program courses used to be listed and
        // then answer 403.
        if (accessControlService != null) {
            options.removeIf(opt -> {
                Object id = opt.get("id");
                try {
                    return !(id instanceof Number) || !accessControlService.canAccessCourse(principal, ((Number) id).intValue());
                } catch (RuntimeException e) {
                    return true;
                }
            });
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), options), HttpStatus.OK);
    }

    /**
     * Attendance page: attendance records for the selected course and date range. Current learner from JWT.
     */
    @GetMapping(value = "/attendance/records", produces = "application/json")
    @ApiOperation(value = "Get learner attendance records for a course", notes = "Requires courseId, startDate, endDate (yyyy-MM-dd). Returns classes and absentids.")
    public ResponseEntity getAttendanceRecords(
            @RequestParam int courseId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Learner only", null), HttpStatus.FORBIDDEN);
        }
        if (principal.getId() == null || principal.getId() <= 0) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "Valid learner id is required", null), HttpStatus.BAD_REQUEST);
        }
        if (courseId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "courseId must be a positive integer");
        }
        // Validate courseId belongs to the authenticated learner's enrolled courses
        accessControlService.requireAccessCourse(principal, courseId);
        java.util.Date start = dateUtils.parseDateSafe(startDate).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid startDate: " + startDate));
        java.util.Date end = dateUtils.parseEndDateSafe(endDate).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid endDate: " + endDate));
        if (start.getTime() > end.getTime()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must be before or equal to endDate");
        }
        String learnerId = String.valueOf(principal.getId());
        Map<String, Object> response = classScheduleService.getClassScheduleAndAbsentInfoByCourse(learnerId, String.valueOf(courseId), start, end);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), response), HttpStatus.OK);
    }

    /**
     * Learner course home dashboard stats: progress, grades, next content, attendance.
     * Requires courseSlug or courseId. Learner only.
     */
    @GetMapping(value = "/courses/home-stats", produces = "application/json")
    @ApiOperation(value = "Get learner course home stats", notes = "Returns progress, grades, next content for the dashboard. Learner only. Use courseSlug (preferred) or courseId.")
    public ResponseEntity<Response<LearnerCourseHomeStatsDTO>> getCourseHomeStats(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId,
            HttpServletRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isLearner()) {
            return new ResponseEntity<>(new Response<>(HttpStatus.FORBIDDEN.name(), "Learner only", null), HttpStatus.FORBIDDEN);
        }
        if (rateLimitingService != null) {
            String key = "home_stats_learner_" + principal.getId();
            if (rateLimitingService.isRateLimited(key, 60, 60)) {
                return new ResponseEntity<>(new Response<>("TOO_MANY_REQUESTS", "Too many requests. Please try again later.", null), HttpStatus.TOO_MANY_REQUESTS);
            }
            rateLimitingService.recordAttempt(key, 60, 60);
        }
        if (learnerCourseHomeStatsService == null || courseSlugResolver == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.SERVICE_UNAVAILABLE.name(), "Service not available", null), HttpStatus.SERVICE_UNAVAILABLE);
        }
        int resolvedCourseId;
        try {
            resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        } catch (ResponseStatusException e) {
            return new ResponseEntity<>(new Response<>(String.valueOf(e.getStatus().value()), e.getReason(), null), e.getStatus());
        }
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        Learner learner;
        try {
            learner = learnerService.getLearnerDetails(String.valueOf(principal.getId()));
        } catch (Exception e) {
            log.warn("getLearnerDetails failed for learner {}: {}", principal.getId(), e.getMessage());
            return new ResponseEntity<>(new Response<>(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Could not load learner", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
        Integer classId = learner != null ? learner.getClassId() : null;
        LearnerCourseHomeStatsDTO stats = learnerCourseHomeStatsService.getHomeStats(principal.getId(), resolvedCourseId, classId);
        if (stats == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.NOT_FOUND.name(), "Course not found", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), stats), HttpStatus.OK);
    }

    /**
     * Returns the current learner's program details including program_structure and courses.
     * Used by learner attendance/course dropdown when programId is not available from login.
     */
    @GetMapping(value = "/myProgramDetails", produces = "application/json")
    @ApiOperation(value = "Get current learner's program details with courses", notes = "Returns same shape as fetchProgramDetails; for authenticated learner only.")
    public ResponseEntity getMyProgramDetails() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isLearner()) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Learner only", null), HttpStatus.FORBIDDEN);
        }
        Integer programId = scopeResolutionService.resolveLearnerToProgramId(principal.getId());
        if (programId == null) {
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), null), HttpStatus.OK);
        }
        NewProgramDetailsDTO program = newProgramService.fetchProgramDetails(programId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), program), HttpStatus.OK);
    }

    /**
     * @deprecated For profile updates, use the new granular Profile APIs at /api/v1/profile/learner/{learnerId}/*
     * This endpoint should only be used for initial learner registration by admin.
     */
    @Deprecated
    @RequestMapping(value = "/register", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Register a learner (Deprecated for profile updates - use /api/v1/profile/learner APIs)", notes = "Use granular profile APIs for profile updates")
    public ResponseEntity registerUser(@Valid @RequestBody LearnerDTO studentDTO, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer bodyCollegeId = studentDTO.getCollegeId();
        Integer programCollegeId = studentDTO.getProgramId() != null
                ? scopeResolutionService.resolveProgramToCollegeId(studentDTO.getProgramId()) : null;
        Integer classCollegeId = studentDTO.getClassId() != null
                ? scopeResolutionService.resolveClassToCollegeId(studentDTO.getClassId()) : null;
        Integer classProgramId = studentDTO.getClassId() != null
                ? scopeResolutionService.resolveClassToProgramId(studentDTO.getClassId()) : null;
        if (studentDTO.getClassId() != null && classProgramId == null) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "Learner class was not found", null), HttpStatus.BAD_REQUEST);
        }
        if (studentDTO.getProgramId() != null && classProgramId != null
                && !studentDTO.getProgramId().equals(classProgramId)) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(),
                    "Learner class must belong to the selected program", null), HttpStatus.BAD_REQUEST);
        }
        if (studentDTO.getProgramId() == null && classProgramId != null) {
            studentDTO.setProgramId(classProgramId);
            programCollegeId = scopeResolutionService.resolveProgramToCollegeId(classProgramId);
        }
        Integer resolvedCollegeId = classCollegeId != null ? classCollegeId
                : (programCollegeId != null ? programCollegeId : bodyCollegeId);
        if (resolvedCollegeId == null
                || (bodyCollegeId != null && !resolvedCollegeId.equals(bodyCollegeId))
                || (programCollegeId != null && !resolvedCollegeId.equals(programCollegeId))
                || (classCollegeId != null && !resolvedCollegeId.equals(classCollegeId))) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(),
                    "Learner class, program and college must belong to the same college", null), HttpStatus.BAD_REQUEST);
        }
        Integer resolvedOrganizationId = scopeResolutionService.resolveCollegeToOrganizationId(resolvedCollegeId);
        if (studentDTO.getOrganizationId() != null && resolvedOrganizationId != null
                && !studentDTO.getOrganizationId().equals(resolvedOrganizationId)) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(),
                    "Learner organization does not match the selected college", null), HttpStatus.BAD_REQUEST);
        }
        accessControlService.requirePerformAdminActionForCollege(principal, resolvedCollegeId);
        studentDTO.setCollegeId(resolvedCollegeId);
        if (resolvedOrganizationId != null) studentDTO.setOrganizationId(resolvedOrganizationId);
        try {
            Learner student = learnerService.register(studentDTO);
            // A student's audit trail started at their first edit; who added them was never recorded.
            if (auditLogService != null && student != null) {
                auditLogService.log(httpRequest, "LEARNER_CREATE", "learner", String.valueOf(student.getId()), null, resolvedCollegeId, Map.of());
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),student), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error registering learner: {}", e.getMessage());
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Unexpected error registering learner: ", e);
            return new ResponseEntity(new Response("error", "Failed to register learner. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @RequestMapping(value = "/bulk-validate", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Bulk validate mobiles and emails", notes = "Returns which mobiles/emails already exist. No side effects.")
    public ResponseEntity bulkValidate(@RequestBody @Valid BulkValidateRequest request) {
        accessControlService.requirePerformAdminActionForCollege(securityContextUtil.getAuthenticatedUserPrincipal(), request.getCollegeId());
        try {
            BulkValidateResponse response = learnerService.bulkValidate(request);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), response), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Bulk validate error: {}", e.getMessage());
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/bulk-register", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Bulk register learners", notes = "Create multiple learners for a college/program/class. Enforces college access.")
    public ResponseEntity bulkRegister(@RequestBody @Valid BulkRegisterRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = request.getCollegeId();
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only bulk-register learners in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only bulk-register learners within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            BulkRegisterResponse response = learnerService.bulkRegister(request);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), response), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Bulk register error: {}", e.getMessage());
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    // B3 in the audit: "a bad bulk import has no undo... no import batch id, no grouping."
    @RequestMapping(value = "/bulk-imports", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "List bulk-import batches for a college", notes = "One row per bulkRegister() call that created at least one learner, newest first.")
    public ResponseEntity listBulkImportBatches(@RequestParam Integer collegeId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), learnerService.listBulkImportBatches(collegeId)), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("List bulk-import batches error: {}", e.getMessage());
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/bulk-imports/{batchId}/undo", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Undo a bulk import", notes = "Soft-deletes every learner created by this import batch, scoped to collegeId.")
    public ResponseEntity undoBulkImport(@PathVariable String batchId, @RequestParam Integer collegeId, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            int count = learnerService.undoBulkImport(batchId, collegeId);
            if (auditLogService != null) {
                auditLogService.log(httpRequest, "LEARNER_BULK_IMPORT_UNDO", "learner_bulk_import", batchId, null, collegeId,
                        java.util.Map.of("learnersRemoved", count));
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Undone: " + count + " learner(s) removed", count), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            log.error("Undo bulk import error: {}", e.getMessage());
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/getAllLearners", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get all learners (super-admin only)", notes = "Returns learners scoped to caller's college, or all for super-admin. Use getLearnersByCollegeId for college-scoped admin.")
    public ResponseEntity getAllLearners(@RequestParam(required = false) Integer collegeId,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "50") int size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (accessControlService.isSuperAdmin(principal)) {
            Integer scopedCollegeId = principal.getCollegeId();
            Integer scopedOrgId = principal.getOrganizationId();
            // Safety: if JWT is scoped, don't allow client to override with an out-of-scope collegeId
            if (collegeId != null) {
                if (scopedCollegeId != null && !scopedCollegeId.equals(collegeId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only query learners for the selected college", null), HttpStatus.FORBIDDEN);
                }
                if (scopedOrgId != null) {
                    Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                    if (orgId != null && !scopedOrgId.equals(orgId)) {
                        return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only query learners within the selected organization", null), HttpStatus.FORBIDDEN);
                    }
                }
            }
            Integer effectiveCollegeId = collegeId != null ? collegeId : scopedCollegeId;
            if (effectiveCollegeId != null) {
                Page<Learner> learnerPage = learnerService.fetchContactsByCollegeIdPaged(
                        effectiveCollegeId, PageRequest.of(page, Math.min(size, 200)));
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("content", learnerPage.getContent());
                result.put("totalElements", learnerPage.getTotalElements());
                result.put("totalPages", learnerPage.getTotalPages());
                result.put("page", page);
                result.put("size", learnerPage.getSize());
                return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result), HttpStatus.OK);
            }
            if (scopedOrgId != null) {
                Page<Learner> learnerPage = learnerService.fetchContactsByOrganizationIdPaged(
                        scopedOrgId, PageRequest.of(page, Math.min(size, 200)));
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("content", learnerPage.getContent());
                result.put("totalElements", learnerPage.getTotalElements());
                result.put("totalPages", learnerPage.getTotalPages());
                result.put("page", page);
                result.put("size", learnerPage.getSize());
                return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result), HttpStatus.OK);
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), learnerService.findAll()), HttpStatus.OK);
        }
        // Regular admin: must scope to their own college
        Integer callerCollegeId = principal.getCollegeId();
        if (callerCollegeId == null) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Cannot determine college scope", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requirePerformAdminActionForCollege(principal, callerCollegeId);
        Page<Learner> learnerPage = learnerService.fetchContactsByCollegeIdPaged(
                callerCollegeId, PageRequest.of(page, Math.min(size, 200)));
        Map<String, Object> pagedResult = new LinkedHashMap<>();
        pagedResult.put("content", learnerPage.getContent());
        pagedResult.put("totalElements", learnerPage.getTotalElements());
        pagedResult.put("totalPages", learnerPage.getTotalPages());
        pagedResult.put("page", page);
        pagedResult.put("size", learnerPage.getSize());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), pagedResult), HttpStatus.OK);
    }

    @RequestMapping(value = "/getLearnersByCollegeId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get learners by college ID", notes = "Supports server-side paging/search/filtering for large admin rosters. Omitting page preserves the legacy array response.")
    public ResponseEntity getLearnersByCollegeId(@RequestParam int collegeId,
                                                 @RequestParam(value = "search", required = false) String search,
                                                 @RequestParam(value = "programId", required = false) Integer programId,
                                                 @RequestParam(value = "batchId", required = false) Integer batchId,
                                                 @RequestParam(value = "classId", required = false) Integer classId,
                                                 @RequestParam(value = "status", required = false) String status,
                                                 @RequestParam(value = "page", required = false) Integer page,
                                                 @RequestParam(value = "size", required = false) Integer size) {
        accessControlService.requirePerformAdminActionForCollege(
                securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);

        // Backwards-compatible legacy shape for older pickers. The admin roster explicitly sends
        // page/size and gets a bounded response; callers that have not migrated keep their array.
        if (page == null) {
            List<Learner> learners = learnerService.fetchContactsByCollegeId(collegeId);
            if (search != null && !search.trim().isEmpty()) {
                String normalized = search.trim().toLowerCase();
                learners = learners.stream().filter(item -> {
                    String firstName = item.getFirstName() != null ? item.getFirstName().toLowerCase() : "";
                    String lastName = item.getLastName() != null ? item.getLastName().toLowerCase() : "";
                    String mobile = item.getContactMobile() != null ? item.getContactMobile().toLowerCase() : "";
                    String email = item.getContactMail() != null ? item.getContactMail().toLowerCase() : "";
                    String uniqueId = item.getUniqueId() != null ? item.getUniqueId().toLowerCase() : "";
                    String rollNumber = item.getRollNumber() != null ? item.getRollNumber().toLowerCase() : "";
                    String itemClassId = item.getClassId() != null ? String.valueOf(item.getClassId()) : "";
                    return firstName.contains(normalized)
                            || lastName.contains(normalized)
                            || (firstName + " " + lastName).trim().contains(normalized)
                            || mobile.contains(normalized)
                            || email.contains(normalized)
                            || uniqueId.contains(normalized)
                            || rollNumber.contains(normalized)
                            || itemClassId.contains(normalized);
                }).toList();
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), learners), HttpStatus.OK);
        }

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size == null ? 25 : size, 200));
        Page<Learner> learnerPage = learnerService.fetchAdminRosterPage(
                collegeId, search, programId, batchId, classId, status,
                PageRequest.of(safePage, safeSize));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", learnerPage.getContent());
        result.put("totalElements", learnerPage.getTotalElements());
        result.put("totalPages", learnerPage.getTotalPages());
        result.put("page", learnerPage.getNumber());
        result.put("size", learnerPage.getSize());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result), HttpStatus.OK);
    }

    @RequestMapping(value = "/getLearnerDetails", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get learner details by Mobile Number", notes = "")
    public ResponseEntity<Learner> getStudentDetails(@RequestParam("learnerId") String learnerId) {
        try {
            int parsedId = Integer.parseInt(learnerId);
            accessControlService.requireAccessLearner(securityContextUtil.getAuthenticatedUserPrincipal(), parsedId);
        } catch (NumberFormatException e) {
            log.warn("Invalid learner id for getLearnerDetails: {}", learnerId);
            return new ResponseEntity(new Response("error", "Invalid learner id", null), HttpStatus.BAD_REQUEST);
        }
        try {
            Learner learner = learnerService.getLearnerDetails(learnerId);
            if (learner != null) {
                scopeResolutionService.enrichLearnerHierarchy(learner);
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), learner), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error getting learner details for {}", learnerId, e);
            return new ResponseEntity(new Response("error", "Failed to get learner details. Please try again or contact support.", null), HttpStatus.BAD_REQUEST);
        }
    }


    @RequestMapping(value = "/getProgramDetailsByLearnerId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get Program details by Learner Id", notes = "")
    public ResponseEntity<ProgramDTO> getProgramDetails(String learnerId)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            int parsedId = Integer.parseInt(learnerId);
            accessControlService.requireAccessLearner(principal, parsedId);
        } catch (NumberFormatException e) {
            return new ResponseEntity(new Response("error", "Invalid learner id", null), HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                learnerService.getProgramDetails(learnerId)), HttpStatus.OK);
    }

    @RequestMapping(value = "/getLearnerDetailsByClassId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get learner details by Class Id", notes = "")
    public ResponseEntity<List<LearnerDTO>> getStudentDetailsByClassId(int classId)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        accessControlService.requireAccessClass(principal, classId);
        boolean isAdmin = accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getUserType())
                || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
        if (!isAdmin && (!principal.isFaculty() || facultyTeachingAssignmentRepository == null
                || facultyTeachingAssignmentRepository.findByFacultyIdAndIsActive(principal.getId(), true)
                    .stream().noneMatch(a -> java.util.Objects.equals(a.getClassId(), classId)))) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only an admin or assigned class faculty may view this roster");
        }
        List<LearnerResponseDTO> learnerDTOS = learnerService.getStudentDetailsByClassId(classId);
        // The guard above already rejects any non-admin caller who isn't an actively assigned
        // teaching faculty for this exact class, so "reached this line and not admin" already
        // means "assigned faculty for this roster" -- masking contact info for them too (as the
        // old isAdmin-only check did, requiring facultyType == ADMIN specifically) hid every
        // regular teaching faculty's own students' phone/email, the point of showing those
        // columns to faculty on the frontend at all. Only mask for a caller who is neither.
        boolean canViewContactInfo = isAdmin || principal.isFaculty();
        if (!canViewContactInfo) {
            learnerDTOS.forEach(item -> {
                item.setContactPhone(null);
                item.setContactMobile(null);
                item.setContactMail(null);
                item.setDob(null);
                item.setAddress(null);
                item.setWebsite(null);
                item.setOrganizations(null);
                item.setExperiences(null);
                item.setQualifications(null);
            });
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                learnerDTOS)
                , HttpStatus.OK);
    }

    @RequestMapping(value = "/login", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Login learner with phone number", notes = "") 
    
    public ResponseEntity login(String phoneNumber)
            throws Exception {
        String phone = phoneNumber != null ? phoneNumber.trim() : null;
        if (phone == null || phone.isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        Learner learner = learnerService.getLearnerDetails(phoneNumber);
        if (null == learner) {
            throw new Exception("No learner registered with Mobile number " + phoneNumber);
        }
        // Rate limit OTP send requests per phone number (5 per 15 minutes)
        if (rateLimitingService != null) {
            String key = "learner:login:" + phone;
            if (rateLimitingService.isRateLimited(key, otpMaxAttempts(), otpWindowSeconds())) {
                throw new Exception("Too many OTP requests. Please try again later.");
            }
            rateLimitingService.recordAttempt(key, otpMaxAttempts(), otpWindowSeconds());
        }
        String otp = (testOtpService != null && testOtpService.isTestPhone(phoneNumber))
                ? testOtpService.getOtpForTestPhone()
                : String.valueOf(ThreadLocalRandom.current().nextInt(1000, 9999));
        // Determine context based on learner's college
        NotificationTemplateContext context = contextResolver.getContextForLearner(learner);
        smsService.sendOtp(phoneNumber, otp, context);
        verificationService.saveAccountVerification(phoneNumber, otp);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),"OTP triggered"),
                HttpStatus.OK);
    }

    @RequestMapping(value = "/login/alternate", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Login learner with student roll number", notes = "Disabled - use standard OTP login")
    public ResponseEntity alternateLogin(String rollNumber, String collegeId) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(new Response("error", "This authentication method is disabled. Please use the standard OTP login.", null));
    }


    @RequestMapping(value = "/verifyOTP", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Verify OTP for learner phone number", notes = "Returns learner data with JWT tokens")
    public ResponseEntity verifyOTP(String phoneNumber, String otp, HttpServletRequest request)
            throws Exception {
        String phone = phoneNumber != null ? phoneNumber.trim() : null;
        String otpTrimmed = otp != null ? otp.trim() : null;
        if (phone == null || phone.isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        if (otpTrimmed == null || otpTrimmed.isEmpty()) {
            throw new IllegalArgumentException("OTP is required");
        }
        // Rate limit OTP verification attempts per phone number (5 per 15 minutes)
        if (rateLimitingService != null) {
            String key = "learner:verifyOTP:" + phone;
            if (rateLimitingService.isRateLimited(key, otpMaxAttempts(), otpWindowSeconds())) {
                throw new Exception("Too many verification attempts. Please try again later.");
            }
            rateLimitingService.recordAttempt(key, otpMaxAttempts(), otpWindowSeconds());
        }
        Learner learner = learnerService.getLearnerDetails(phoneNumber);
        if (null == learner) {
            throw new Exception("No learner registered with Mobile number " + phoneNumber);
        } else if (testOtpService != null && testOtpService.matchesTestOtp(phoneNumber, otp)) {
            // ok
        } else if (!verificationService.verifyOTP(phone, otpTrimmed)) {
            throw new Exception("Incorrect OTP");
        }
        if (learner.getSuspendedAt() != null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED");
        }
        scopeResolutionService.enrichLearnerHierarchy(learner);
        UserPrincipal principal = UserPrincipal.fromLearner(learner);
        TokenPair tokens = jwtService.generateTokens(principal);
        // AC-05: record session for per-device tracking
        if (userSessionService != null && tokens.getRefreshTokenJti() != null) {
            java.time.LocalDateTime expiresAt = java.time.LocalDateTime.now().plusSeconds(
                    jwtService.getRefreshExpirationSeconds());
            userSessionService.createSession(tokens.getRefreshTokenJti(),
                    learner.getId(), "LEARNER",
                    request != null ? request.getHeader("X-Device-Name") : null,
                    request != null ? request.getHeader("User-Agent") : null,
                    request != null ? com._42students.lms.security.RateLimitingService.getClientIp(request) : null,
                    expiresAt);
        }
        AuthResponse authResponse = AuthResponse.of(learner, tokens);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                authResponse)
                , HttpStatus.OK);
    }

    @RequestMapping(value = "/verifyOTP/alternate", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Verify OTP for learner roll number", notes = "Returns learner data with JWT tokens")
    public ResponseEntity verifyAlternateOTP(String rollNumber, String collegeId, String otp,
                                             HttpServletRequest request)
            throws Exception {
        Learner studentDetails = learnerService.getLearnerDetailsForAlternateLogin(
            rollNumber, collegeId
        );
        if (null == studentDetails) {
            throw new Exception("No learner registered with given roll number " + rollNumber);
        } else if (!verificationService.verifyAlternateOTP(studentDetails.getId(), otp) ) {
            throw new Exception("Incorrect OTP");
        }
        if (studentDetails.getSuspendedAt() != null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED");
        }
        scopeResolutionService.enrichLearnerHierarchy(studentDetails);
        UserPrincipal principal = UserPrincipal.fromLearner(studentDetails);
        TokenPair tokens = jwtService.generateTokens(principal);
        // AC-05: record session for per-device tracking
        if (userSessionService != null && tokens.getRefreshTokenJti() != null) {
            java.time.LocalDateTime expiresAt = java.time.LocalDateTime.now().plusSeconds(
                    jwtService.getRefreshExpirationSeconds());
            userSessionService.createSession(tokens.getRefreshTokenJti(),
                    studentDetails.getId(), "LEARNER",
                    request != null ? request.getHeader("X-Device-Name") : null,
                    request != null ? request.getHeader("User-Agent") : null,
                    request != null ? com._42students.lms.security.RateLimitingService.getClientIp(request) : null,
                    expiresAt);
        }
        AuthResponse authResponse = AuthResponse.of(studentDetails, tokens);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                authResponse)
                , HttpStatus.OK);
    }

    @RequestMapping(value = "/attend", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Mark learner as absent for a class schedule", notes = "Only faculty or admin may mark attendance; requires access to the class")
    public ResponseEntity<?> markAttendance(@RequestBody @javax.validation.Valid AttendanceDTO attendanceDTO, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (principal.isLearner()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admin can mark attendance");
        }
        ClassSchedule schedule = classScheduleService.getClassScheduleDetail(attendanceDTO.getClassScheduleId());
        if (schedule == null) {
            return new ResponseEntity<>(new Response(HttpStatus.NOT_FOUND.name(), "Class schedule not found", null), HttpStatus.NOT_FOUND);
        }
        accessControlService.requireAccessClass(principal, schedule.getClassId());
        // AT-01: faculty must be assigned to this specific course+class, not just the college
        if ("FACULTY".equalsIgnoreCase(principal.getUserType())
                && schedule.getCourseId() > 0) {
            int scheduleCourseId = schedule.getCourseId();
            Integer scheduleClassId = schedule.getClassId();
            boolean assigned = facultyTeachingAssignmentRepository
                    .findByFacultyIdAndIsActive(principal.getId(), true)
                    .stream()
                    .anyMatch(a -> a.getCourseId() != null && a.getCourseId() == scheduleCourseId
                            && (scheduleClassId == null || (a.getClassId() != null && a.getClassId().equals(scheduleClassId))));
            if (!assigned) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to teach this class");
            }
        }
        try {
            Attend attend = learnerService.attend(attendanceDTO);
            classScheduleService.markAttendanceTaken(attendanceDTO.getClassScheduleId());
            // AT-20/4.3: audit trail — record who marked this student absent. Previously log-only
            // (grep-only, whatever log retention exists); now also a queryable AdminAuditLog row so
            // an admin investigating a disputed eligibility number can actually find who marked it
            // and when, from the product, not the application logs.
            log.info("AT-20 AUDIT: userId={} userType={} marked studentId={} absent for classScheduleId={}",
                    principal.getId(), principal.getUserType(),
                    attendanceDTO.getStudentId(), attendanceDTO.getClassScheduleId());
            if (auditLogService != null) {
                auditLogService.log(httpRequest, "ATTENDANCE_MARK_ABSENT", "attend", String.valueOf(attend.getId()),
                        null, null, Map.of("studentId", attendanceDTO.getStudentId(),
                                "classScheduleId", attendanceDTO.getClassScheduleId()));
            }
            return new ResponseEntity<>(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), attend), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/attend")
    @ApiOperation(value = "Remove absence (mark present) for a class schedule", notes = "Soft-deletes the absence record. Requires faculty/admin access to the class.")
    public ResponseEntity<?> removeAttendance(@RequestParam String studentId, @RequestParam int classScheduleId, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (principal.isLearner()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only faculty or admin can remove attendance");
        }
        ClassSchedule schedule = classScheduleService.getClassScheduleDetail(classScheduleId);
        if (schedule == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Class schedule not found");
        }
        accessControlService.requireAccessClass(principal, schedule.getClassId());
        // AT-01: same faculty-teaching-assignment check as markAttendance — requireAccessClass
        // alone only proves "this class is in my college", not "I teach it". Without this, any
        // faculty account in the college could clear another faculty's marked absences for a
        // class they have no assignment to.
        if ("FACULTY".equalsIgnoreCase(principal.getUserType())
                && schedule.getCourseId() > 0) {
            int scheduleCourseId = schedule.getCourseId();
            Integer scheduleClassId = schedule.getClassId();
            boolean assigned = facultyTeachingAssignmentRepository
                    .findByFacultyIdAndIsActive(principal.getId(), true)
                    .stream()
                    .anyMatch(a -> a.getCourseId() != null && a.getCourseId() == scheduleCourseId
                            && (scheduleClassId == null || (a.getClassId() != null && a.getClassId().equals(scheduleClassId))));
            if (!assigned) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to teach this class");
            }
        }
        learnerService.removeAbsence(studentId, classScheduleId);
        classScheduleService.markAttendanceTaken(classScheduleId);
        // AT-20/4.3: audit trail — record who removed the absence (marked present)
        log.info("AT-20 AUDIT: userId={} userType={} removed absence for studentId={} classScheduleId={}",
                principal.getId(), principal.getUserType(), studentId, classScheduleId);
        if (auditLogService != null) {
            auditLogService.log(httpRequest, "ATTENDANCE_REMOVE_ABSENCE", "attend", studentId + ":" + classScheduleId,
                    null, null, Map.of("studentId", studentId, "classScheduleId", classScheduleId));
        }
        return new ResponseEntity<>(new Response(HttpStatus.OK.name(), "Absence removed", null), HttpStatus.OK);
    }
 

   
    @ApiOperation(value = "Get learners by Program Id")
    @GetMapping(value = "/getLearnersByProgram", produces = "application/json")
    public ResponseEntity<Response<List<LearnerResponseDTO>>> getLearnersByProgram(@RequestParam int programId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requirePerformAdminActionForCollege(principal,
                scopeResolutionService.resolveProgramToCollegeId(programId));
        List<LearnerResponseDTO> learnerResponseDTOList = learnerService.getLearnersByProgram(programId);
        return ResponseEntity.ok(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), learnerResponseDTOList));
    }

    @ApiOperation(value = "Get learner by College and Roll Number")
    @GetMapping("/getLearnerByCollegeAndRoll")
    public ResponseEntity<Learner> getLearnerByCollegeAndRoll(
            @RequestParam(name = "collegeId") Integer collegeId,
            @RequestParam(name = "rollNumber") String rollNumber) {
        accessControlService.requirePerformAdminActionForCollege(
                securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        Learner learner = learnerService.getLearnerByCollegeAndRoll(collegeId, rollNumber);
        if (learner != null) {
            return ResponseEntity.ok(learner);
        } else {
            return ResponseEntity.notFound().build();
        }
    }


    @GetMapping("/getLearnerAttendancePercentage")
    @ApiOperation(value = "Get attendance percentage for a learner", notes = "Caller must have access to the learner (self, or faculty/admin for that college)")
    public ResponseEntity<Double> getAttendancePercentage(@RequestParam String studentId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        // AT-13: parse learner ID and authorize before revealing whether learner exists
        int learnerId;
        try {
            learnerId = Integer.parseInt(studentId);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid studentId");
        }
        if (learnerId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId must be a positive integer");
        }
        if (principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !Objects.equals(principal.getId(), learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners may only fetch their own attendance percentage");
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        Learner learner = learnerService.getLearnerDetails(studentId);
        if (learner == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found");
        }
        // AT-16: faculty may only view attendance for learners in classes they are assigned to teach
        if ("FACULTY".equalsIgnoreCase(principal.getUserType())
                && !accessControlService.isSuperAdmin(principal)
                && learner.getClassId() != null) {
            boolean teachesLearnerClass = facultyTeachingAssignmentRepository
                    .findByFacultyIdAndIsActive(principal.getId(), true)
                    .stream()
                    .anyMatch(a -> learner.getClassId().equals(a.getClassId()));
            if (!teachesLearnerClass) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to teach any course in this learner's class");
            }
        }
        double attendancePercentage = learnerService.getAttendancePercentage(String.valueOf(learner.getId()));
        return ResponseEntity.ok(attendancePercentage);
    }

    // 2.5: per-course variant, additive -- getLearnerAttendancePercentage above is unchanged and
    // stays class-wide. Same auth/existence checks as that endpoint.
    @GetMapping("/getLearnerAttendancePercentageByCourse")
    @ApiOperation(value = "Get per-course attendance percentage for a learner", notes = "Caller must have access to the learner (self, or faculty/admin for that college)")
    public ResponseEntity<Double> getAttendancePercentageByCourse(@RequestParam String studentId, @RequestParam int courseId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        int learnerId;
        try {
            learnerId = Integer.parseInt(studentId);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid studentId");
        }
        if (learnerId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId must be a positive integer");
        }
        if (principal.isLearner() && principal.getId() != null && principal.getId() > 0 && !Objects.equals(principal.getId(), learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners may only fetch their own attendance percentage");
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        Learner learner = learnerService.getLearnerDetails(studentId);
        if (learner == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found");
        }
        if ("FACULTY".equalsIgnoreCase(principal.getUserType())
                && !accessControlService.isSuperAdmin(principal)
                && learner.getClassId() != null) {
            boolean teachesLearnerClass = facultyTeachingAssignmentRepository
                    .findByFacultyIdAndIsActive(principal.getId(), true)
                    .stream()
                    .anyMatch(a -> learner.getClassId().equals(a.getClassId()));
            if (!teachesLearnerClass) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to teach any course in this learner's class");
            }
        }
        double attendancePercentage = learnerService.getAttendancePercentageByCourse(String.valueOf(learner.getId()), courseId);
        return ResponseEntity.ok(attendancePercentage);
    }

    @RequestMapping(value = "/{id}/move-class", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Move a learner to another section in the same batch")
    public ResponseEntity moveLearnerToClass(
            @PathVariable Integer id,
            @Valid @RequestBody LearnerClassMoveDTO moveDTO,
            HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService.resolveLearnerToCollegeId(id);
        if (collegeId == null) {
            return new ResponseEntity(
                    new Response(HttpStatus.NOT_FOUND.name(), "Learner college could not be resolved", null),
                    HttpStatus.NOT_FOUND);
        }
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(
                        new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only move learners in the selected college", null),
                        HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId == null || !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(
                            new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only move learners within the selected organization", null),
                            HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);

        try {
            Learner before = learnerService.getLearnerDetails(String.valueOf(id));
            Integer fromClassId = before != null ? before.getClassId() : null;
            Learner updated = learnerService.moveLearnerToClass(id, moveDTO.getTargetClassId());
            if (auditLogService != null) {
                Map<String, Object> details = new java.util.HashMap<>();
                details.put("classIdFrom", String.valueOf(fromClassId));
                details.put("classIdTo", String.valueOf(updated.getClassId()));
                auditLogService.log(httpRequest, "LEARNER_CLASS_MOVE", "learner",
                        String.valueOf(id), null, collegeId, details);
            }
            return new ResponseEntity(
                    new Response(HttpStatus.OK.name(), "Learner moved successfully", updated),
                    HttpStatus.OK);
        } catch (IllegalStateException e) {
            return new ResponseEntity(
                    new Response(HttpStatus.CONFLICT.name(), e.getMessage(), null),
                    HttpStatus.CONFLICT);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(
                    new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null),
                    HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            boolean notFound = e.getMessage() != null && e.getMessage().toLowerCase().contains("not found");
            return new ResponseEntity(
                    new Response(notFound ? HttpStatus.NOT_FOUND.name() : HttpStatus.BAD_REQUEST.name(), e.getMessage(), null),
                    notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Update a learner/student", notes = "")
    public ResponseEntity updateLearner(@PathVariable Integer id, @Valid @RequestBody LearnerDTO learnerDTO, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService.resolveLearnerToCollegeId(id);
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal) && collegeId != null) {
            if (principal.getCollegeId() != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update learners in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update learners within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            // Part B "Users: audited class/batch transfer with history". A transfer IS just an
            // edit of these fields, and the edit was already audited — but with an empty payload,
            // so the trail recorded only THAT something changed, never that a student moved from
            // one class/program to another. Snapshot the placement fields before the write so the
            // audit row carries the actual before/after.
            Learner before = learnerService.getLearnerDetails(String.valueOf(id));
            Integer prevClassId = before != null ? before.getClassId() : null;
            Integer prevProgramId = before != null ? before.getProgramId() : null;
            Learner updatedLearner = learnerService.updateLearner(id, learnerDTO);
            // Was previously unaudited — Students.js's "Edit" action left no trail at all. entityId
            // is the learner's own id, stable/linkable for the audit-trail drill-down on that page.
            if (auditLogService != null) {
                Map<String, Object> details = new java.util.HashMap<>();
                Integer newClassId = updatedLearner != null ? updatedLearner.getClassId() : null;
                Integer newProgramId = updatedLearner != null ? updatedLearner.getProgramId() : null;
                if (!java.util.Objects.equals(prevClassId, newClassId)) {
                    details.put("classIdFrom", String.valueOf(prevClassId));
                    details.put("classIdTo", String.valueOf(newClassId));
                }
                if (!java.util.Objects.equals(prevProgramId, newProgramId)) {
                    details.put("programIdFrom", String.valueOf(prevProgramId));
                    details.put("programIdTo", String.valueOf(newProgramId));
                }
                auditLogService.log(httpRequest, details.isEmpty() ? "LEARNER_UPDATE" : "LEARNER_TRANSFER",
                        "learner", String.valueOf(id), null, collegeId, details);
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), updatedLearner), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete a learner/student", notes = "")
    public ResponseEntity deleteLearner(@PathVariable Integer id, HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService.resolveLearnerToCollegeId(id);
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal) && collegeId != null) {
            if (principal.getCollegeId() != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete learners in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete learners within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            learnerService.deleteLearner(id);
            if (auditLogService != null) {
                auditLogService.log(httpRequest, "LEARNER_DELETE", "learner", String.valueOf(id), null, collegeId, Map.of());
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Learner deleted successfully", null), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }
}

