package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.enums.ContentType;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AssignmentContentWriteService;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

/**
 * Faculty-facing lesson-content creation. The broad /api/v1/lesson/** mutation gate remains
 * admin-only. Faculty content requires an active teaching assignment for its course and class.
 * ASSIGNMENT goes through its own validated writer: the generic content writer rejects this type.
 */
@RestController
@RequestMapping("/api/v1/faculty/lesson-contents")
public class FacultyLessonContentController {
    private final SecurityContextUtil securityContextUtil;
    private final AccessControlService accessControlService;
    private final FacultyTeachingAssignmentRepository teachingAssignments;
    private final LessonService lessonService;
    private final LessonContentController lessonContentController;

    // Optional field injection preserves the constructor used by existing controller slice tests.
    @Autowired(required = false)
    AssignmentContentWriteService assignmentWriter;

    public FacultyLessonContentController(SecurityContextUtil securityContextUtil,
                                          AccessControlService accessControlService,
                                          FacultyTeachingAssignmentRepository teachingAssignments,
                                          LessonService lessonService,
                                          LessonContentController lessonContentController) {
        this.securityContextUtil = securityContextUtil;
        this.accessControlService = accessControlService;
        this.teachingAssignments = teachingAssignments;
        this.lessonService = lessonService;
        this.lessonContentController = lessonContentController;
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@Valid @RequestBody LessonContentsDTO request) throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null || !principal.isFaculty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Faculty access required");
        }
        if (request.getLessonId() == null || request.getLessonId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid lessonId required");
        }
        Lesson lesson = lessonService.fetchCourseId(request.getLessonId());
        if (lesson == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        }
        Integer courseId = lesson.getCourseId();
        accessControlService.requireAccessCourse(principal, courseId);
        Integer classId = request.getClassId();
        if (classId != null && classId > 0) {
            accessControlService.requireAccessClass(principal, classId);
        }

        boolean isAdmin = accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        if (!isAdmin) {
            if (principal.getId() == null || !teachingAssignments.existsByFacultyIdAndCourseIdAndIsActive(
                    principal.getId(), courseId, true)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You may create content only for your actively assigned course");
            }
            if (classId != null && classId > 0
                    && !teachingAssignments.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(
                            principal.getId(), courseId, classId, true)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You may create class-specific content only for your assigned class");
            }
        }
        if (request.getContentType() == ContentType.ASSIGNMENT) {
            if (assignmentWriter == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Assignment writer unavailable");
            }
            LessonContents result = assignmentWriter.save(request);
            return ResponseEntity.ok(new Response<>("OK", "Assignment saved", result));
        }
        return lessonContentController.createLessonContents(request);
    }
}
