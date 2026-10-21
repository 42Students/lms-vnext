package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.TeachingAssignmentScopeValidator;
import com._42students.lms.dto.request.FacultyTeachingAssignmentDTO;
import com._42students.lms.dto.response.FacultyTeachingAssignmentResponseDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FacultyTeachingAssignmentService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/teaching-assignment")
@Api(tags = "Faculty Teaching Assignment Management")
public class FacultyTeachingAssignmentController {
    private final FacultyTeachingAssignmentService assignmentService;

    @Autowired private AccessControlService accessControlService;
    @Autowired private SecurityContextUtil securityContextUtil;
    @Autowired private TeachingAssignmentScopeValidator assignmentScopeValidator;

    @Autowired
    public FacultyTeachingAssignmentController(FacultyTeachingAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    private void requireTeachingAssignmentAdminRole(UserPrincipal principal) {
        if (principal == null) throw new AccessDeniedException("Authentication required");
        boolean isAdmin = accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getUserType())
                || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
        if (!isAdmin) throw new AccessDeniedException("Only an admin can manage teaching assignments");
    }

    /** Learners receive their own curriculum instructor summary, not another faculty member's assignment roster. */
    private void requireFacultyAssignmentReader(UserPrincipal principal) {
        if (principal == null || principal.isLearner()) {
            throw new AccessDeniedException("Faculty assignment lists require faculty or administrative access");
        }
    }

    private Map<String, Object> response(String status, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("status", status);
        result.put("message", message);
        return result;
    }

    private ResponseEntity<Map<String, Object>> writeError(String action, Exception e) {
        log.error("Failed to {} teaching assignment", action, e);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(response("ERROR", "Failed to " + action + " assignment. Please check the supplied details."));
    }

    @GetMapping("/get/{id}")
    @ApiOperation(value = "Get assignment details by ID")
    public ResponseEntity<Map<String, Object>> getAssignmentById(@PathVariable Integer id) {
        FacultyTeachingAssignmentResponseDTO result = assignmentService.getAssignmentById(id);
        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(response("NOT_FOUND", "Assignment not found with id: " + id));
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireExistingScope(principal, result);
        Map<String, Object> body = response("OK", "OK");
        body.put("data", result);
        return ResponseEntity.ok(body);
    }

    private void requireExistingScope(UserPrincipal principal, FacultyTeachingAssignmentResponseDTO existing) {
        if (existing.getClassId() != null) {
            accessControlService.requireAccessClass(principal, existing.getClassId());
        } else if (existing.getBatchId() != null) {
            accessControlService.requireAccessBatch(principal, existing.getBatchId().longValue());
        } else if (!accessControlService.isGlobalSuperAdmin(principal)) {
            throw new AccessDeniedException("Assignment has no resolvable class or batch scope");
        }
    }

    @PostMapping("/create")
    @ApiOperation(value = "Create a new teaching assignment")
    public ResponseEntity<Map<String, Object>> createAssignment(@Valid @RequestBody FacultyTeachingAssignmentDTO dto) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        try {
            assignmentScopeValidator.validate(principal, dto, null, false);
            FacultyTeachingAssignmentResponseDTO result = assignmentService.createAssignment(dto);
            Map<String, Object> body = response("OK", "Assignment created successfully");
            body.put("data", result);
            return ResponseEntity.status(HttpStatus.CREATED).body(body);
        } catch (AccessDeniedException | ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return writeError("create", e);
        }
    }

    @PostMapping("/createBulk")
    @ApiOperation(value = "Create multiple teaching assignments for a faculty")
    public ResponseEntity<Map<String, Object>> createBulkAssignments(@Valid @RequestBody FacultyTeachingAssignmentDTO dto) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        try {
            assignmentScopeValidator.validate(principal, dto, null, true);
            List<FacultyTeachingAssignmentResponseDTO> result = assignmentService.createBulkAssignments(dto);
            Map<String, Object> body = response("OK", result.size() + " assignments created");
            body.put("data", result);
            return ResponseEntity.status(HttpStatus.CREATED).body(body);
        } catch (AccessDeniedException | ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return writeError("create bulk", e);
        }
    }

    @PutMapping("/update/{id}")
    @ApiOperation(value = "Update an existing assignment")
    public ResponseEntity<Map<String, Object>> updateAssignment(
            @PathVariable Integer id, @Valid @RequestBody FacultyTeachingAssignmentDTO dto) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        FacultyTeachingAssignmentResponseDTO existing = assignmentService.getAssignmentById(id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(response("ERROR", "Assignment not found with id: " + id));
        }
        requireExistingScope(principal, existing);
        try {
            assignmentScopeValidator.validate(principal, dto, existing, false);
            FacultyTeachingAssignmentResponseDTO result = assignmentService.updateAssignment(id, dto);
            Map<String, Object> body = response("OK", "Assignment updated successfully");
            body.put("data", result);
            return ResponseEntity.ok(body);
        } catch (AccessDeniedException | ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return writeError("update", e);
        }
    }

    @DeleteMapping("/delete/{id}")
    @ApiOperation(value = "Delete an assignment")
    public ResponseEntity<Map<String, Object>> deleteAssignment(@PathVariable Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        FacultyTeachingAssignmentResponseDTO existing = assignmentService.getAssignmentById(id);
        if (existing == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(response("NOT_FOUND", "Assignment not found with id: " + id));
        requireExistingScope(principal, existing);
        try {
            assignmentService.deleteAssignment(id);
            return ResponseEntity.ok(response("OK", "Assignment deleted successfully"));
        } catch (Exception e) {
            return writeError("delete", e);
        }
    }

    @PutMapping("/deactivate/{id}")
    @ApiOperation(value = "Deactivate an assignment (soft delete)")
    public ResponseEntity<Map<String, Object>> deactivateAssignment(@PathVariable Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        FacultyTeachingAssignmentResponseDTO existing = assignmentService.getAssignmentById(id);
        if (existing == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(response("NOT_FOUND", "Assignment not found with id: " + id));
        requireExistingScope(principal, existing);
        try {
            assignmentService.deactivateAssignment(id);
            return ResponseEntity.ok(response("OK", "Assignment deactivated"));
        } catch (Exception e) {
            return writeError("deactivate", e);
        }
    }

    @GetMapping("/byFaculty/{facultyId}")
    @ApiOperation(value = "Get all assignments for a faculty")
    public ResponseEntity<Map<String, Object>> getAssignmentsByFaculty(@PathVariable Integer facultyId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireFacultyAssignmentReader(principal);
        accessControlService.requireAccessFacultySchedule(principal, facultyId);
        Map<String, Object> body = response("OK", "OK");
        body.put("data", assignmentService.getAssignmentsByFaculty(facultyId));
        return ResponseEntity.ok(body);
    }

    @GetMapping("/byFaculty/{facultyId}/active")
    @ApiOperation(value = "Get active assignments for a faculty")
    public ResponseEntity<Map<String, Object>> getActiveAssignmentsByFaculty(@PathVariable Integer facultyId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireFacultyAssignmentReader(principal);
        accessControlService.requireAccessFacultySchedule(principal, facultyId);
        Map<String, Object> body = response("OK", "OK");
        body.put("data", assignmentService.getActiveAssignmentsByFaculty(facultyId));
        return ResponseEntity.ok(body);
    }

    @GetMapping("/byClass/{classId}")
    @ApiOperation(value = "Get assignments for a class")
    public ResponseEntity<Map<String, Object>> getAssignmentsByClass(@PathVariable Integer classId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessClass(principal, classId);
        Map<String, Object> body = response("OK", "OK");
        body.put("data", assignmentService.getAssignmentsByClass(classId));
        return ResponseEntity.ok(body);
    }

    @GetMapping("/byClass/{classId}/semester/{semesterNumber}")
    @ApiOperation(value = "Get assignments for a class in a specific semester")
    public ResponseEntity<Map<String, Object>> getAssignmentsByClassAndSemester(
            @PathVariable Integer classId, @PathVariable Integer semesterNumber) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessClass(principal, classId);
        Map<String, Object> body = response("OK", "OK");
        body.put("data", assignmentService.getAssignmentsByClassAndSemester(classId, semesterNumber));
        return ResponseEntity.ok(body);
    }

    @GetMapping("/byBatch/{batchId}")
    @ApiOperation(value = "Get assignments for a batch")
    public ResponseEntity<Map<String, Object>> getAssignmentsByBatch(@PathVariable Integer batchId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessBatch(principal, batchId.longValue());
        Map<String, Object> body = response("OK", "OK");
        body.put("data", assignmentService.getAssignmentsByBatch(batchId));
        return ResponseEntity.ok(body);
    }

    @GetMapping("/page")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @ApiOperation(value = "Get tenant-scoped teaching assignments with server-side paging")
    public ResponseEntity<Map<String, Object>> getAssignmentsPage(
            @RequestParam Integer collegeId,
            @RequestParam(required = false) Integer classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        if (classId != null) {
            accessControlService.requireAccessClass(principal, classId);
        }
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 200));
        Page<FacultyTeachingAssignmentResponseDTO> result =
                assignmentService.getAdminAssignmentsPage(
                        collegeId, classId, PageRequest.of(safePage, safeSize));
        Map<String, Object> pageBody = new HashMap<>();
        pageBody.put("content", result.getContent());
        pageBody.put("totalElements", result.getTotalElements());
        pageBody.put("totalPages", result.getTotalPages());
        pageBody.put("page", result.getNumber());
        pageBody.put("size", result.getSize());
        Map<String, Object> body = response("OK", "OK");
        body.put("data", pageBody);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/fetchAll")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @ApiOperation(value = "Get all assignments")
    public ResponseEntity<Map<String, Object>> getAllAssignments() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        List<FacultyTeachingAssignmentResponseDTO> result = assignmentService.getAllAssignments().stream()
                .filter(assignment -> {
                    if (assignment.getClassId() != null) {
                        return accessControlService.canAccessClass(principal, assignment.getClassId());
                    }
                    if (assignment.getBatchId() != null) {
                        return accessControlService.canAccessBatch(principal, assignment.getBatchId().longValue());
                    }
                    return accessControlService.isGlobalSuperAdmin(principal);
                }).collect(Collectors.toList());
        Map<String, Object> body = response("OK", "OK");
        body.put("data", result);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/fetchActive")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @ApiOperation(value = "Get all active assignments")
    public ResponseEntity<Map<String, Object>> getAllActiveAssignments() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        List<FacultyTeachingAssignmentResponseDTO> result = assignmentService.getAllActiveAssignments().stream()
                .filter(assignment -> {
                    if (assignment.getClassId() != null) {
                        return accessControlService.canAccessClass(principal, assignment.getClassId());
                    }
                    if (assignment.getBatchId() != null) {
                        return accessControlService.canAccessBatch(principal, assignment.getBatchId().longValue());
                    }
                    return accessControlService.isGlobalSuperAdmin(principal);
                }).collect(Collectors.toList());
        Map<String, Object> body = response("OK", "OK");
        body.put("data", result);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/deactivateByBatchSemester")
    @ApiOperation(value = "Deactivate all assignments for a batch's semester (used during promotion)")
    public ResponseEntity<Map<String, Object>> deactivateByBatchSemester(
            @RequestParam Integer batchId, @RequestParam Integer semesterNumber) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireTeachingAssignmentAdminRole(principal);
        accessControlService.requireAccessBatch(principal, batchId.longValue());
        try {
            assignmentService.deactivateAssignmentsForBatchSemester(batchId, semesterNumber);
            return ResponseEntity.ok(response("OK", "Assignments deactivated for batch semester"));
        } catch (Exception e) {
            log.error("Failed to deactivate batch {} semester {}", batchId, semesterNumber, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(response("ERROR", "Failed to deactivate assignments. Please try again or contact support."));
        }
    }
}
