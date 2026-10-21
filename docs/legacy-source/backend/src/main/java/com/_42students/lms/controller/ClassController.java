package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.ClassDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model._Class;
import com._42students.lms.model.Batch;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.ClassScheduleRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/v1/class") 
@Slf4j
@Validated
public class ClassController extends BaseController {

    @Autowired
    ClassService classService;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    BatchRepository batchRepository;

    @Autowired(required = false)
    LearnerRepository learnerRepository;

    @Autowired(required = false)
    ClassScheduleRepository classScheduleRepository;

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
        auditLogService.log(httpRequest, actionKey, "class", String.valueOf(entityId),
                null, collegeId, payload != null ? payload : java.util.Map.of());
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED) // BE-0070/0076: the name check after the parent lock sees a same-name row committed meanwhile
    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a class", notes = "")
    public ResponseEntity registerClass(@RequestBody @Valid ClassDTO classDTO)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer programId = classDTO.getProgramId();
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveProgramToCollegeId(programId) : null;
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create classes in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create classes within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessProgram(principal, programId);
        if (classDTO.getBatchId() != null && batchRepository != null) {
            Batch batch = batchRepository.findById(classDTO.getBatchId().longValue()).orElse(null);
            if (batch == null) {
                return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "Batch not found", null), HttpStatus.BAD_REQUEST);
            }
            if (batch.getProgramId() == null || !batch.getProgramId().equals(Long.valueOf(programId))) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Batch must belong to the selected program", null), HttpStatus.FORBIDDEN);
            }
        }
        _Class aClass = classService.register(classDTO);
        audit("CLASS_CREATE", aClass != null ? aClass.getId() : null, collegeId,
                java.util.Map.of("programId", String.valueOf(programId)));
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),aClass), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClass", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get class detail or classes for principal's college", notes = "Without classId: returns classes for principal's college (or all for super-admin).")
    public ResponseEntity getClass(String classId)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (classId == null || classId.trim().isEmpty()) {
            List<_Class> classes;
            if (accessControlService.isSuperAdmin(principal)) {
                Integer scopedCollegeId = principal != null ? principal.getCollegeId() : null;
                Integer scopedOrgId = principal != null ? principal.getOrganizationId() : null;
                if (scopedCollegeId != null) {
                    classes = classService.getClassesByCollegeId(scopedCollegeId);
                } else if (scopedOrgId != null) {
                    classes = classService.getClassesByOrganizationId(scopedOrgId);
                } else {
                    classes = classService.findAll();
                }
            } else {
                Integer collegeId = principal != null ? principal.getCollegeId() : null;
                if (collegeId == null && principal != null && principal.isLearner() && scopeResolutionService != null) {
                    collegeId = scopeResolutionService.resolveFullScope(principal.getId()).getCollegeId();
                }
                if (collegeId != null) {
                    classes = classService.getClassesByCollegeId(collegeId);
                } else {
                    classes = Collections.emptyList();
                }
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), classes), HttpStatus.OK);
        }
        Integer classIdInt = Integer.valueOf(classId.trim());
        accessControlService.requireAccessClass(principal, classIdInt);
        _Class aClass = classService.getClassDetail(classId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), aClass), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassesByProgram", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get classes by program ID", notes = "Returns classes with numeric keys for a given program ID")
    public ResponseEntity getClassesByProgram(@RequestParam("programId") int programId) {
        accessControlService.requireAccessProgram(securityContextUtil.getAuthenticatedUserPrincipal(), programId);
        Map<Integer, String> classes = classService.getClassesByProgram(programId);

        // A program with no sections yet is a normal answer, not an error: the Programs page asks
        // for every program's section count, and each 404 was logged as a frontend error.
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), classes), HttpStatus.OK);
    }

    @RequestMapping(value = "/getClassesByCollege", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get classes by college ID", notes = "Returns all classes for programs in the given college. Used for college-scoped admin.")
    public ResponseEntity getClassesByCollege(@RequestParam("collegeId") int collegeId,
                                              @RequestParam(value = "search", required = false) String search) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        java.util.List<_Class> classes = classService.getClassesByCollegeId(collegeId);
        if (search != null && !search.trim().isEmpty()) {
            String normalized = search.trim().toLowerCase();
            classes = classes.stream().filter(item -> {
                String name = item.getName() != null ? item.getName().toLowerCase() : "";
                String description = item.getDescription() != null ? item.getDescription().toLowerCase() : "";
                String id = String.valueOf(item.getId());
                String programId = String.valueOf(item.getProgramId());
                String batchId = item.getBatchId() != null ? String.valueOf(item.getBatchId()) : "";
                return name.contains(normalized)
                        || description.contains(normalized)
                        || id.contains(normalized)
                        || programId.contains(normalized)
                        || batchId.contains(normalized);
            }).toList();
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), classes), HttpStatus.OK);
    }

    @Transactional
    @RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Update a class", notes = "")
    public ResponseEntity updateClass(@PathVariable Integer id, @RequestBody @Valid ClassDTO classDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveClassToCollegeId(id) : null;
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update classes in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update classes within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessClass(principal, id);
        try {
            if (scopeResolutionService != null && classDTO.getProgramId() > 0 && collegeId != null) {
                Integer targetCollegeId = scopeResolutionService.resolveProgramToCollegeId(classDTO.getProgramId());
                if (targetCollegeId == null || !collegeId.equals(targetCollegeId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Program must belong to the same college as the class", null), HttpStatus.FORBIDDEN);
                }
            }
            if (classDTO.getBatchId() != null && batchRepository != null) {
                Batch batch = batchRepository.findById(classDTO.getBatchId().longValue()).orElse(null);
                if (batch == null) {
                    return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), "Batch not found", null), HttpStatus.BAD_REQUEST);
                }
                if (batch.getProgramId() == null || !batch.getProgramId().equals(Long.valueOf(classDTO.getProgramId()))) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Batch must belong to the selected program", null), HttpStatus.FORBIDDEN);
                }
            }
            _Class updatedClass = classService.updateClass(id, classDTO);
            audit("CLASS_UPDATE", id, collegeId, java.util.Map.of());
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), updatedClass), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @Transactional
    @RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete a class", notes = "")
    public ResponseEntity deleteClass(@PathVariable Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveClassToCollegeId(id) : null;
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete classes in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete classes within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessClass(principal, id);
        try {
            if (learnerRepository != null) {
                if (learnerRepository.getStudentDetailsByClassId(id).size() > 0) {
                    return new ResponseEntity(new Response(HttpStatus.CONFLICT.name(), "This section has students. Move them to another section first.", null), HttpStatus.CONFLICT);
                }
            }
            if (classScheduleRepository != null) {
                if (classScheduleRepository.getClassScheduleCountByClassId(id) > 0) {
                    return new ResponseEntity(new Response(HttpStatus.CONFLICT.name(), "This section has scheduled class sessions. Remove them first.", null), HttpStatus.CONFLICT);
                }
            }
            classService.deleteClass(id);
            audit("CLASS_DELETE", id, collegeId, java.util.Map.of());
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Class deleted successfully", null), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    // A2: additive paged variant of getClassesByCollege. Classes are the largest of the
    // academic-structure tables (one per batch x section), so this is the one most worth paging.
    @RequestMapping(value = "/getClassesByCollegePaged", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch classes for a college, paginated", notes = "Paginated variant; returns a PageResponseDTO.")
    public ResponseEntity getClassesByCollegePaged(@RequestParam Integer collegeId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        org.springframework.data.domain.Page<com._42students.lms.model._Class> result =
                classService.getClassesByCollegeIdPaged(collegeId, pageable);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                com._42students.lms.dto.response.PageResponseDTO.<com._42students.lms.model._Class>builder()
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

