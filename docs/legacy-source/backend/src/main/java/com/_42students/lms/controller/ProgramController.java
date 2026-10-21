package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.NewProgramDTO;
import com._42students.lms.dto.request.ProgramDTO;
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
@RequestMapping("/api/v1/program")
@Slf4j
@Validated
public class ProgramController extends BaseController {

    @Autowired
    NewProgramService newProgramService;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired
    ScopeResolutionService scopeResolutionService;

    /**
     * Create a program. Writes to new_program (same as /api/v1/new-program/create).
     * Request body: name, dept_id, duration_years (optional, default 0).
     */
    @Transactional
    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a program for given department", notes = "Creates in new_program so it appears in new-program/fetchAll.")
    public ResponseEntity createProgram(@RequestBody @Valid ProgramDTO programDTO)
            throws Exception {
        com._42students.lms.security.UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessDepartment(principal, programDTO.getDeptId());
        Integer collegeId = scopeResolutionService.resolveDepartmentToCollegeId(programDTO.getDeptId());
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        NewProgramDTO dto = new NewProgramDTO();
        dto.setName(programDTO.getName());
        dto.setDeptId(programDTO.getDeptId());
        dto.setDurationYears(programDTO.getDurationYears());
        NewProgram program = newProgramService.createProgram(dto);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), program), HttpStatus.OK);
    }

    /**
     * Fetch programs by department. Uses new_program (same as new-program/fetchByDept).
     */
    @RequestMapping(value = "/fetchAllPrograms", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch programs for given department", notes = "Reads from new_program.")
    public ResponseEntity fetchAllPrograms(@RequestParam int deptId)
            throws Exception {
        accessControlService.requireAccessDepartment(securityContextUtil.getAuthenticatedUserPrincipal(), deptId);
        List<NewProgramResponseDTO> programs = newProgramService.findByDeptId(deptId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), programs), HttpStatus.OK);
    }

    /**
     * Fetch program details by id. Uses new_program (same as new-program/fetch/{id}).
     */
    @RequestMapping(value = "/fetchProgramDetails", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch program detail for given programId", notes = "Reads from new_program.")
    public ResponseEntity fetchProgramDetails(@RequestParam int programId)
            throws Exception {
        accessControlService.requireAccessProgram(securityContextUtil.getAuthenticatedUserPrincipal(), programId);
        NewProgramResponseDTO program = newProgramService.findById(programId);
        if (program == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Program not found", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), program), HttpStatus.OK);
    }

    /**
     * Fetch programs by college. Uses new_program (same as new-program/fetchByCollege).
     */
    @GetMapping("/getProgramsByCollege")
    public ResponseEntity<Response<List<NewProgramResponseDTO>>> getProgramsByCollege(@RequestParam("collegeId") int collegeId) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        List<NewProgramResponseDTO> programs = newProgramService.findByCollegeId(collegeId);
        if (programs.isEmpty()) {
            return new ResponseEntity<>(new Response<>(HttpStatus.NOT_FOUND.name(), HttpStatus.NOT_FOUND.getReasonPhrase(), null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), programs), HttpStatus.OK);
    }
}


