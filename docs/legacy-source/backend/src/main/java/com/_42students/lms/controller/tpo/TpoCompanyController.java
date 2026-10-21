package com._42students.lms.controller.tpo;

import com._42students.lms.model.Company;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.service.tpo.CompanyJoinService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The TPO's company picker on the drive form (recruiter phase 1, N3): strong search across 42's curated list and every
 * known company, and "Add other". Under /api/v1/tpo, so the TPO access filter applies.
 */
@RestController
@RequestMapping("/api/v1/tpo/companies")
@RequiredArgsConstructor
public class TpoCompanyController {

    private final CompanyDirectoryService directory;
    private final SecurityContextUtil securityContextUtil;
    private final CompanyJoinService companyJoin;

    private UserPrincipal p() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    public static class ResolveRequest {
        public String name;
        public String website;
        public String recruiterEmail;
        /** The TPO confirmed it is a different company from the one the name matches. */
        public Boolean notTheSame;
    }

    @GetMapping("/search")
    public List<CompanyDirectoryService.Found> search(@RequestParam(name = "q", required = false) String q) {
        return directory.search(q, p().getCollegeId());
    }

    /** "Add other": find the company by its website or recruiter email domain, or create it unverified; it joins this college's list. */
    @PostMapping("/resolve")
    public Map<String, Object> resolve(@RequestBody ResolveRequest r) {
        UserPrincipal me = p();
        CompanyDirectoryService.Resolved res = directory.resolveForCollege(r == null ? null : r.name, r == null ? null : r.website,
                r == null ? null : r.recruiterEmail, me.getCollegeId(), new CompanyDirectoryService.Actor("FACULTY", me.getId(), me.getCollegeId()),
                r == null || !Boolean.TRUE.equals(r.notTheSame));
        Company c = res.company();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", c.getId());
        out.put("name", c.getName());
        out.put("logoUrl", c.getLogoUrl());
        out.put("verifiedBy42", Boolean.TRUE.equals(c.getVerifiedBy42()));
        out.put("existed", res.existed());
        out.put("nameLocked", res.nameLocked());
        return out;
    }

    /** The company's join link at this college and how it is doing, and whether the company is trusted (N5 b). */
    @GetMapping("/{companyId}/engagement")
    public Map<String, Object> engagement(@PathVariable Integer companyId) {
        return companyJoin.engagement(p().getCollegeId(), companyId);
    }

    /** A new unique link for this company; the old one stops working. The token is shown once. */
    @PostMapping("/{companyId}/join-link")
    public Map<String, Object> newJoinLink(@PathVariable Integer companyId) {
        return companyJoin.newLink(p().getCollegeId(), companyId);
    }

    public static class DomainRequest {
        public String domain;
    }

    /** Adds an email domain to a company not on 42's curated list (older companies have none). */
    @PostMapping("/{companyId}/domains")
    public Map<String, Object> addDomain(@PathVariable Integer companyId, @RequestBody DomainRequest r) {
        UserPrincipal me = p();
        directory.addDomain(companyId, r == null ? null : r.domain, new CompanyDirectoryService.Actor("FACULTY", me.getId(), me.getCollegeId()));
        return companyJoin.engagement(me.getCollegeId(), companyId);
    }

    public static class TrustedRequest {
        public boolean trusted;
    }

    /** A trusted company's drive requests go live without review. */
    @PutMapping("/{companyId}/trusted")
    public Map<String, Object> trusted(@PathVariable Integer companyId, @RequestBody TrustedRequest r) {
        return companyJoin.setTrusted(p().getCollegeId(), companyId, r != null && r.trusted);
    }

    /** "Add other" with the name of a company already on the list: the screen offers "Use Infosys" (or "It's a different company"). */
    @org.springframework.web.bind.annotation.ExceptionHandler(CompanyDirectoryService.SameCompanyException.class)
    public org.springframework.http.ResponseEntity<Map<String, Object>> sameCompany(CompanyDirectoryService.SameCompanyException e) {
        return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                .body(Map.of("code", "SAME_COMPANY", "companyId", e.getCompanyId(), "companyName", e.getCompanyName(), "message", e.getMessage(), "error", e.getMessage()));
    }
}
