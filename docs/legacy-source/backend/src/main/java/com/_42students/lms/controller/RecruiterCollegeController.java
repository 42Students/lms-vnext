package com._42students.lms.controller;

import com._42students.lms.dto.tpo.DriveForm;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.JobEligibility;
import com._42students.lms.model.tpo.JobRoleOption;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.recruiter.RecruiterAccessService;
import com._42students.lms.service.recruiter.RecruiterCapability;
import com._42students.lms.service.tpo.EligibilityService;
import com._42students.lms.service.tpo.RecruiterCollegeOverviewService;
import com._42students.lms.service.tpo.TpoDriveService;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A recruiter's view of ONE college they have access to (Recruiter V1 - Locked.docx §3-5). Under /api/v1/recruiter/**,
 * so the recruiter fence lets it through; every method still calls RecruiterAccessService.requireCollege with the
 * capability it needs, because holding the recruiter role says nothing about which college. recruiter only ever
 * sees their own drive requests, in recruiter wording, and never a Job entity.
 */
@RestController
@RequestMapping("/api/v1/recruiter/colleges/{collegeId}")
public class RecruiterCollegeController {

    private final RecruiterAccessService accessService;
    private final RecruiterCollegeOverviewService overviewService;
    private final TpoDriveService driveService;
    private final JobRepository jobRepository;
    private final CompanyDirectoryService companyRepository;
    private final SecurityContextUtil securityContextUtil;
    private final EligibilityService eligibilityService;
    private final ObjectMapper objectMapper;

    public RecruiterCollegeController(RecruiterAccessService accessService, RecruiterCollegeOverviewService overviewService,
                               TpoDriveService driveService, JobRepository jobRepository,
                               CompanyDirectoryService companyRepository, SecurityContextUtil securityContextUtil,
                               EligibilityService eligibilityService, ObjectMapper objectMapper) {
        this.accessService = accessService;
        this.overviewService = overviewService;
        this.driveService = driveService;
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
        this.securityContextUtil = securityContextUtil;
        this.eligibilityService = eligibilityService;
        this.objectMapper = objectMapper;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview(@PathVariable Integer collegeId) {
        accessService.requireCollege(principal(), collegeId, RecruiterCapability.COLLEGE_OVERVIEW);
        return ResponseEntity.ok(overviewService.overview(collegeId, principal().getId()));
    }

    @GetMapping("/drive-requests")
    public ResponseEntity<List<Map<String, Object>>> myRequests(@PathVariable Integer collegeId) {
        UserPrincipal p = principal();
        accessService.requireCollege(p, collegeId, RecruiterCapability.DRIVE_REQUEST);
        return ResponseEntity.ok(jobRepository.findRecruiterRequests(p.getId().longValue(), collegeId).stream().map(this::view).toList());
    }

    @PostMapping("/drive-requests")
    public ResponseEntity<Map<String, Object>> request(@PathVariable Integer collegeId, @RequestBody DriveForm form) {
        UserPrincipal p = principal();
        RecruiterCollegeAccess grant = accessService.requireCollege(p, collegeId, RecruiterCapability.DRIVE_REQUEST);
        Job job = driveService.createRequest(form, grant.getOrganizationId(), collegeId, p.getId().longValue(), companyNameOf(p));
        return ResponseEntity.status(HttpStatus.CREATED).body(view(job));
    }

    /** Fix a request the placement cell sent back and submit it again. */
    @PutMapping("/drive-requests/{jobId}")
    public ResponseEntity<Map<String, Object>> resubmit(@PathVariable Integer collegeId, @PathVariable Integer jobId, @RequestBody DriveForm form) {
        UserPrincipal p = principal();
        accessService.requireCollege(p, collegeId, RecruiterCapability.DRIVE_REQUEST);
        // The request must be this recruiter's and at this college; otherwise it looks like it does not exist.
        boolean mine = jobRepository.findRecruiterRequests(p.getId().longValue(), collegeId).stream().anyMatch(j -> java.util.Objects.equals(j.getId(), jobId)); // BE-0152: value, not boxed identity
        if (!mine) throw new IllegalArgumentException("Not found");
        return ResponseEntity.ok(view(driveService.resubmitRequest(jobId, form, p.getId().longValue(), companyNameOf(p))));
    }

    private String companyNameOf(UserPrincipal p) {
        Recruiter recruiter = accessService.findUsableRecruiter(p.getId()).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (recruiter.getCompanyId() == null) {
            throw new IllegalArgumentException("Your account has no company yet. Please contact the placement cell");
        }
        return java.util.Optional.ofNullable(companyRepository.nameOf(recruiter.getCompanyId()))
                .orElseThrow(() -> new IllegalArgumentException("Your account has no company yet. Please contact the placement cell"));
    }

    /** The five drive statuses everyone sees (recruiter phase 1, N9): Draft, Sent for review, Live, Completed, Cancelled. */
    private static String recruiterStatus(String lifecycle) {
        if (lifecycle == null) return "Live";
        switch (lifecycle) {
            case "REQUEST":
            case "SENT_BACK": return "Sent for review";
            case "REJECTED":
            case "CANCELLED": return "Cancelled";
            // Approved or posted by the college but not open yet: still with the placement cell, in review (N9).
            case "DRAFT": return "Sent for review";
            case "CLOSED": return "Completed";
            default: return "Live";
        }
    }

    // Instance (not static): needs eligibilityService/objectMapper to unpack the JSON columns so
    // "Edit and send again" on the frontend can restore every field, not just the role title.
    private Map<String, Object> view(Job j) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", j.getId());
        m.put("roleTitle", j.getJobTitle());
        m.put("status", recruiterStatus(j.getLifecycleStatus()));
        // A drive in review can be edited by the company; what the college asks for comes as change requests (N14).
        m.put("canResubmit", "SENT_BACK".equals(j.getLifecycleStatus()) || "REQUEST".equals(j.getLifecycleStatus()));
        m.put("declined", "REJECTED".equals(j.getLifecycleStatus()));
        m.put("noteFromPlacementCell", "REJECTED".equals(j.getLifecycleStatus()) ? j.getSentBackNote() : null);
        m.put("ctc", j.getCtcRange());
        m.put("requestedAt", j.getCreatedAt());
        m.put("description", j.getJobDescription());
        m.put("location", j.getLocation());
        JobEligibility eligibility = eligibilityService.parse(j);
        m.put("minCgpa", eligibility.getMinCgpa());
        // So "hire again" and "fix and resend" keep the branch and passing-year limits too.
        m.put("branches", eligibility.getBranches());
        m.put("passingYears", eligibility.getPassingYears());
        m.put("driveMode", j.getDriveMode());
        JobRoleOption option = firstRoleOption(j);
        m.put("ctcLpa", option == null ? null : option.getCtcLpa());
        m.put("fixedLpa", option == null ? null : option.getFixedLpa());
        m.put("variableLpa", option == null ? null : option.getVariableLpa());
        m.put("joiningBonusLpa", option == null ? null : option.getJoiningBonusLpa());
        m.put("stipendPerMonth", option == null ? null : option.getStipendPerMonth());
        m.put("stipendMonths", option == null ? null : option.getStipendMonths());
        m.put("jobType", j.getJobType());
        m.put("jdUrl", j.getJdUrl());
        m.put("deadline", j.getApplicationDeadline());
        m.put("lifecycle", j.getLifecycleStatus());
        return m;
    }

    private JobRoleOption firstRoleOption(Job j) {
        if (j.getRoleOptionsJson() == null) return null;
        try {
            JobRoleOption[] options = objectMapper.convertValue(j.getRoleOptionsJson(), JobRoleOption[].class);
            return options.length > 0 ? options[0] : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badOrMissing(IllegalArgumentException e) {
        String msg = e.getMessage() == null ? "Bad request" : e.getMessage();
        boolean notFound = msg.toLowerCase(java.util.Locale.ROOT).contains("not found");
        return ResponseEntity.status(notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST).body(Map.of("error", msg));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> conflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
}
