package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.LectureHallDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.LectureHall;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LectureHallService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lectureHall")
@Slf4j
@Validated
public class LectureHallController extends BaseController {
    @Autowired
    LectureHallService lectureHallService;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    ScopeResolutionService scopeResolutionService;

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
        auditLogService.log(httpRequest, actionKey, "lecture_hall", String.valueOf(entityId),
                null, collegeId, payload != null ? payload : java.util.Map.of());
    }

    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a LectureHall for college/dept", notes = "")
    public ResponseEntity createLectureHall(@Valid @RequestBody LectureHallDTO lectureHallDTO)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = lectureHallDTO.getCollegeId();
        if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create lecture halls in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create lecture halls within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        LectureHall lectureHall = lectureHallService.createLectureHall(lectureHallDTO);
        audit("LECTURE_HALL_CREATE", lectureHall != null ? lectureHall.getId() : null, collegeId,
                java.util.Map.of());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lectureHall), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetch", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get all lecture halls", notes = "")
    public ResponseEntity fetchLectureHalls() {
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        List<LectureHall> lectureHalls;
        if (accessControlService.isSuperAdmin(principal)) {
            Integer scopedCollegeId = principal.getCollegeId();
            Integer scopedOrgId = principal.getOrganizationId();
            if (scopedCollegeId != null) {
                lectureHalls = lectureHallService.findByCollegeId(scopedCollegeId);
            } else if (scopedOrgId != null) {
                lectureHalls = lectureHallService.findByOrganizationId(scopedOrgId);
            } else {
                lectureHalls = lectureHallService.findAll();
            }
        } else {
            Integer collegeId = principal.getCollegeId();
            if (collegeId != null) lectureHalls = lectureHallService.findByCollegeId(collegeId);
            else lectureHalls = java.util.List.of();
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lectureHalls), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetch/{id}", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get lecture hall by ID", notes = "")
    public ResponseEntity fetchLectureHallById(@PathVariable Integer id) {
        return lectureHallService.findById(id)
                .map(lectureHall -> {
                    accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), lectureHall.getCollegeId());
                    return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lectureHall), HttpStatus.OK);
                })
                .orElse(new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lecture hall not found", null), HttpStatus.NOT_FOUND));
    }

    @RequestMapping(value = "/fetchByCollege", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get lecture halls by college ID", notes = "")
    public ResponseEntity fetchByCollegeId(@RequestParam int collegeId) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        List<LectureHall> lectureHalls = lectureHallService.findByCollegeId(collegeId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lectureHalls), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchByDept", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get lecture halls by department ID", notes = "")
    public ResponseEntity fetchByDeptId(@RequestParam int deptId) {
        accessControlService.requireAccessDepartment(securityContextUtil.getAuthenticatedUserPrincipal(), deptId);
        List<LectureHall> lectureHalls = lectureHallService.findByDeptId(deptId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), lectureHalls), HttpStatus.OK);
    }

    @RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Update a lecture hall", notes = "")
    public ResponseEntity updateLectureHall(@PathVariable Integer id, @Valid @RequestBody LectureHallDTO lectureHallDTO) {
        LectureHall existing = lectureHallService.findById(id)
                .orElse(null);
        if (existing == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lecture hall not found", null), HttpStatus.NOT_FOUND);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = existing.getCollegeId();
        if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update lecture halls in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update lecture halls within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            LectureHall updatedLectureHall = lectureHallService.updateLectureHall(id, lectureHallDTO);
            audit("LECTURE_HALL_UPDATE", id, collegeId, java.util.Map.of());
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), updatedLectureHall), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    @RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete a lecture hall", notes = "")
    public ResponseEntity deleteLectureHall(@PathVariable Integer id) {
        LectureHall existing = lectureHallService.findById(id)
                .orElse(null);
        if (existing == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Lecture hall not found", null), HttpStatus.NOT_FOUND);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = existing.getCollegeId();
        if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete lecture halls in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete lecture halls within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            lectureHallService.deleteLectureHall(id);
            audit("LECTURE_HALL_DELETE", id, collegeId, java.util.Map.of());
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Lecture hall deleted successfully", null), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // BE-0096: keep the service's status (409 when sessions still use the hall) and its plain reason.
            HttpStatus status = e.getStatus();
            return new ResponseEntity(new Response(status.name(), e.getReason() != null ? e.getReason() : status.getReasonPhrase(), null), status);
        } catch (RuntimeException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
        }
    }

    // A2 in the super-admin audit: the whole academic structure had no pagination -- every list
    // endpoint returned every row for a college in one response. Additive: the unpaged endpoint
    // above is unchanged, so no existing caller is affected.
    @RequestMapping(value = "/fetchByCollegePaged", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch lecture halls for a college, paginated", notes = "Paginated variant; returns a PageResponseDTO.")
    public ResponseEntity fetchLectureHallsByCollegePaged(@RequestParam Integer collegeId,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        org.springframework.data.domain.Page<com._42students.lms.model.LectureHall> result = lectureHallService.findByCollegeIdPaged(collegeId, pageable);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                com._42students.lms.dto.response.PageResponseDTO.<com._42students.lms.model.LectureHall>builder()
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

