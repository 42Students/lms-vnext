package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AppSettingsService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Read-only, narrowly scoped attendance configuration for college admins.
 * TenantAdminController's general settings endpoint remains super-admin-only:
 * granting a college admin access to every app_setting could reveal unrelated
 * operational or security configuration. No write endpoint is exposed here.
 */
@RestController
@RequestMapping("/api/v1/admin/attendance/policy")
public class AdminAttendancePolicyController {

    private final AccessControlService accessControlService;
    private final SecurityContextUtil securityContextUtil;
    private final AppSettingsService appSettingsService;

    public AdminAttendancePolicyController(AccessControlService accessControlService,
                                           SecurityContextUtil securityContextUtil,
                                           AppSettingsService appSettingsService) {
        this.accessControlService = accessControlService;
        this.securityContextUtil = securityContextUtil;
        this.appSettingsService = appSettingsService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAttendancePolicy(@RequestParam Integer collegeId) {
        if (collegeId == null || collegeId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "collegeId must be a positive integer"));
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        Map<String, Integer> settings = Map.of(
                "attendance.correctionWindowHours",
                appSettingsService.getInt("COLLEGE", collegeId, "attendance.correctionWindowHours", 24),
                "attendance.eligibilityThresholdPercent",
                appSettingsService.getInt("COLLEGE", collegeId, "attendance.eligibilityThresholdPercent", 75)
        );
        return ResponseEntity.ok(Map.of("settings", settings));
    }
}
