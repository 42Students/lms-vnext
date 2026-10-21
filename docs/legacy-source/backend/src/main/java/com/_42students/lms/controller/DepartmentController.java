package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.DepartmentDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Department;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.DepartmentService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
@RequestMapping("/api/v1/department")
@Slf4j
@Validated
public class DepartmentController extends BaseController {
    @Autowired
    DepartmentService departmentService;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired
    ScopeResolutionService scopeResolutionService;

    // The whole academic structure (departments, programs, batches, classes, semesters, lecture
    // halls) wrote no admin audit trail at all, so "who deleted this department" was
    // unanswerable. required=false keeps this optional for the controller slice tests, which
    // construct the controller without a full context.
    @Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    @Autowired(required = false)
    javax.servlet.http.HttpServletRequest httpRequest;

    private void audit(String actionKey, Integer departmentId, Integer collegeId,
                       java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        auditLogService.log(httpRequest, actionKey, "department", String.valueOf(departmentId),
                null, collegeId, payload != null ? payload : java.util.Map.of());
    }

    @Transactional
    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a department for a college", notes = "")
    public ResponseEntity createDepartment(@RequestBody @Valid DepartmentDTO departmentDTO)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = departmentDTO.getCollegeId();
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create departments in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer collegeOrgId = scopeResolutionService != null ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId) : null;
                if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create departments within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        Department department = departmentService.createDepartment(departmentDTO);
        audit("DEPARTMENT_CREATE", department != null ? department.getId() : null, collegeId,
                java.util.Map.of("name", String.valueOf(departmentDTO.getName())));
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),department), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetch", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all department for a college", notes = "")
    public ResponseEntity fetchAllDepartments(@RequestParam int collegeId)
            throws Exception {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        List<Department> departments = departmentService.fetchAllDepartments(collegeId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),departments), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchAll", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all departments", notes = "Returns departments for principal's college only; super-admin gets all.")
    public ResponseEntity fetchAll() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        List<Department> departments;
        if (accessControlService.isSuperAdmin(principal)) {
            Integer scopedCollegeId = principal.getCollegeId();
            Integer scopedOrgId = principal.getOrganizationId();
            if (scopedCollegeId != null) {
                departments = departmentService.fetchAllDepartments(scopedCollegeId);
            } else if (scopedOrgId != null) {
                departments = departmentService.fetchAllDepartmentsByOrganizationId(scopedOrgId);
            } else {
                departments = departmentService.findAll();
            }
        } else {
            Integer collegeId = principal.getCollegeId();
            if (collegeId == null && principal.isLearner() && scopeResolutionService != null) {
                collegeId = scopeResolutionService.resolveFullScope(principal.getId()).getCollegeId();
            }
            if (collegeId != null) {
                departments = departmentService.fetchAllDepartments(collegeId);
            } else {
                departments = List.of();
            }
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), departments), HttpStatus.OK);
    }

    @Transactional
    @PutMapping("/update/{id}")
    @ApiOperation(value = "Update a department", notes = "")
    public ResponseEntity<Map<String, Object>> updateDepartment(
            @PathVariable Integer id,
            @RequestBody @Valid DepartmentDTO departmentDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService.resolveDepartmentToCollegeId(id);
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "ERROR");
                response.put("message", "Scoped superadmin can only update departments in the selected college");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer collegeOrgId = scopeResolutionService != null ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId) : null;
                if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("status", "ERROR");
                    response.put("message", "Scoped superadmin can only update departments within the selected organization");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        Map<String, Object> response = new HashMap<>();
        // Security: prevent moving a department to a different college via update.
        // collegeId above is the department's CURRENT college (resolved from the DB) and is what
        // was just authorized against; departmentDTO.getCollegeId() is client-supplied. Without
        // this check an admin authorized for their own college could send a different college_id
        // in the body and hijack the department into a college they have no authorization over.
        if (departmentDTO.getCollegeId() != null && collegeId != null && !collegeId.equals(departmentDTO.getCollegeId())) {
            response.put("status", "ERROR");
            response.put("message", "Changing a department's college is not supported via update");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        try {
            Department department = departmentService.updateDepartment(id, departmentDTO);
            audit("DEPARTMENT_UPDATE", id, collegeId,
                    java.util.Map.of("name", String.valueOf(departmentDTO.getName())));
            response.put("status", "OK");
            response.put("message", "Department updated successfully");
            response.put("data", department);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to update department {}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to update department. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @Transactional
    @DeleteMapping("/delete/{id}")
    @ApiOperation(value = "Delete a department", notes = "")
    public ResponseEntity<Map<String, Object>> deleteDepartment(@PathVariable Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService.resolveDepartmentToCollegeId(id);
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "ERROR");
                response.put("message", "Scoped superadmin can only delete departments in the selected college");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer collegeOrgId = scopeResolutionService != null ? scopeResolutionService.resolveCollegeToOrganizationId(collegeId) : null;
                if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("status", "ERROR");
                    response.put("message", "Scoped superadmin can only delete departments within the selected organization");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        Map<String, Object> response = new HashMap<>();
        try {
            departmentService.deleteDepartment(id);
            audit("DEPARTMENT_DELETE", id, collegeId, java.util.Map.of());
            response.put("status", "OK");
            response.put("message", "Department deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        } catch (Exception e) {
            log.error("Failed to delete department {}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to delete department. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // A2 in the super-admin audit: the whole academic structure had no pagination -- every list
    // endpoint returned every row for a college in one response. Additive: the unpaged endpoint
    // above is unchanged, so no existing caller is affected.
    @RequestMapping(value = "/fetchPaged", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch departments for a college, paginated", notes = "Paginated variant; returns a PageResponseDTO.")
    public ResponseEntity fetchDepartmentsPaged(@RequestParam Integer collegeId,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        org.springframework.data.domain.Page<com._42students.lms.model.Department> result = departmentService.fetchAllDepartmentsPaged(collegeId, pageable);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                com._42students.lms.dto.response.PageResponseDTO.<com._42students.lms.model.Department>builder()
                        .content(result.getContent())
                        .totalElements(result.getTotalElements())
                        .totalPages(result.getTotalPages())
                        .size(result.getSize())
                        .number(result.getNumber())
                        .first(result.isFirst())
                        .last(result.isLast())
                        .build()), HttpStatus.OK);
    }
}


