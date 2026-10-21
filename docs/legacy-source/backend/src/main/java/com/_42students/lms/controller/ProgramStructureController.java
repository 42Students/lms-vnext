package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.NewProgramStructureDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.enums.StatusType;
import com._42students.lms.model.NewProgramStructure;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ProgramStructureService;
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
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
@RequestMapping("/api/v1/program-structure")
@Slf4j
@Validated
public class ProgramStructureController extends BaseController {

    @Autowired
    private ProgramStructureService programStructureService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private ScopeResolutionService scopeResolutionService;

    private UserPrincipal principal() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        return principal;
    }

    private NewProgramStructure existingStructureOrThrow(int id) {
        try {
            return programStructureService.fetchById(id);
        } catch (NoSuchElementException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Program structure not found");
        }
    }

    private Integer collegeIdFor(NewProgramStructure structure) {
        return structure == null ? null : scopeResolutionService.resolveProgramToCollegeId(structure.getProgramId());
    }

    @Transactional
    @PostMapping("/create")
    @ApiOperation(value = "Create a new program structure (semester)", notes = "")
    public ResponseEntity createProgramStructure(@Valid @RequestBody NewProgramStructureDTO dto) {
        Integer collegeId = scopeResolutionService.resolveProgramToCollegeId(dto.getProgramId());
        accessControlService.requirePerformAdminActionForCollege(principal(), collegeId);
        NewProgramStructure structure = programStructureService.createProgramStructure(dto);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), structure), HttpStatus.OK);
    }

    @Transactional
    @PutMapping("/update/{id}")
    @ApiOperation(value = "Update a program structure", notes = "")
    public ResponseEntity updateProgramStructure(@PathVariable int id, @Valid @RequestBody NewProgramStructureDTO dto) {
        NewProgramStructure existing = existingStructureOrThrow(id);
        accessControlService.requirePerformAdminActionForCollege(principal(), collegeIdFor(existing));
        try {
            NewProgramStructure structure = programStructureService.updateProgramStructure(id, dto);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), structure), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    @DeleteMapping("/delete/{id}")
    @ApiOperation(value = "Delete a program structure", notes = "")
    public ResponseEntity deleteProgramStructure(@PathVariable int id) {
        NewProgramStructure existing = existingStructureOrThrow(id);
        accessControlService.requirePerformAdminActionForCollege(principal(), collegeIdFor(existing));
        programStructureService.deleteProgramStructure(id);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), "Deleted successfully", null), HttpStatus.OK);
    }

    @GetMapping("/fetchAll")
    @ApiOperation(value = "Fetch all program structures visible to the caller", notes = "")
    public ResponseEntity fetchAll() {
        UserPrincipal principal = principal();
        // Legacy endpoint retained for compatibility, but never return a platform-wide list to a
        // tenant-scoped caller. Filtering each row by its owning program closes the cross-college
        // disclosure while callers migrate to /fetchAllSemesters?programId=... .
        List<NewProgramStructure> structures = programStructureService.fetchAll().stream()
                .filter(structure -> structure != null
                        && accessControlService.canAccessProgram(principal, structure.getProgramId()))
                .collect(Collectors.toList());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), structures), HttpStatus.OK);
    }

    @GetMapping("/fetchAllSemesters")
    @ApiOperation(value = "Fetch all semesters for the given program", notes = "")
    public ResponseEntity<List<NewProgramStructure>> fetchAllSemesters(@RequestParam int programId)
            throws Exception {
        accessControlService.requireAccessProgram(principal(), programId);
        List<NewProgramStructure> semesters = programStructureService.fetchAllSemesters(programId);
        return new ResponseEntity<>(semesters, HttpStatus.OK);
    }

    @Transactional
    @PutMapping("/updateStatus")
    @ApiOperation(value = "Update status of program structures", notes = "")
    public ResponseEntity<String> updateStatus(
            @RequestParam int programId,
            @RequestParam int id,
            @RequestParam StatusType statusType)
            throws Exception {
        Integer collegeId = scopeResolutionService.resolveProgramToCollegeId(programId);
        accessControlService.requirePerformAdminActionForCollege(principal(), collegeId);
        try {
            programStructureService.updateStatus(programId, id, statusType);
        } catch (IllegalArgumentException e) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return new ResponseEntity<>("Status updated successfully.", HttpStatus.OK);
    }

    @GetMapping("/fetchActiveSemesters")
    public ResponseEntity<List<NewProgramStructure>> fetchActiveSemesters(
            @RequestParam int programId) {
        accessControlService.requireAccessProgram(principal(), programId);
        List<NewProgramStructure> activeSemesters = programStructureService.fetchActiveSemesters(programId);
        return new ResponseEntity<>(activeSemesters, HttpStatus.OK);
    }
}
