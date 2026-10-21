package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.NewProgramDTO;
import com._42students.lms.dto.response.NewProgramDetailsDTO;
import com._42students.lms.dto.response.NewProgramResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.NewProgram;
import com._42students.lms.service.NewProgramService;
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
import java.util.List;

@RestController
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
@RequestMapping("/api/v1/new-program")
@Slf4j
@Validated
public class NewProgramController extends BaseController {

    @Autowired
    private NewProgramService newProgramService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private ScopeResolutionService scopeResolutionService;

    // The academic structure wrote no admin audit trail at all, so "who changed this" was
    // unanswerable for every entity below. required=false keeps these optional for controller
    // slice tests that build the controller without a full context.
    @Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    @Autowired(required = false)
    javax.servlet.http.HttpServletRequest httpRequest;

    private void audit(String actionKey, Object entityId, Integer collegeId,
                       java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        auditLogService.log(httpRequest, actionKey, "program", String.valueOf(entityId),
                null, collegeId, payload != null ? payload : java.util.Map.of());
    }

    @Transactional
    @PostMapping("/create")
    @ApiOperation(value = "Create a new program", notes = "")
    public ResponseEntity createProgram(@Valid @RequestBody NewProgramDTO programDTO) {
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer deptId = programDTO.getDeptId();
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveDepartmentToCollegeId(deptId) : null;
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create programs in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer collegeOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create programs within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessDepartment(principal, deptId);
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        NewProgram program = newProgramService.createProgram(programDTO);
        audit("PROGRAM_CREATE", program != null ? program.getId() : null, collegeId,
                java.util.Map.of("deptId", String.valueOf(deptId)));
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), program), HttpStatus.OK);
    }

    @GetMapping("/fetchAll")
    @ApiOperation(value = "Fetch all programs", notes = "")
    public ResponseEntity fetchAllPrograms() {
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        List<NewProgramResponseDTO> programs;
        if (accessControlService.isSuperAdmin(principal)) {
            Integer scopedCollegeId = principal.getCollegeId();
            Integer scopedOrgId = principal.getOrganizationId();
            if (scopedCollegeId != null) {
                programs = newProgramService.findByCollegeId(scopedCollegeId);
            } else if (scopedOrgId != null) {
                programs = newProgramService.findByOrganizationId(scopedOrgId);
            } else {
                programs = newProgramService.findAll();
            }
        } else {
            Integer collegeId = principal.getCollegeId();
            if (collegeId == null && principal.isLearner() && scopeResolutionService != null) {
                collegeId = scopeResolutionService.resolveFullScope(principal.getId()).getCollegeId();
            }
            if (collegeId != null) {
                programs = newProgramService.findByCollegeId(collegeId);
            } else {
                programs = java.util.List.of();
            }
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), programs), HttpStatus.OK);
    }

    @GetMapping("/fetchByDept")
    @ApiOperation(value = "Fetch programs by department", notes = "")
    public ResponseEntity fetchByDepartment(@RequestParam int deptId) {
        accessControlService.requireAccessDepartment(securityContextUtil.getAuthenticatedUserPrincipal(), deptId);
        List<NewProgramResponseDTO> programs = newProgramService.findByDeptId(deptId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), programs), HttpStatus.OK);
    }

    @GetMapping("/fetchByCollege")
    @ApiOperation(value = "Fetch programs by college ID", notes = "Returns all programs for departments in the given college. Used for college-scoped admin.")
    public ResponseEntity fetchByCollege(@RequestParam int collegeId) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        List<NewProgramResponseDTO> programs = newProgramService.findByCollegeId(collegeId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), programs), HttpStatus.OK);
    }

    @GetMapping("/fetch/{id}")
    @ApiOperation(value = "Fetch program by ID", notes = "")
    public ResponseEntity fetchById(@PathVariable int id) {
        accessControlService.requireAccessProgram(securityContextUtil.getAuthenticatedUserPrincipal(), id);
        NewProgramResponseDTO program = newProgramService.findById(id);
        if (program == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Program not found", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), program), HttpStatus.OK);
    }

    @Transactional
    @PutMapping("/update/{id}")
    @ApiOperation(value = "Update a program", notes = "")
    public ResponseEntity updateProgram(@PathVariable int id, @Valid @RequestBody NewProgramDTO programDTO) {
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService.resolveProgramToCollegeId(id);
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update programs in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer collegeOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update programs within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        // Prevent cross-tenant move via dept_id changes on update.
        Integer requestedDeptId = programDTO != null ? programDTO.getDeptId() : null;
        if (requestedDeptId != null && requestedDeptId > 0) {
            accessControlService.requireAccessDepartment(principal, requestedDeptId);
            Integer destCollegeId = scopeResolutionService != null ? scopeResolutionService.resolveDepartmentToCollegeId(requestedDeptId) : null;
            if (destCollegeId != null && collegeId != null && !destCollegeId.equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Cannot move program to a department in a different college", null),
                        HttpStatus.FORBIDDEN);
            }
        }
        try {
            NewProgram program = newProgramService.updateProgram(id, programDTO);
            audit("PROGRAM_UPDATE", id, collegeId, java.util.Map.of());
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), program), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity(new Response(HttpStatus.valueOf(e.getStatus().value()).name(), e.getReason(), null), e.getStatus());
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @Transactional
    @DeleteMapping("/delete/{id}")
    @ApiOperation(value = "Delete a program", notes = "")
    public ResponseEntity deleteProgram(@PathVariable int id) {
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService.resolveProgramToCollegeId(id);
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete programs in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer collegeOrgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (collegeOrgId != null && !principal.getOrganizationId().equals(collegeOrgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete programs within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            newProgramService.deleteProgram(id);
            audit("PROGRAM_DELETE", id, collegeId, java.util.Map.of());
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Program deleted successfully", null), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity(new Response(HttpStatus.valueOf(e.getStatus().value()).name(), e.getReason(), null), e.getStatus());
        }
    }

    @GetMapping("/fetchProgramDetails")
    @ApiOperation(value = "Fetch program details with structure and courses", notes = "Returns program with embedded program_structure containing courses")
    public ResponseEntity fetchProgramDetails(@RequestParam int programId) {
        accessControlService.requireAccessProgram(securityContextUtil.getAuthenticatedUserPrincipal(), programId);
        NewProgramDetailsDTO program = newProgramService.fetchProgramDetails(programId);
        if (program == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Program not found", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), program), HttpStatus.OK);
    }

    // A2 in the super-admin audit: the whole academic structure had no pagination -- every list
    // endpoint returned every row for a college in one response. Additive: the unpaged endpoint
    // above is unchanged, so no existing caller is affected.
    @RequestMapping(value = "/fetchByCollegePaged", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch programs for a college, paginated", notes = "Paginated variant; returns a PageResponseDTO.")
    public ResponseEntity fetchProgramsByCollegePaged(@RequestParam Integer collegeId,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        org.springframework.data.domain.Page<com._42students.lms.model.NewProgram> result = newProgramService.findByCollegeIdPaged(collegeId, pageable);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                com._42students.lms.dto.response.PageResponseDTO.<com._42students.lms.model.NewProgram>builder()
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


