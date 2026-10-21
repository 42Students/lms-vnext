package com._42students.lms.controller.tpo;

import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The TPO's control over which recruiters can see THEIR college. Always scoped to the caller's own
 * college (taken from the token, never from the URL), so one college cannot list or revoke another's
 * recruiter. A revoke takes effect on the very next recruiter request, because RecruiterAccessService checks the grant
 * on every call. Phone numbers are shown masked.
 */
@RestController
@RequestMapping("/api/v1/tpo/recruiter-access")
public class TpoRecruiterAccessController {

    private final RecruiterCollegeAccessRepository accessRepository;
    private final RecruiterRepository recruiterRepository;
    private final CompanyDirectoryService companyRepository;
    private final SecurityContextUtil securityContextUtil;
    /** Who extended or removed a recruiter's access, and when: both used to leave no trace in the audit log. */
    private final com._42students.lms.service.tpo.TpoAuditService audit;

    public TpoRecruiterAccessController(RecruiterCollegeAccessRepository accessRepository, RecruiterRepository recruiterRepository,
                                 CompanyDirectoryService companyRepository, SecurityContextUtil securityContextUtil,
                                 com._42students.lms.service.tpo.TpoAuditService audit) {
        this.accessRepository = accessRepository;
        this.recruiterRepository = recruiterRepository;
        this.companyRepository = companyRepository;
        this.securityContextUtil = securityContextUtil;
        this.audit = audit;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        Integer collegeId = principal().getCollegeId();
        if (collegeId == null) return ResponseEntity.ok(List.of());
        List<RecruiterCollegeAccess> grants = accessRepository.findAllForColleges(List.of(collegeId));
        Map<Integer, Recruiter> recruiters = recruiterRepository.findActiveByIds(grants.stream().map(RecruiterCollegeAccess::getRecruiterId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Recruiter::getId, Function.identity(), (a, b) -> a));
        return ResponseEntity.ok(grants.stream().filter(g -> recruiters.containsKey(g.getRecruiterId())).map(g -> {
            Recruiter recruiter = recruiters.get(g.getRecruiterId());
            String company = companyRepository.nameOf(recruiter.getCompanyId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("recruiterId", recruiter.getId());
            m.put("name", ((recruiter.getFirstName() == null ? "" : recruiter.getFirstName()) + " " + (recruiter.getLastName() == null ? "" : recruiter.getLastName())).trim());
            m.put("company", company);
            m.put("designation", recruiter.getDesignation());
            String mobile = recruiter.getContactMobile();
            m.put("phone", mobile == null || mobile.length() < 4 ? null : "******" + mobile.substring(mobile.length() - 4));
            m.put("status", g.getStatus());
            m.put("grantedAt", g.getGrantedAt());
            m.put("validUntil", g.getValidUntil());
            m.put("expired", g.getValidUntil() != null && !LocalDateTime.now().isBefore(g.getValidUntil()));
            m.put("revokedAt", g.getRevokedAt());
            // How they came in: the public link (and with it, direct posting) was invisible here (audit 13 Oct 2026, L9).
            String via = g.getGrantedByUserType();
            m.put("joinedVia", "PUBLIC_LINK".equals(via) ? "PUBLIC_LINK" : "COMPANY_LINK".equals(via) ? "COMPANY_LINK" : "INVITE");
            return m;
        }).toList());
    }

    public static class ExtendRequest {
        /** Months from today (or from the current end, if that is later); 0 removes the end date. */
        public Integer months;
    }

    /** Give a recruiter more time at this college (or no end date). Revoked access is not brought back this way. */
    @PostMapping("/{recruiterId}/extend")
    @Transactional
    public ResponseEntity<Map<String, Object>> extend(@PathVariable Integer recruiterId, @RequestBody ExtendRequest body) {
        UserPrincipal p = principal();
        if (p.getCollegeId() == null) throw new IllegalArgumentException("Not found");
        RecruiterCollegeAccess grant = accessRepository.findForRecruiterAndCollege(recruiterId, p.getCollegeId())
                .orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (RecruiterCollegeAccess.STATUS_REVOKED.equals(grant.getStatus())) throw new IllegalArgumentException("This recruiter's access was revoked; invite them again instead");
        int months = body == null || body.months == null ? 6 : body.months;
        if (months < 0 || months > 60) throw new IllegalArgumentException("Choose between 0 (no end date) and 60 months");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = grant.getValidUntil() != null && grant.getValidUntil().isAfter(now) ? grant.getValidUntil() : now;
        grant.setValidUntil(months == 0 ? null : base.plusMonths(months));
        accessRepository.save(grant);
        audit.log(p.getCollegeId(), "TPO", p.getId(), "RECRUITER_ACCESS_EXTENDED", "SETTINGS", recruiterId.longValue(),
                months == 0 ? "No end date" : "Until " + grant.getValidUntil().toLocalDate());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("validUntil", grant.getValidUntil());
        return ResponseEntity.ok(out);
    }

    public static class RevokeRequest {
        public String reason;
    }

    @PostMapping("/{recruiterId}/revoke")
    @Transactional
    public ResponseEntity<Void> revoke(@PathVariable Integer recruiterId, @RequestBody(required = false) RevokeRequest body) {
        UserPrincipal p = principal();
        if (p.getCollegeId() == null) throw new IllegalArgumentException("Not found");
        RecruiterCollegeAccess grant = accessRepository.findForRecruiterAndCollege(recruiterId, p.getCollegeId())
                .orElseThrow(() -> new IllegalArgumentException("Not found"));
        // The reason column holds 500 characters: a longer one was a server error after the TPO confirmed.
        if (body != null && body.reason != null && body.reason.trim().length() > 500) throw new IllegalArgumentException("Keep the reason under 500 characters");
        // Already removed: nothing changes and nothing is logged again.
        if (RecruiterCollegeAccess.STATUS_REVOKED.equals(grant.getStatus())) return ResponseEntity.noContent().build();
        grant.setStatus(RecruiterCollegeAccess.STATUS_REVOKED);
        grant.setRevokedAt(LocalDateTime.now());
        grant.setRevokedByUserId(p.getId());
        grant.setRevokedByUserType("FACULTY");
        grant.setRevokeReason(body == null || body.reason == null ? null : body.reason.trim());
        accessRepository.save(grant);
        audit.log(p.getCollegeId(), "TPO", p.getId(), "RECRUITER_ACCESS_REMOVED", "SETTINGS", recruiterId.longValue(), grant.getRevokeReason());
        return ResponseEntity.noContent().build();
    }
}
