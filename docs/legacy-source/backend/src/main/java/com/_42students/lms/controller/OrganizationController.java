package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.OrganizationDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.Organization;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.OrganizationService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/organization")
@Slf4j
@Validated
public class OrganizationController extends BaseController {

    @Autowired
    OrganizationService organizationService;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    ScopeResolutionService scopeResolutionService;

    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create an organization", notes = "")
    public ResponseEntity createOrganisation(@Valid @RequestBody OrganizationDTO organizationDTO)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        // Safety: organization creation is a GLOBAL action. Disallow when superadmin is scoped.
        if (principal != null && (principal.getOrganizationId() != null || principal.getCollegeId() != null)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Response(HttpStatus.FORBIDDEN.name(), "Clear scope (GLOBAL mode) to create organizations", null));
        }
        try {
            Organization organization = organizationService.createOrganisation(organizationDTO);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),organization), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            // Without this, "Organization name already exists" fell through to
            // GlobalExceptionHandler's generic Exception branch as a 500 "An unexpected error
            // occurred" — technically still IllegalArgumentException-aware there too, but that
            // branch returns 500 for it; a duplicate name is a plain validation failure and
            // belongs at 400, matching update/delete's local handling below.
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/fetch", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get all organizations", notes = "")
    public ResponseEntity fetchOrganizations() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        List<Organization> organizations;
        if (accessControlService.isGlobalSuperAdmin(principal)) {
            organizations = organizationService.findAll();
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
                organizations = organizationService.findById(orgId)
                        .map(Collections::singletonList)
                        .orElse(Collections.emptyList());
            } else {
                organizations = Collections.emptyList();
            }
        }
        // Safety: never return soft-deleted orgs
        organizations = organizations == null ? Collections.emptyList() : organizations.stream()
                .filter(o -> o != null && !Boolean.TRUE.equals(o.getIsDeleted()))
                .toList();
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), organizations), HttpStatus.OK);
    }

    @GetMapping("/fetch/{id}")
    @ApiOperation(value = "Get organization by ID", notes = "")
    public ResponseEntity<Map<String, Object>> getOrganizationById(@PathVariable Integer id) {
        accessControlService.requireAccessOrganization(securityContextUtil.getAuthenticatedUserPrincipal(), id);
        Map<String, Object> response = new HashMap<>();
        try {
            Organization organization = organizationService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
            response.put("status", "OK");
            response.put("message", "OK");
            response.put("data", organization);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch organization id={}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to fetch organization. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PutMapping("/update/{id}")
    @ApiOperation(value = "Update an organization", notes = "")
    public ResponseEntity<Map<String, Object>> updateOrganization(
            @PathVariable Integer id,
            @Valid @RequestBody OrganizationDTO organizationDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        // Safety: when superadmin is scoped, only allow edits within that scope
        Integer scopedOrgId = principal != null ? principal.getOrganizationId() : null;
        if (scopedOrgId == null && principal != null && principal.getCollegeId() != null && scopeResolutionService != null) {
            scopedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(principal.getCollegeId());
        }
        if (scopedOrgId != null && !scopedOrgId.equals(id)) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Scoped superadmin can only edit the selected organization");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        Map<String, Object> response = new HashMap<>();
        try {
            Organization organization = organizationService.updateOrganization(id, organizationDTO);
            response.put("status", "OK");
            response.put("message", "Organization updated successfully");
            response.put("data", organization);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Failed to update organization id={}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to update organization. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/delete/{id}")
    @ApiOperation(value = "Delete an organization", notes = "")
    public ResponseEntity<Map<String, Object>> deleteOrganization(@PathVariable Integer id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireSuperAdmin(principal);
        // Safety: when superadmin is scoped, only allow deletes within that scope
        Integer scopedOrgId = principal != null ? principal.getOrganizationId() : null;
        if (scopedOrgId == null && principal != null && principal.getCollegeId() != null && scopeResolutionService != null) {
            scopedOrgId = scopeResolutionService.resolveCollegeToOrganizationId(principal.getCollegeId());
        }
        if (scopedOrgId != null && !scopedOrgId.equals(id)) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Scoped superadmin can only delete the selected organization");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        Map<String, Object> response = new HashMap<>();
        try {
            organizationService.deleteOrganization(id);
            response.put("status", "OK");
            response.put("message", "Organization deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Failed to delete organization id={}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to delete organization. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

