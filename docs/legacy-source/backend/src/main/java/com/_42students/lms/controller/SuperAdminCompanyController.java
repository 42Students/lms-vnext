package com._42students.lms.controller;

import com._42students.lms.model.Company;
import com._42students.lms.service.company.CompanyCurationService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** 42's curated company list (recruiter phase 1, N3). Restricted to ROLE_SUPER_ADMIN in WebSecurityConfig. */
@RestController
@RequestMapping("/api/v1/superadmin/companies")
@RequiredArgsConstructor
public class SuperAdminCompanyController {

    private final CompanyCurationService curation;
    private final SecurityContextUtil securityContextUtil;

    public static class VerifyRequest {
        public boolean verified;
    }

    public static class DomainRequest {
        public String domain;
    }

    public static class AliasRequest {
        public String alias;
    }

    public static class MergeRequest {
        public Integer intoCompanyId;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam(name = "q", required = false) String q,
                                    @RequestParam(name = "unverified", defaultValue = "false") boolean unverified,
                                    @RequestParam(name = "page", defaultValue = "0") int page,
                                    @RequestParam(name = "size", defaultValue = "50") int size) {
        return curation.list(q, unverified, page, size);
    }

    @PostMapping("/{id}/verify")
    public Company verify(@PathVariable Integer id, @RequestBody VerifyRequest r) {
        return curation.setVerified(id, r != null && r.verified, securityContextUtil.getAuthenticatedUserPrincipal().getId());
    }

    @PutMapping("/{id}")
    public Company update(@PathVariable Integer id, @RequestBody CompanyCurationService.Details in) {
        return curation.update(id, in == null ? new CompanyCurationService.Details() : in);
    }

    @PostMapping("/{id}/domains")
    public List<String> addDomain(@PathVariable Integer id, @RequestBody DomainRequest r) {
        return curation.addDomain(id, r == null ? null : r.domain);
    }

    @DeleteMapping("/{id}/domains/{domain}")
    public List<String> removeDomain(@PathVariable Integer id, @PathVariable String domain) {
        return curation.removeDomain(id, domain);
    }

    @PostMapping("/{id}/merge")
    public Company merge(@PathVariable Integer id, @RequestBody MergeRequest r) {
        return curation.merge(id, r == null ? null : r.intoCompanyId);
    }

    /** Other names the company goes by ("TCS"): the TPO's company search finds it by them. */
    @PostMapping("/{id}/aliases")
    public List<String> addAlias(@PathVariable Integer id, @RequestBody AliasRequest r) {
        return curation.addAlias(id, r == null ? null : r.alias, securityContextUtil.getAuthenticatedUserPrincipal().getId());
    }

    @DeleteMapping("/{id}/aliases")
    public List<String> removeAlias(@PathVariable Integer id, @RequestParam(name = "alias") String alias) {
        return curation.removeAlias(id, alias);
    }
}
