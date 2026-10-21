package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.LearnerAcademicRecord;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.LearnerPlacementProfileService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Student V1 §8 "Profile": the student's own academic record (read-only; corrections go through
 * the existing student_request CORRECTION queue) and "who has my data".
 */
@RestController
@RequestMapping("/api/v1/learner/profile")
public class LearnerPlacementProfileController {

    private final LearnerPlacementProfileService profileService;
    private final SecurityContextUtil securityContextUtil;

    public LearnerPlacementProfileController(LearnerPlacementProfileService profileService, SecurityContextUtil securityContextUtil) {
        this.profileService = profileService;
        this.securityContextUtil = securityContextUtil;
    }

    @GetMapping("/academic-record")
    public ResponseEntity<LearnerAcademicRecord> academicRecord() {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        return ResponseEntity.ok(profileService.academicRecord(p.getId()));
    }

    @GetMapping("/data-access")
    public ResponseEntity<List<Map<String, Object>>> dataAccess() {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        return ResponseEntity.ok(profileService.dataAccessLog(p.getId()));
    }
}
