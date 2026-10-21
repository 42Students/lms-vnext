package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.enums.ContentType;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AssignmentContentWriteService;
import com._42students.lms.service.LessonService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

/** Admin and super-admin assignment authoring, with the same validated schema as faculty. */
@RestController
@RequestMapping("/api/v1/admin/assignments/content")
public class AdminAssignmentContentWriteController {
    private final AssignmentContentWriteService writer;
    private final SecurityContextUtil security;
    private final AccessControlService access;
    private final ScopeResolutionService scopes;
    private final LessonService lessons;

    public AdminAssignmentContentWriteController(AssignmentContentWriteService writer,
            SecurityContextUtil security, AccessControlService access,
            ScopeResolutionService scopes, LessonService lessons) {
        this.writer = writer;
        this.security = security;
        this.access = access;
        this.scopes = scopes;
        this.lessons = lessons;
    }

    @PostMapping("/save")
    public ResponseEntity<Response<LessonContents>> save(@Valid @RequestBody LessonContentsDTO dto) {
        UserPrincipal principal = security.getAuthenticatedUserPrincipal();
        if (principal == null || !(access.isSuperAdmin(principal)
                || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType())))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        if (dto.getContentType() != ContentType.ASSIGNMENT || dto.getLessonId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignment and lesson are required");
        }
        Lesson lesson = lessons.fetchCourseId(dto.getLessonId());
        if (lesson == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        Integer collegeId = scopes.resolveCourseToCollegeId(lesson.getCourseId());
        if (collegeId == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot resolve college scope");
        access.requirePerformAdminActionForCollege(principal, collegeId);
        LessonContents saved = writer.save(dto);
        return ResponseEntity.ok(new Response<>("OK", "Assignment saved", saved));
    }
}
