package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.SemesterDTO;
import com._42students.lms.dto.request.SemesterCourseDTO;
import com._42students.lms.dto.response.SemesterResponseDTO;
import com._42students.lms.model.SemesterCourse;
import com._42students.lms.model.Semester;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository.SemesterRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.SemesterCourseService;
import com._42students.lms.service.SemesterService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/semester")
@Api(tags = "Semester Management")
public class SemesterController {

    private final SemesterService semesterService;
    private final SemesterCourseService semesterCourseService;
    private final SecurityContextUtil securityContextUtil;
    private final AccessControlService accessControlService;
    private final ScopeResolutionService scopeResolutionService;
    private final SemesterRepository semesterRepository;
    private final SemesterCourseRepository semesterCourseRepository;

    // The academic structure wrote no admin audit trail at all, so "who changed this" was
    // unanswerable for every entity below. required=false keeps these optional for controller
    // slice tests that build the controller without a full context.
    @Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    // Field-injected (optional) so the existing constructor — and every test that calls it —
    // keeps working unchanged. Only the staffing-gap report below uses these.
    @Autowired(required = false)
    com._42students.lms.repository._ClassRepository classRepository;

    @Autowired(required = false)
    com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired(required = false)
    javax.servlet.http.HttpServletRequest httpRequest;

    private void audit(String actionKey, Object entityId, Integer collegeId,
                       java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        auditLogService.log(httpRequest, actionKey, "semester", String.valueOf(entityId),
                null, collegeId, payload != null ? payload : java.util.Map.of());
    }

    @Autowired
    public SemesterController(SemesterService semesterService,
                              SemesterCourseService semesterCourseService,
                              SecurityContextUtil securityContextUtil,
                              AccessControlService accessControlService,
                              ScopeResolutionService scopeResolutionService,
                              SemesterRepository semesterRepository,
                              SemesterCourseRepository semesterCourseRepository) {
        this.semesterService = semesterService;
        this.semesterCourseService = semesterCourseService;
        this.securityContextUtil = securityContextUtil;
        this.accessControlService = accessControlService;
        this.scopeResolutionService = scopeResolutionService;
        this.semesterRepository = semesterRepository;
        this.semesterCourseRepository = semesterCourseRepository;
    }

    private ResponseEntity<Map<String, Object>> forbidden(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ERROR");
        response.put("message", message);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    private Integer resolveSemesterCollegeId(Semester semester) {
        if (semester == null) return null;
        Integer programId = semester.getProgramId();
        return scopeResolutionService != null ? scopeResolutionService.resolveProgramToCollegeId(programId) : null;
    }

    private void requireSemesterAccess(UserPrincipal principal, Semester semester) {
        if (principal == null) throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        if (semester == null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Semester not found");
        accessControlService.requireAccessProgram(principal, semester.getProgramId());
    }

    @PostMapping("/create")
    @ApiOperation(value = "Create a new semester for a program")
    public ResponseEntity<Map<String, Object>> createSemester(@Valid @RequestBody SemesterDTO dto) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        try {
            if (principal == null) return forbidden("Authentication required");
            // Enforce program access and scoped superadmin safety
            accessControlService.requireAccessProgram(principal, dto.getProgramId());
            Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveProgramToCollegeId(dto.getProgramId()) : null;
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            if (accessControlService.isSuperAdmin(principal)) {
                if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                    return forbidden("Scoped superadmin can only create semesters in the selected college");
                }
                if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                    Integer collegeOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                    if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                        return forbidden("Scoped superadmin can only create semesters within the selected organization");
                    }
                }
            }
            SemesterResponseDTO result = semesterService.createSemester(dto);
            audit("SEMESTER_CREATE", result != null ? result.getId() : null, collegeId,
                    java.util.Map.of("programId", String.valueOf(dto.getProgramId())));
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "Semester created successfully");
            response.put("data", result);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (DataIntegrityViolationException e) {
            // Catch this before the generic Exception handler below: its message can include the
            // raw DB constraint name (e.g. "Duplicate entry ... for key 'uk_semester_program_number'"),
            // which we must not leak to the client.
            log.error("Failed to create semester: constraint violation", e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "A semester with this number already exists for this program");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            if (e instanceof IllegalArgumentException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "ERROR", "message", "Invalid semester request"));
            }
            log.error("Failed to create semester", e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to create semester. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/update/{id}")
    @ApiOperation(value = "Update an existing semester")
    public ResponseEntity<Map<String, Object>> updateSemester(@PathVariable Integer id, @Valid @RequestBody SemesterDTO dto) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        try {
            Semester semester = semesterRepository.findById(id).orElse(null);
            if (principal == null) return forbidden("Authentication required");
            requireSemesterAccess(principal, semester);
            Integer collegeId = resolveSemesterCollegeId(semester);
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            if (dto.getProgramId() != null && !dto.getProgramId().equals(semester.getProgramId())) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Program cannot be changed after a semester is created");
            }
            if (dto.getSemesterNumber() != null && !dto.getSemesterNumber().equals(semester.getSemesterNumber())) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Semester number cannot be changed after a semester is created");
            }
            if (accessControlService.isSuperAdmin(principal)) {
                if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                    return forbidden("Scoped superadmin can only update semesters in the selected college");
                }
                if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                    Integer collegeOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                    if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                        return forbidden("Scoped superadmin can only update semesters within the selected organization");
                    }
                }
            }
            SemesterResponseDTO result = semesterService.updateSemester(id, dto);
            audit("SEMESTER_UPDATE", id, collegeId, java.util.Map.of());
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "Semester updated successfully");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            if (e instanceof IllegalArgumentException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "ERROR", "message", "Invalid semester request"));
            }
            log.error("Failed to update semester", e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to update semester. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/delete/{id}")
    @ApiOperation(value = "Delete a semester")
    public ResponseEntity<Map<String, Object>> deleteSemester(@PathVariable Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        try {
            Semester semester = semesterRepository.findById(id).orElse(null);
            if (principal == null) return forbidden("Authentication required");
            requireSemesterAccess(principal, semester);
            Integer collegeId = resolveSemesterCollegeId(semester);
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            if (accessControlService.isSuperAdmin(principal)) {
                if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                    return forbidden("Scoped superadmin can only delete semesters in the selected college");
                }
                if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                    Integer collegeOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                    if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                        return forbidden("Scoped superadmin can only delete semesters within the selected organization");
                    }
                }
            }
            semesterService.deleteSemester(id);
            audit("SEMESTER_DELETE", id, collegeId, java.util.Map.of());
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "Semester deleted successfully");
            return ResponseEntity.ok(response);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", e.getReason());
            return ResponseEntity.status(e.getStatus()).body(response);
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            if (e instanceof IllegalArgumentException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "ERROR", "message", "Invalid semester request"));
            }
            log.error("Failed to delete semester", e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to delete semester. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/fetch/{id}")
    @ApiOperation(value = "Get semester by ID")
    public ResponseEntity<Map<String, Object>> getSemesterById(@PathVariable Integer id) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Semester semester = semesterRepository.findById(id).orElse(null);
            if (principal == null) return forbidden("Authentication required");
            requireSemesterAccess(principal, semester);
            SemesterResponseDTO result = semesterService.getSemesterById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "OK");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            if (e instanceof IllegalArgumentException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "ERROR", "message", "Invalid semester request"));
            }
            log.error("Failed to fetch semester", e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to fetch semester. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/fetchByProgram")
    @ApiOperation(value = "Get all semesters for a program")
    public ResponseEntity<Map<String, Object>> getSemestersByProgram(@RequestParam Integer programId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return forbidden("Authentication required");
        accessControlService.requireAccessProgram(principal, programId);
        List<SemesterResponseDTO> result = semesterService.getSemestersByProgram(programId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "OK");
        response.put("data", result);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/fetchAll")
    @ApiOperation(value = "Get all semesters")
    public ResponseEntity<Map<String, Object>> getAllSemesters() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return forbidden("Authentication required");
        List<SemesterResponseDTO> result;
        if (accessControlService.isSuperAdmin(principal)) {
            result = semesterService.getAllSemestersScoped(principal.getOrganizationId(), principal.getCollegeId());
        } else {
            Integer collegeId = principal.getCollegeId();
            if (collegeId == null) {
                // Non-superadmin must be scoped; without a college, return empty to avoid leaks.
                result = List.of();
            } else {
                result = semesterService.getAllSemestersScoped(null, collegeId);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "OK");
        response.put("data", result);
        return ResponseEntity.ok(response);
    }

    // ============ Semester-Course Mapping Endpoints ============

    @PostMapping("/{semesterId}/courses")
    @ApiOperation(value = "Add a course to a semester")
    public ResponseEntity<Map<String, Object>> addCourseToSemester(
            @PathVariable Integer semesterId,
            @Valid @RequestBody SemesterCourseDTO dto) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Semester semester = semesterRepository.findById(semesterId).orElse(null);
            if (principal == null) return forbidden("Authentication required");
            requireSemesterAccess(principal, semester);
            if (dto.getCourseId() == null || dto.getCourseId() <= 0) {
                throw new IllegalArgumentException("courseId is required");
            }
            Integer semesterCollegeId = resolveSemesterCollegeId(semester);
            Integer courseCollegeId = scopeResolutionService != null ? scopeResolutionService.resolveCourseToCollegeId(dto.getCourseId()) : null;
            if (semesterCollegeId != null) {
                if (courseCollegeId == null) {
                    return forbidden("Course must belong to the same college as the semester");
                }
                if (!semesterCollegeId.equals(courseCollegeId)) {
                    return forbidden("Course must belong to the same college as the semester");
                }
            }
            dto.setSemesterId(semesterId);
            SemesterCourse result = semesterCourseService.addCourseToSemester(dto);
            audit("SEMESTER_COURSE_ADD", semesterId, semesterCollegeId,
                    java.util.Map.of("courseId", String.valueOf(dto.getCourseId())));
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "Course added to semester");
            response.put("data", result);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            if (e instanceof IllegalArgumentException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "ERROR", "message", "Invalid semester request"));
            }
            log.error("Failed to add course to semester", e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to add course to semester. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/{semesterId}/courses/bulk")
    @ApiOperation(value = "Add multiple courses to a semester")
    public ResponseEntity<Map<String, Object>> addCoursesToSemester(
            @PathVariable Integer semesterId,
            @Valid @RequestBody SemesterCourseDTO dto) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Semester semester = semesterRepository.findById(semesterId).orElse(null);
            if (principal == null) return forbidden("Authentication required");
            requireSemesterAccess(principal, semester);
            if (dto.getCourseIds() == null || dto.getCourseIds().isEmpty()) {
                throw new IllegalArgumentException("courseIds is required");
            }
            Integer semesterCollegeId = resolveSemesterCollegeId(semester);
            if (semesterCollegeId != null) {
                for (Integer courseId : dto.getCourseIds()) {
                    Integer courseCollegeId = scopeResolutionService != null ? scopeResolutionService.resolveCourseToCollegeId(courseId) : null;
                    if (courseCollegeId == null || !semesterCollegeId.equals(courseCollegeId)) {
                        return forbidden("All courses must belong to the same college as the semester");
                    }
                }
            }
            List<SemesterCourse> result = semesterCourseService.addCoursesToSemester(semesterId, dto.getCourseIds());
            audit("SEMESTER_COURSE_BULK_ADD", semesterId, semesterCollegeId,
                    java.util.Map.of("courseIds", String.valueOf(dto.getCourseIds())));
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", result.size() + " courses added to semester");
            response.put("data", result);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            if (e instanceof IllegalArgumentException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "ERROR", "message", "Invalid semester request"));
            }
            log.error("Failed to add courses to semester", e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to add courses to semester. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/{semesterId}/courses/{courseId}")
    @ApiOperation(value = "Remove a course from a semester")
    public ResponseEntity<Map<String, Object>> removeCourseFromSemester(
            @PathVariable Integer semesterId,
            @PathVariable Integer courseId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            Semester semester = semesterRepository.findById(semesterId).orElse(null);
            if (principal == null) return forbidden("Authentication required");
            requireSemesterAccess(principal, semester);
            semesterCourseService.removeCourseFromSemester(semesterId, courseId);
            audit("SEMESTER_COURSE_REMOVE", semesterId, null,
                    java.util.Map.of("courseId", String.valueOf(courseId)));
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "Course removed from semester");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            if (e instanceof IllegalArgumentException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "ERROR", "message", "Invalid semester request"));
            }
            log.error("Failed to remove course from semester", e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to remove course from semester. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/{semesterId}/courses")
    @ApiOperation(value = "Get all courses in a semester")
    public ResponseEntity<Map<String, Object>> getCoursesInSemester(@PathVariable Integer semesterId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Semester semester = semesterRepository.findById(semesterId).orElse(null);
        if (principal == null) return forbidden("Authentication required");
        requireSemesterAccess(principal, semester);
        List<SemesterCourse> result = semesterCourseService.getCoursesBySemester(semesterId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "OK");
        response.put("data", result);
        return ResponseEntity.ok(response);
    }

    /**
     * Staffing gaps for a semester's curriculum: which mapped courses have no active faculty
     * teaching assignment for which classes of the semester's program.
     *
     * <p>Mapping a course to a semester (curriculum) and assigning a faculty member to teach it to
     * a class (staffing) are two independent admin steps, and nothing previously reconciled them —
     * a course could sit on a program's curriculum with nobody assigned to teach it and there was
     * no screen anywhere that said so. Learners felt it (the course appears on their Courses page
     * with no faculty name); the admin who half-configured it had no way to notice.
     */
    @GetMapping("/{semesterId}/staffing")
    @ApiOperation(value = "Report courses in this semester that have no faculty assigned, per class")
    public ResponseEntity<Map<String, Object>> getSemesterStaffing(@PathVariable Integer semesterId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return forbidden("Authentication required");
        Semester semester = semesterRepository.findById(semesterId).orElse(null);
        requireSemesterAccess(principal, semester);

        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        List<SemesterCourse> mapped = semesterCourseService.getCoursesBySemester(semesterId);
        List<com._42students.lms.model._Class> programClasses =
                (classRepository != null && semester != null && semester.getProgramId() != null)
                        ? classRepository.getClassesByProgram(semester.getProgramId())
                        : java.util.Collections.emptyList();

        for (SemesterCourse sc : mapped) {
            // One query per course rather than per (course, class) pair.
            java.util.Set<Integer> staffedClassIds = new java.util.HashSet<>();
            if (facultyTeachingAssignmentRepository != null) {
                facultyTeachingAssignmentRepository.findByCourseIdAndIsActive(sc.getCourseId(), true)
                        .forEach(a -> {
                            if (a.getClassId() != null) staffedClassIds.add(a.getClassId());
                        });
            }
            List<String> unstaffed = programClasses.stream()
                    .filter(c -> !staffedClassIds.contains(c.getId()))
                    .map(c -> c.getName() != null ? c.getName() : ("Class " + c.getId()))
                    .collect(java.util.stream.Collectors.toList());

            Map<String, Object> row = new HashMap<>();
            row.put("courseId", sc.getCourseId());
            row.put("totalClasses", programClasses.size());
            row.put("unstaffedClassCount", unstaffed.size());
            row.put("unstaffedClasses", unstaffed);
            // True only when the course has no assignment for ANY class in the program — the
            // "nobody teaches this at all" case, which is the one that reads as broken to learners.
            row.put("fullyUnstaffed", !programClasses.isEmpty() && unstaffed.size() == programClasses.size());
            rows.add(row);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "OK");
        response.put("data", rows);
        return ResponseEntity.ok(response);
    }

    /**
     * Reorders a semester's courses in one request.
     *
     * <p>courseOrder was editable only one row at a time through a modal, so putting an
     * eight-course semester in the right sequence meant opening eight modals and typing eight
     * numbers — and getting them wrong mid-way left two courses sharing an order. Taking the whole
     * sequence at once means the ordering is always internally consistent, and lets the console
     * offer drag-and-drop.
     *
     * <p>Order is assigned from the position in the submitted list rather than trusted from the
     * client, so a caller cannot produce duplicate or sparse orders.
     */
    @PutMapping("/{semesterId}/courses/reorder")
    @ApiOperation(value = "Reorder a semester's courses")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Map<String, Object>> reorderSemesterCourses(
            @PathVariable Integer semesterId,
            @RequestBody Map<String, List<Integer>> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) return forbidden("Authentication required");
            Semester semester = semesterRepository.findById(semesterId).orElse(null);
            requireSemesterAccess(principal, semester);

            List<Integer> orderedIds = body != null ? body.get("mappingIds") : null;
            if (orderedIds == null || orderedIds.isEmpty()) {
                response.put("status", "ERROR");
                response.put("message", "mappingIds is required");
                return ResponseEntity.badRequest().body(response);
            }

            List<SemesterCourse> mappings = semesterCourseRepository.findAllById(orderedIds);
            // Every id must belong to THIS semester. Without the check a caller could pass another
            // semester's mapping id and have its order rewritten from outside its own scope.
            for (SemesterCourse m : mappings) {
                if (!semesterId.equals(m.getSemesterId())) {
                    return forbidden("All mappings must belong to this semester");
                }
            }
            if (mappings.size() != orderedIds.size()) {
                response.put("status", "ERROR");
                response.put("message", "One or more mappings were not found");
                return ResponseEntity.badRequest().body(response);
            }

            Map<Integer, SemesterCourse> byId = new HashMap<>();
            for (SemesterCourse m : mappings) byId.put(m.getId(), m);
            for (int i = 0; i < orderedIds.size(); i++) {
                SemesterCourse m = byId.get(orderedIds.get(i));
                if (m != null) {
                    m.setCourseOrder(i + 1);
                }
            }
            semesterCourseRepository.saveAll(mappings);
            audit("SEMESTER_COURSE_REORDER", semesterId, null, java.util.Map.of("count", String.valueOf(orderedIds.size())));

            response.put("status", "OK");
            response.put("message", "Course order updated");
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            log.error("Error reordering semester courses for semester {}:", semesterId, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to reorder courses");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/courses/{id}")
    @ApiOperation(value = "Update a semester-course mapping (credits, mandatory status, order)")
    public ResponseEntity<Map<String, Object>> updateSemesterCourse(
            @PathVariable Integer id,
            @Valid @RequestBody SemesterCourseDTO dto) {
        Map<String, Object> response = new HashMap<>();
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal == null) return forbidden("Authentication required");
            SemesterCourse existing = semesterCourseRepository.findById(id).orElse(null);
            if (existing == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "ERROR", "message", "Mapping not found"));
            Semester semester = semesterRepository.findById(existing.getSemesterId()).orElse(null);
            requireSemesterAccess(principal, semester);
            SemesterCourse result = semesterCourseService.updateSemesterCourse(id, dto);
            audit("SEMESTER_COURSE_UPDATE", id, null, java.util.Map.of());
            response.put("status", "OK");
            response.put("message", "Course mapping updated successfully");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            if (e instanceof org.springframework.security.access.AccessDeniedException) {
                throw (org.springframework.security.access.AccessDeniedException) e;
            }
            if (e instanceof org.springframework.web.server.ResponseStatusException) {
                throw (org.springframework.web.server.ResponseStatusException) e;
            }
            if (e instanceof IllegalArgumentException) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "ERROR", "message", "Invalid semester request"));
            }
            log.error("Failed to update semester course mapping", e);
            response.put("status", "ERROR");
            response.put("message", "Failed to update semester course mapping. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // A2: additive paged variant of fetchAll. Scope is derived from the principal exactly as
    // fetchAll does; the org-scoped path stays unpaged (rare, and low volume).
    @GetMapping("/fetchAllPaged")
    @ApiOperation(value = "Get semesters for the caller's college, paginated")
    public ResponseEntity<Map<String, Object>> getAllSemestersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return forbidden("Authentication required");
        Integer collegeId = principal.getCollegeId();
        Map<String, Object> response = new HashMap<>();
        if (collegeId == null) {
            // Same rule as fetchAll: an unscoped caller gets nothing rather than a cross-tenant list.
            response.put("status", "OK");
            response.put("message", "OK");
            response.put("data", List.of());
            return ResponseEntity.ok(response);
        }
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        org.springframework.data.domain.Page<SemesterResponseDTO> result =
                semesterService.getSemestersByCollegePaged(collegeId, pageable);
        response.put("status", "OK");
        response.put("message", "OK");
        response.put("data", com._42students.lms.dto.response.PageResponseDTO.<SemesterResponseDTO>builder()
                .content(result.getContent())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .size(result.getSize())
                .number(result.getNumber())
                .first(result.isFirst())
                .last(result.isLast())
                .build());
        return ResponseEntity.ok(response);
    }
}

