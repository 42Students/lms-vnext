package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.SemesterSummaryDTO;
import com._42students.lms.dto.response.StudentCoursesResponseDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.StudentCourseService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/student-courses")
@Api(tags = "Student Courses")
public class StudentCourseController {
    private static final Logger logger = LoggerFactory.getLogger(StudentCourseController.class);
    private final StudentCourseService studentCourseService;

    @Autowired private SecurityContextUtil securityContextUtil;
    @Autowired private AccessControlService accessControlService;

    @Autowired
    public StudentCourseController(StudentCourseService studentCourseService) {
        this.studentCourseService = studentCourseService;
    }

    @GetMapping("/byStudent/{studentId}")
    @ApiOperation(value = "Get courses for a student, optionally for a specific semester (defaults to the batch's current semester)")
    public ResponseEntity<Map<String, Object>> getStudentCourses(
            @PathVariable Integer studentId, @RequestParam(required = false) Integer semesterId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessLearner(principal, studentId);
        try {
            StudentCoursesResponseDTO result = studentCourseService.getStudentCourses(studentId, semesterId);
            // Explicitly disclose a fallback instead of sending a 200 that appears to match
            // an invalid/foreign/deleted semester ID. The UI reconciles semester_id already.
            if (semesterId != null) {
                result.setRequestedSemesterId(semesterId);
                result.setSemesterFallbackApplied(!Objects.equals(semesterId, result.getSemesterId()));
            }
            result.redactForLearnerListing();
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "OK");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Access denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (Exception e) {
            logger.error("Error fetching courses for student {}: {}", studentId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "An error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/byStudent/{studentId}/semesters")
    @ApiOperation(value = "List the semesters in the student's own program, for the semester picker")
    public ResponseEntity<Map<String, Object>> getStudentSemesters(@PathVariable Integer studentId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessLearner(principal, studentId);
        try {
            List<SemesterSummaryDTO> result = studentCourseService.getStudentSemesters(studentId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "OK");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Access denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (Exception e) {
            logger.error("Error fetching semesters for student {}: {}", studentId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "An error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/byClass/{classId}")
    @ApiOperation(value = "Get courses for a class based on their batch's current semester")
    public ResponseEntity<Map<String, Object>> getCoursesByClass(@PathVariable Integer classId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessClass(principal, classId);
        try {
            StudentCoursesResponseDTO result = studentCourseService.getCoursesByClass(classId);
            // A Learner can legitimately read their own class list. Apply exactly the same
            // privacy boundary as /byStudent; only Faculty/admin retain detail fields here.
            if (principal != null && principal.isLearner()) result.redactForLearnerListing();
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "OK");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Access denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (Exception e) {
            logger.error("Error fetching courses for class {}: {}", classId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "An error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
