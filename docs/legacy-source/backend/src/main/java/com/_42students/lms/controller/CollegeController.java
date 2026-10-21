package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.CollegeDTO;
import com._42students.lms.dto.response.CollegeResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.College;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CollegeService;
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
@RequestMapping("/api/v1/college")
@Slf4j
@Validated
public class CollegeController extends BaseController {

    @Autowired
    CollegeService collegeService;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired
    ScopeResolutionService scopeResolutionService;

    @Transactional
    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a college/university", notes = "")
    public ResponseEntity createCollege(@RequestBody @Valid CollegeDTO collegeDTO)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // Safety: college creation is an org-level action. Disallow when scoped to a specific college.
        if (principal != null && principal.getCollegeId() != null) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Clear college scope to create colleges", null), HttpStatus.FORBIDDEN);
        }
        // Safety: when scoped to an org, only allow creating within that org.
        if (principal != null && principal.getOrganizationId() != null && collegeDTO.getOrgId() > 0
                && !principal.getOrganizationId().equals(collegeDTO.getOrgId())) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create colleges within the selected organization", null), HttpStatus.FORBIDDEN);
        }
        accessControlService.requireAccessOrganization(principal, collegeDTO.getOrgId());
        College college = collegeService.createCollege(collegeDTO);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),college), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetch", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all colleges/university", notes = "")
    public ResponseEntity fetchColleges(@RequestParam int orgId)
            throws Exception {
        accessControlService.requireAccessOrganization(securityContextUtil.getAuthenticatedUserPrincipal(), orgId);
        List<College> colleges = collegeService.fetchColleges(orgId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),colleges), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchOnlyNames", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all colleges/university", notes = "")
    public ResponseEntity fetchOnlyNames(@RequestParam int orgId)
            throws Exception {
        accessControlService.requireAccessOrganization(securityContextUtil.getAuthenticatedUserPrincipal(), orgId);
        List<CollegeResponseDTO> collegeResponseDTOS = collegeService.fetchOnlyNames(orgId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),collegeResponseDTOS), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchCollegeList", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all colleges/university", notes = "")
    public ResponseEntity fetchCollegeList(@RequestParam(required = false) Boolean all)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        List<CollegeResponseDTO> colleges;
        boolean isSuperAdmin = principal.getId() != null && principal.getId() == 0;
        if (isSuperAdmin && Boolean.TRUE.equals(all)) {
            // Explicit opt-out of the self-scoping below — for the superadmin scope SWITCHER
            // itself (SuperAdminScopeContext), which must always be able to list every college to
            // switch to, even while the caller's own JWT is currently scoped to one college/org.
            // Without this, picking a college narrows this same endpoint's next response down to
            // just that one college (see the branches below), so the switcher's own dropdown loses
            // every other option the moment you use it once — every other caller of this endpoint
            // (Faculty/Departments/Jobs pages etc.) still gets the normal self-scoped behavior.
            colleges = collegeService.fetchCollegeList();
        } else if (isSuperAdmin) {
            // Superadmin: respect scope when present; otherwise return global list.
            if (principal.getCollegeId() != null) {
                College c = collegeService.fetchCollege(principal.getCollegeId());
                CollegeResponseDTO dto = new CollegeResponseDTO();
                dto.setId(c.getId());
                dto.setName(c.getName());
                dto.setLogo(c.getLogo());
                dto.setUniqueId(c.getUniqueId());
                dto.setOrgId(c.getOrgId());
                dto.setCity(c.getCity());
                dto.setState(c.getState());
                colleges = List.of(dto);
            } else if (principal.getOrganizationId() != null) {
                colleges = collegeService.fetchOnlyNames(principal.getOrganizationId());
            } else {
                colleges = collegeService.fetchCollegeList();
            }
        } else {
            Integer orgId = principal != null ? principal.getOrganizationId() : null;
            if (orgId == null && principal != null && scopeResolutionService != null) {
                if (principal.isLearner()) {
                    orgId = scopeResolutionService.resolveFullScope(principal.getId()).getOrganizationId();
                } else if (principal.getCollegeId() != null) {
                    orgId = scopeResolutionService.resolveCollegeToOrganizationId(principal.getCollegeId());
                }
            }
            if (orgId != null) {
                colleges = collegeService.fetchOnlyNames(orgId);
            } else {
                colleges = java.util.Collections.emptyList();
            }
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), colleges), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchCollege", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch the colleges/university", notes = "")
    public ResponseEntity fetchCollege(@RequestParam int collegeId)
            throws Exception {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        College college = collegeService.fetchCollege(collegeId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),college), HttpStatus.OK);
    }

    @Transactional
    @PutMapping("/update/{id}")
    @ApiOperation(value = "Update a college", notes = "")
    public ResponseEntity<Map<String, Object>> updateCollege(
            @PathVariable Integer id,
            @RequestBody @Valid CollegeDTO collegeDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && !principal.getCollegeId().equals(id)) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "ERROR");
                response.put("message", "Scoped superadmin can only update the selected college");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            if (principal.getOrganizationId() != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(id);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("status", "ERROR");
                    response.put("message", "Scoped superadmin can only update colleges within the selected organization");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, id);
        Map<String, Object> response = new HashMap<>();
        try {
            College college = collegeService.updateCollege(id, collegeDTO);
            response.put("status", "OK");
            response.put("message", "College updated successfully");
            response.put("data", college);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // Validation failures (e.g. duplicate uniqueId) carry a real, user-safe message —
            // unlike the generic catch below, surface it instead of a one-size-fits-all string.
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Failed to update college {}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to update college. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @Transactional
    @DeleteMapping("/delete/{id}")
    @ApiOperation(value = "Delete a college", notes = "")
    public ResponseEntity<Map<String, Object>> deleteCollege(@PathVariable Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && !principal.getCollegeId().equals(id)) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "ERROR");
                response.put("message", "Scoped superadmin can only delete the selected college");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            if (principal.getOrganizationId() != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(id);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("status", "ERROR");
                    response.put("message", "Scoped superadmin can only delete colleges within the selected organization");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }
        }
        accessControlService.requirePerformAdminActionForCollege(principal, id);
        Map<String, Object> response = new HashMap<>();
        try {
            collegeService.deleteCollege(id);
            response.put("status", "OK");
            response.put("message", "College deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // deleteCollege's own dependency checks ("Cannot delete college: departments exist
            // under this college", etc.) carry the real, user-safe reason — the frontend already
            // tries to read it (error.response.data.error/message), but this catch was discarding
            // it into the same generic string for every failure, including the common "you have
            // dependents" case a superadmin actually needs to see to know what to clean up first.
            log.warn("College delete blocked ({}): {}", id, e.getMessage());
            response.put("status", "ERROR");
            response.put("message", e.getMessage() != null ? e.getMessage() : "Failed to delete college.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Failed to delete college {}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to delete college. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}


