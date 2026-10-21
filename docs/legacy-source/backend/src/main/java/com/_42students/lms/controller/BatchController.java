package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.BatchPromotionDTO;
import com._42students.lms.dto.request.BatchRequestDTO;
import com._42students.lms.dto.response.BatchResponseDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.BatchService;
import com._42students.lms.util.SecurityContextUtil;

import io.swagger.annotations.ApiOperation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/batch")
public class BatchController {

    private final BatchService batchService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
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
        auditLogService.log(httpRequest, actionKey, "batch", String.valueOf(entityId),
                null, collegeId, payload != null ? payload : java.util.Map.of());
    }

    @Autowired
    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED) // BE-0070/0076: the name check after the parent lock sees a same-name row committed meanwhile
    @PostMapping("/create")
    public ResponseEntity<BatchResponseDTO> createBatch(@RequestBody @Valid BatchRequestDTO batchRequestDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (batchRequestDTO.getProgramId() != null) {
            Long programId = batchRequestDTO.getProgramId();
            Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveProgramToCollegeId(programId) : null;
            if (principal != null && accessControlService.isSuperAdmin(principal)) {
                if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                    Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                    if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                    }
                }
            }
            accessControlService.requireAccessProgram(principal, programId);
        }
        BatchResponseDTO responseDTO = batchService.createBatch(batchRequestDTO);
        audit("BATCH_CREATE", responseDTO != null ? responseDTO.getId() : null,
                batchRequestDTO.getProgramId() != null && scopeResolutionService != null
                        ? scopeResolutionService.resolveProgramToCollegeId(batchRequestDTO.getProgramId()) : null,
                java.util.Map.of("programId", String.valueOf(batchRequestDTO.getProgramId())));
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
    }

   @ApiOperation(value = "Get branch details by Batch Id")
@GetMapping("/getBranchDetailsById")
public ResponseEntity<BatchResponseDTO> getBranchDetailsById(@RequestParam(name = "batchId") Long batchId) {
    accessControlService.requireAccessBatch(securityContextUtil.getAuthenticatedUserPrincipal(), batchId);
    BatchResponseDTO responseDTO = batchService.getBatchDetails(batchId);
    if (responseDTO != null) {
        return ResponseEntity.ok(responseDTO);
    } else {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}

    @GetMapping("/fetch")
    @ApiOperation(value = "Get batches", notes = "Super-admin: all batches. Others: batches for principal's college only.")
    public ResponseEntity<java.util.List<BatchResponseDTO>> fetchAllBatches() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        List<BatchResponseDTO> batches;
        if (accessControlService.isSuperAdmin(principal)) {
            Integer scopedCollegeId = principal != null ? principal.getCollegeId() : null;
            Integer scopedOrgId = principal != null ? principal.getOrganizationId() : null;
            if (scopedCollegeId != null) {
                batches = batchService.findByCollegeId(scopedCollegeId);
            } else if (scopedOrgId != null) {
                batches = batchService.findByOrganizationId(scopedOrgId);
            } else {
                batches = batchService.findAll();
            }
        } else {
            Integer collegeId = principal != null ? principal.getCollegeId() : null;
            if (collegeId == null && principal != null && principal.isLearner() && scopeResolutionService != null) {
                collegeId = scopeResolutionService.resolveFullScope(principal.getId()).getCollegeId();
            }
            if (collegeId != null) {
                batches = batchService.findByCollegeId(collegeId);
            } else {
                batches = Collections.emptyList();
            }
        }
        return ResponseEntity.ok(batches);
    }

    @GetMapping("/fetchByProgram")
    @ApiOperation(value = "Get batches by program ID")
    public ResponseEntity<Map<String, Object>> fetchBatchesByProgram(@RequestParam Long programId) {
        accessControlService.requireAccessProgram(securityContextUtil.getAuthenticatedUserPrincipal(), programId);
        java.util.List<BatchResponseDTO> batches = batchService.findByProgramId(programId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "OK");
        response.put("data", batches);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/fetchByCollege")
    @ApiOperation(value = "Get batches by college ID", notes = "Returns all batches for programs in the given college. Used for college-scoped admin.")
    public ResponseEntity<Map<String, Object>> fetchBatchesByCollege(@RequestParam int collegeId) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        java.util.List<BatchResponseDTO> batches = batchService.findByCollegeId(collegeId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "OK");
        response.put("data", batches);
        return ResponseEntity.ok(response);
    }

    @Transactional
    @PostMapping("/{batchId}/promote")
    @ApiOperation(value = "Promote a batch to the next semester")
    public ResponseEntity<Map<String, Object>> promoteBatch(
            @PathVariable Long batchId,
            @RequestBody(required = false) @Valid BatchPromotionDTO dto) {
        accessControlService.requireAccessBatch(securityContextUtil.getAuthenticatedUserPrincipal(), batchId);
        try {
            if (dto != null && dto.getBatchId() != null && !dto.getBatchId().equals(batchId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("status", "ERROR", "message", "batchId in payload does not match path"));
            }
            Integer targetSemester = dto != null ? dto.getTargetSemester() : null;
            String newAcademicYear = dto != null ? dto.getNewAcademicYear() : null;
            if (newAcademicYear != null) newAcademicYear = newAcademicYear.trim();
            
            BatchResponseDTO result = batchService.promoteBatch(batchId, targetSemester, newAcademicYear);
            // The single most disruptive academic operation in the LMS; it previously left no trace.
            audit("BATCH_PROMOTE", batchId,
                    scopeResolutionService != null ? scopeResolutionService.resolveBatchToCollegeId(batchId) : null,
                    java.util.Map.of(
                    "targetSemester", String.valueOf(targetSemester),
                    "newAcademicYear", String.valueOf(newAcademicYear)));
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "Batch promoted to semester " + result.getCurrentSemester());
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            boolean notFound = e.getMessage() != null && e.getMessage().contains("not found");
            return ResponseEntity.status(notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST).body(response);
        } catch (IllegalStateException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        } catch (Exception e) {
            log.error("Failed to promote batch {}", batchId, e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to promote batch. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/{batchId}/promote/preview")
    @ApiOperation(value = "Server-verified dry run of a batch promotion; does not persist anything")
    public ResponseEntity<Map<String, Object>> previewPromotion(
            @PathVariable Long batchId,
            @RequestParam(required = false) Integer targetSemester) {
        accessControlService.requireAccessBatch(securityContextUtil.getAuthenticatedUserPrincipal(), batchId);
        try {
            Map<String, Object> preview = batchService.previewPromotion(batchId, targetSemester);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "OK");
            response.put("data", preview);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            boolean notFound = e.getMessage() != null && e.getMessage().contains("not found");
            return ResponseEntity.status(notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @Transactional
    @PutMapping("/{batchId}/semester")
    @ApiOperation(value = "Update batch's current semester")
    public ResponseEntity<Map<String, Object>> updateCurrentSemester(
            @PathVariable Long batchId,
            @RequestParam Integer semesterNumber) {
        accessControlService.requireAccessBatch(securityContextUtil.getAuthenticatedUserPrincipal(), batchId);
        try {
            BatchResponseDTO result = batchService.updateCurrentSemester(batchId, semesterNumber);
            audit("BATCH_SEMESTER_UPDATE", batchId,
                    scopeResolutionService != null ? scopeResolutionService.resolveBatchToCollegeId(batchId) : null,
                    java.util.Map.of("semesterNumber", String.valueOf(semesterNumber)));
            Map<String, Object> response = new HashMap<>();
            response.put("status", "OK");
            response.put("message", "Batch semester updated to " + semesterNumber);
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            boolean notFound = e.getMessage() != null && e.getMessage().contains("not found");
            return ResponseEntity.status(notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Failed to update batch {} semester", batchId, e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Failed to update batch semester. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @Transactional
    @PutMapping("/update/{id}")
    @ApiOperation(value = "Update a batch")
    public ResponseEntity<Map<String, Object>> updateBatch(
            @PathVariable Long id,
            @RequestBody @Valid BatchRequestDTO batchRequestDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveBatchToCollegeId(id) : null;
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", "ERROR", "message", "Scoped superadmin can only update batches in the selected college"));
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", "ERROR", "message", "Scoped superadmin can only update batches within the selected organization"));
                }
            }
        }
        accessControlService.requireAccessBatch(principal, id);
        Map<String, Object> response = new HashMap<>();
        try {
            if (batchRequestDTO.getProgramId() != null && scopeResolutionService != null && collegeId != null) {
                Integer targetCollegeId = scopeResolutionService.resolveProgramToCollegeId(batchRequestDTO.getProgramId());
                if (targetCollegeId == null || !collegeId.equals(targetCollegeId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("status", "ERROR", "message", "Program must belong to the same college as the batch"));
                }
            }
            BatchResponseDTO result = batchService.updateBatch(id, batchRequestDTO);
            audit("BATCH_UPDATE", id, collegeId, java.util.Map.of());
            response.put("status", "OK");
            response.put("message", "Batch updated successfully");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to update batch {}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to update batch. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @Transactional
    @DeleteMapping("/delete/{id}")
    @ApiOperation(value = "Delete a batch")
    public ResponseEntity<Map<String, Object>> deleteBatch(@PathVariable Long id) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveBatchToCollegeId(id) : null;
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", "ERROR", "message", "Scoped superadmin can only delete batches in the selected college"));
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", "ERROR", "message", "Scoped superadmin can only delete batches within the selected organization"));
                }
            }
        }
        accessControlService.requireAccessBatch(principal, id);
        Map<String, Object> response = new HashMap<>();
        try {
            batchService.deleteBatch(id);
            audit("BATCH_DELETE", id, collegeId, java.util.Map.of());
            response.put("status", "OK");
            response.put("message", "Batch deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        } catch (Exception e) {
            log.error("Failed to delete batch {}", id, e);
            response.put("status", "ERROR");
            response.put("message", "Failed to delete batch. Please try again or contact support.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

