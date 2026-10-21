package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.ClassScheduleDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

/**
 * Narrow faculty-facing scheduling route. The academic-structure mutation gate intentionally
 * keeps /scheduleClass/** admin-only; this route admits faculty only when they have an ACTIVE
 * teaching assignment for the exact course and class, and cannot schedule on anyone's behalf.
 * Admins retain their existing /scheduleClass/create endpoint unchanged.
 */
@RestController
@RequestMapping("/api/v1/faculty/schedules")
public class FacultyClassScheduleController {
    private final SecurityContextUtil securityContextUtil;
    private final AccessControlService accessControlService;
    private final FacultyTeachingAssignmentRepository teachingAssignments;
    private final CourseSlugResolver courseSlugResolver;
    private final ClassScheduleService classScheduleService;

    public FacultyClassScheduleController(SecurityContextUtil securityContextUtil,
                                          AccessControlService accessControlService,
                                          FacultyTeachingAssignmentRepository teachingAssignments,
                                          CourseSlugResolver courseSlugResolver,
                                          ClassScheduleService classScheduleService) {
        this.securityContextUtil = securityContextUtil;
        this.accessControlService = accessControlService;
        this.teachingAssignments = teachingAssignments;
        this.courseSlugResolver = courseSlugResolver;
        this.classScheduleService = classScheduleService;
    }

    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody ClassScheduleDTO request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isFaculty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Faculty access required");
        }
        if (request.getClassId() <= 0 || request.getFacultyId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid class and faculty are required");
        }
        accessControlService.requireAccessClass(principal, request.getClassId());
        Integer suppliedCourseId = request.getCourseId() > 0 ? request.getCourseId() : null;
        int courseId = courseSlugResolver.resolve(request.getCourseSlug(), suppliedCourseId);
        accessControlService.requireAccessCourse(principal, courseId);

        boolean isAdmin = accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        if (!isAdmin) {
            if (principal.getId() == null || principal.getId() != request.getFacultyId()
                    || !teachingAssignments.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(
                            principal.getId(), courseId, request.getClassId(), true)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You may schedule only your own actively assigned course and class");
            }
        }
        // Both identifiers have been resolved and checked before delegating to the same service
        // used by the admin endpoint (time validation, conflicts and tenancy checks are reused).
        request.setCourseId(courseId);
        request.setCourseSlug(null);
        ClassSchedule schedule = classScheduleService.create(request);
        return ResponseEntity.ok(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), schedule));
    }
}
