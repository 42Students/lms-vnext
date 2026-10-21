package com._42students.lms.service.impl;

import com._42students.lms.model.CollegeCompany;
import com._42students.lms.model.Company;
import com._42students.lms.model.CompanyDomain;
import com._42students.lms.model.Job;
import com._42students.lms.repository.CollegeCompanyRepository;
import com._42students.lms.repository.CompanyDomainRepository;
import com._42students.lms.repository.CompanyRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.service.CompanyService;
import com._42students.lms.service.company.CompanyDomainService;
import com._42students.lms.util.TextSanitizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * A college's company list (admin Companies page, superadmin job form). Recruiter phase 1, design L1 / P1-1 / N2-N3:
 * there is ONE company per real company, identified by its domain(s) in {@code company_domain}; each college keeps its own
 * private side in {@code college_company} (notes, contacts, removed-from-our-list). Responses are detached copies that
 * merge the shared company with this college's private side, so nothing a college sends ever lands on another college.
 *
 * Shared fields (name, logo, website, industry, description) change only when the company is not on 42's verified list and
 * this college added it (or a super admin is acting). A company on 42's list keeps 42's name.
 */
@Slf4j
@Service
public class CompanyServiceImpl implements CompanyService {

    // Company create/update/delete/restore wrote no admin audit trail, even though a rename
    // propagates into every linked job's denormalized companyName. required=false keeps these
    // optional for unit tests that construct the service directly.
    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService auditLogService;

    @Autowired(required = false)
    private javax.servlet.http.HttpServletRequest httpRequest;

    private void auditCompany(String actionKey, Object companyId, Integer collegeId,
                              java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        auditLogService.log(httpRequest, actionKey, "company", String.valueOf(companyId),
                null, collegeId, payload != null ? payload : java.util.Map.of());
    }

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CollegeCompanyRepository collegeCompanyRepository;

    @Autowired
    private CompanyDomainRepository companyDomainRepository;

    @Autowired
    private CompanyDomainService companyDomainService;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    // updateCompany is a partial update, so it can't be guarded with @Valid on the whole
    // Company body. Enforce the DB-column length caps here for the fields actually being written.
    private void requireMaxLength(String value, int max, String fieldName) {
        if (value != null && value.length() > max) {
            throw new IllegalArgumentException(fieldName + " must be at most " + max + " characters");
        }
    }

    // ---------------------------------------------------------------- reading

    @Override
    public List<Company> getAllCompaniesWithStats(Integer collegeId, boolean includeDeleted) {
        List<CollegeCompany> links = collegeCompanyRepository.findForCollege(collegeId, includeDeleted);
        if (links.isEmpty()) return new ArrayList<>();
        Map<Integer, Company> shared = companyRepository.findAllById(links.stream().map(CollegeCompany::getCompanyId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Company::getId, Function.identity()));
        Map<Integer, List<String>> domains = domainsOf(shared.keySet());
        List<Company> out = new ArrayList<>();
        for (CollegeCompany link : links) {
            Company c = shared.get(link.getCompanyId());
            if (c == null || c.getMergedIntoCompanyId() != null) continue;
            if (Boolean.TRUE.equals(c.getIsDeleted()) && !includeDeleted) continue;
            out.add(view(c, link, domains.getOrDefault(c.getId(), List.of())));
        }
        out.sort((a, b) -> String.valueOf(a.getName()).compareToIgnoreCase(String.valueOf(b.getName())));
        Map<Integer, Company> byId = out.stream().collect(Collectors.toMap(Company::getId, c -> c, (a, b) -> a));
        for (Object[] row : jobRepository.countAndLastActiveByCompanyIdsForCollege(new ArrayList<>(byId.keySet()), collegeId)) {
            if (row == null || row[0] == null) continue;
            Company company = byId.get((Integer) row[0]);
            if (company == null) continue;
            company.setDriveCount(row[1] != null ? ((Number) row[1]).longValue() : 0L);
            company.setLastActiveAt((java.time.LocalDateTime) row[2]);
        }
        out.forEach(c -> { if (c.getDriveCount() == null) c.setDriveCount(0L); });
        return out;
    }

    @Override
    public Company getCompanyById(Integer companyId, Integer collegeId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + companyId));
        CollegeCompany link = requireLiveLink(company, collegeId);
        return view(company, link, domainsOf(Set.of(companyId)).getOrDefault(companyId, List.of()));
    }

    private CollegeCompany requireLiveLink(Company company, Integer collegeId) {
        CollegeCompany link = collegeCompanyRepository.findByCollegeIdAndCompanyId(collegeId, company.getId())
                .orElseThrow(() -> new IllegalArgumentException("Company does not belong to the specified college"));
        if (Boolean.TRUE.equals(link.getIsDeleted()) || Boolean.TRUE.equals(company.getIsDeleted())) {
            throw new IllegalArgumentException("Company has been deleted");
        }
        return link;
    }

    // ---------------------------------------------------------------- creating

    @Override
    @Transactional
    public Company createCompany(Company company, Integer collegeId) {
        if (company == null || company.getName() == null || company.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Company name is required");
        }
        String name = TextSanitizer.sanitizeText(company.getName().trim());
        requireMaxLength(name, 150, "Company name");
        Set<String> candidateDomains = domainsFrom(company);
        if (candidateDomains.isEmpty()) {
            throw new IllegalArgumentException("Add the company's website or a company email, so each company is kept once");
        }

        // An existing company owns one of these domains: that is this company (P1-1). Its name wins when 42 verified it.
        Company target = null;
        for (String d : candidateDomains) {
            Optional<CompanyDomain> owned = companyDomainRepository.findByDomain(d);
            if (owned.isPresent()) {
                target = companyRepository.lockById(owned.get().getCompanyId()).orElse(null);
                if (target != null) break;
            }
        }
        boolean created = false;
        if (target == null) {
            target = new Company();
            target.setName(name);
            target.setLogoUrl(sanitizeOptionalUrl(company.getLogoUrl(), "Logo URL"));
            target.setWebsite(sanitizeOptionalUrl(company.getWebsite(), "Website"));
            String industry = nullToEmpty(company.getIndustry());
            requireMaxLength(industry, 100, "Industry");
            target.setIndustry(industry);
            String description = nullToEmpty(company.getDescription());
            requireMaxLength(description, 2000, "Description");
            target.setDescription(description);
            target.setAddedByCollegeId(collegeId);
            target.setAddedByUserType("COLLEGE");
            target.setVerifiedBy42(false);
            target.setIsDeleted(false);
            target = companyRepository.save(target);
            created = true;
        }
        addDomains(target.getId(), candidateDomains, collegeId);

        CollegeCompany link = collegeCompanyRepository.lockByCollegeAndCompany(collegeId, target.getId()).orElse(null);
        if (link != null && !Boolean.TRUE.equals(link.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "\"" + target.getName() + "\" is already in your company list.");
        }
        if (link == null) {
            link = new CollegeCompany();
            link.setCollegeId(collegeId);
            link.setCompanyId(target.getId());
        }
        link.setIsDeleted(false);
        applyPrivateFields(link, company);
        collegeCompanyRepository.save(link);

        auditCompany("COMPANY_CREATE", target.getId(), collegeId, java.util.Map.of("name", target.getName(), "newCompany", created));
        Company out = view(target, link, domainsOf(Set.of(target.getId())).getOrDefault(target.getId(), List.of()));
        out.setDriveCount(0L);
        out.setLastActiveAt(null);
        if (!created) populateStats(out, collegeId);
        return out;
    }

    /** Domains named by the request: explicit domains, the website, the contact email. Each must be a company domain. */
    private Set<String> domainsFrom(Company company) {
        Set<String> out = new LinkedHashSet<>();
        if (company.getDomains() != null) {
            for (String d : company.getDomains()) {
                if (d == null || d.isBlank()) continue;
                out.add(requireCompanyDomain(companyDomainService.checkDomain(d, true)));
            }
        }
        if (company.getWebsite() != null && !company.getWebsite().isBlank()) {
            out.add(requireCompanyDomain(companyDomainService.checkDomain(company.getWebsite(), false)));
        }
        if (company.getContactEmail() != null && !company.getContactEmail().isBlank()) {
            CompanyDomainService.Check c = companyDomainService.checkEmail(company.getContactEmail());
            // A personal contact email is allowed as a contact; it just never names the company.
            if (c.ok()) out.add(c.domain());
            else if (c.outcome() == CompanyDomainService.Outcome.INVALID) throw new IllegalArgumentException("Contact email is not valid");
        }
        return out;
    }

    private static String requireCompanyDomain(CompanyDomainService.Check c) {
        if (!c.ok()) throw new IllegalArgumentException(c.message());
        return c.domain();
    }

    /** Adds the domains nobody owns yet to this company; a domain owned by another company is left with that company. */
    private void addDomains(Integer companyId, Set<String> domains, Integer collegeId) {
        for (String d : domains) {
            if (companyDomainRepository.findByDomain(d).isPresent()) continue;
            CompanyDomain row = new CompanyDomain();
            row.setCompanyId(companyId);
            row.setDomain(d);
            row.setVerifiedBy42(false);
            row.setAddedByCollegeId(collegeId);
            row.setAddedByUserType("COLLEGE");
            try {
                companyDomainRepository.saveAndFlush(row);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // Another request added the same domain a moment ago: one domain, one company. Keep theirs.
                log.info("Domain {} was added concurrently; keeping the existing owner", d);
            }
        }
    }

    // ---------------------------------------------------------------- updating

    @Override
    @Transactional
    public Company updateCompany(Integer companyId, Company company, Integer collegeId, boolean callerIsSuperAdmin) {
        // PESSIMISTIC_WRITE: serializes against applyCompanyLink (job services) and deleteCompany, so a rename and the
        // linked-jobs resync below always see each other's committed state.
        Company existing = companyRepository.lockById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + companyId));
        CollegeCompany link = requireLiveLink(existing, collegeId);
        boolean mayEditShared = callerIsSuperAdmin
                || (!Boolean.TRUE.equals(existing.getVerifiedBy42()) && Objects.equals(existing.getAddedByCollegeId(), collegeId));

        boolean sharedChanged = false;
        if (company.getName() != null && !company.getName().trim().isEmpty()) {
            String newName = TextSanitizer.sanitizeText(company.getName().trim());
            requireMaxLength(newName, 150, "Company name");
            if (!newName.equals(existing.getName())) {
                requireMayEditShared(mayEditShared, existing);
                existing.setName(newName);
                sharedChanged = true;
            }
        }
        if (company.getLogoUrl() != null) {
            String v = sanitizeOptionalUrl(company.getLogoUrl(), "Logo URL");
            if (!Objects.equals(v, existing.getLogoUrl())) { requireMayEditShared(mayEditShared, existing); existing.setLogoUrl(v); sharedChanged = true; }
        }
        if (company.getWebsite() != null) {
            String v = sanitizeOptionalUrl(company.getWebsite(), "Website");
            if (!Objects.equals(v, existing.getWebsite())) {
                requireMayEditShared(mayEditShared, existing);
                if (v != null) addDomains(existing.getId(), Set.of(requireCompanyDomain(companyDomainService.checkDomain(v, false))), collegeId);
                existing.setWebsite(v);
                sharedChanged = true;
            }
        }
        if (company.getIndustry() != null) {
            String v = nullToEmpty(company.getIndustry());
            requireMaxLength(v, 100, "Industry");
            if (!Objects.equals(v, existing.getIndustry())) { requireMayEditShared(mayEditShared, existing); existing.setIndustry(v); sharedChanged = true; }
        }
        if (company.getDescription() != null) {
            String v = nullToEmpty(company.getDescription());
            requireMaxLength(v, 2000, "Description");
            if (!Objects.equals(v, existing.getDescription())) { requireMayEditShared(mayEditShared, existing); existing.setDescription(v); sharedChanged = true; }
        }
        applyPrivateFields(link, company);
        collegeCompanyRepository.save(link);

        Company saved = sharedChanged ? companyRepository.save(existing) : existing;
        auditCompany("COMPANY_UPDATE", saved.getId(), collegeId, java.util.Map.of("name", String.valueOf(saved.getName())));
        if (sharedChanged) {
            // Every linked job (any college) shows the shared name and logo, so keep their denormalized copies in step.
            List<Job> linkedJobs = jobRepository.findByCompanyIdOrLegacyName(saved.getId(), null);
            for (Job job : linkedJobs) {
                if (job.getCompanyId() == null || !job.getCompanyId().equals(saved.getId())) continue;
                job.setCompanyName(saved.getName());
                job.setCompanyLogo(saved.getLogoUrl());
            }
            if (!linkedJobs.isEmpty()) jobRepository.saveAll(linkedJobs);
        }
        Company out = view(saved, link, domainsOf(Set.of(saved.getId())).getOrDefault(saved.getId(), List.of()));
        populateStats(out, collegeId);
        return out;
    }

    private static void requireMayEditShared(boolean allowed, Company company) {
        if (allowed) return;
        if (Boolean.TRUE.equals(company.getVerifiedBy42())) {
            throw new IllegalArgumentException("This company is verified by 42; its name, logo and details are kept by 42.");
        }
        throw new IllegalArgumentException("This company is shared across colleges; its name, logo and details can be changed by the college that added it.");
    }

    private void applyPrivateFields(CollegeCompany link, Company in) {
        if (in.getContactPersonName() != null) {
            String v = nullToEmpty(in.getContactPersonName());
            requireMaxLength(v, 150, "Contact person name");
            link.setContactPersonName(v);
        }
        if (in.getContactEmail() != null) {
            String v = nullToEmpty(in.getContactEmail());
            requireMaxLength(v, 150, "Contact email");
            link.setContactEmail(v);
        }
        if (in.getContactPhone() != null) {
            String v = nullToEmpty(in.getContactPhone());
            requireMaxLength(v, 30, "Contact phone");
            link.setContactPhone(v);
        }
        if (in.getInternalNotes() != null) {
            String v = nullToEmpty(in.getInternalNotes());
            requireMaxLength(v, 2000, "Internal notes");
            link.setInternalNotes(v);
        }
    }

    // ---------------------------------------------------------------- removing from / restoring to a college's list

    @Override
    @Transactional
    public void deleteCompany(Integer companyId, Integer collegeId, boolean callerIsSuperAdmin) {
        // Same lock applyCompanyLink takes, so a job can't be linked between the check below and the removal.
        Company company = companyRepository.lockById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + companyId));
        CollegeCompany link = requireLiveLink(company, collegeId);
        long activeJobs = jobRepository.findByCompanyIdOrLegacyName(companyId, null).stream()
                .filter(j -> j.getCompanyId() != null && j.getCompanyId().equals(companyId))
                .filter(j -> Objects.equals(j.getCollegeId(), collegeId))
                .filter(j -> !Boolean.TRUE.equals(j.getIsDeleted()))
                .count();
        if (activeJobs > 0) {
            throw new IllegalArgumentException("This company has " + activeJobs + " job posting(s) linked to it. Unlink or delete those jobs first.");
        }
        // Removed from THIS college's list only; the company and other colleges' sides are untouched.
        link.setIsDeleted(true);
        collegeCompanyRepository.save(link);
        auditCompany("COMPANY_DELETE", companyId, collegeId, java.util.Map.of());
    }

    @Override
    @Transactional
    public Company restoreCompany(Integer companyId, Integer collegeId, boolean callerIsSuperAdmin) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + companyId));
        if (Boolean.TRUE.equals(company.getIsDeleted()) || company.getMergedIntoCompanyId() != null) {
            throw new IllegalArgumentException("This company no longer exists; add it again from its website or email.");
        }
        CollegeCompany link = collegeCompanyRepository.lockByCollegeAndCompany(collegeId, companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company does not belong to the specified college"));
        link.setIsDeleted(false);
        collegeCompanyRepository.save(link);
        auditCompany("COMPANY_RESTORE", companyId, collegeId, java.util.Map.of());
        Company out = view(company, link, domainsOf(Set.of(companyId)).getOrDefault(companyId, List.of()));
        populateStats(out, collegeId);
        return out;
    }

    // ---------------------------------------------------------------- jobs and stats (this college's only)

    @Override
    public List<Job> getJobsForCompany(Integer companyId, Integer collegeId) {
        getCompanyById(companyId, collegeId);
        // Strictly this college's jobs linked by companyId: the company is shared, its other colleges' drives never show here.
        List<Job> jobs = jobRepository.findByCompanyIdOrLegacyName(companyId, null).stream()
                .filter(j -> j.getCompanyId() != null && j.getCompanyId().equals(companyId))
                .filter(j -> Objects.equals(j.getCollegeId(), collegeId))
                .collect(Collectors.toList());
        Map<Integer, Long> counts = new HashMap<>();
        List<Integer> jobIds = jobs.stream().map(Job::getId).collect(Collectors.toList());
        if (!jobIds.isEmpty()) {
            for (Object[] row : jobApplicationRepository.countByJobIds(jobIds)) {
                if (row == null || row.length < 2 || row[0] == null || row[1] == null) continue;
                counts.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }
        }
        for (Job job : jobs) {
            long count = counts.getOrDefault(job.getId(), 0L);
            job.setApplicationCount(count);
            job.setApplicantCount(count);
        }
        return jobs;
    }

    @Override
    public Map<String, Object> getCompanyStats(Integer companyId, Integer collegeId) {
        List<Job> jobs = getJobsForCompany(companyId, collegeId);
        List<Integer> jobIds = jobs.stream().map(Job::getId).collect(Collectors.toList());
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDrives", jobs.size());
        long totalApplications = jobs.stream().mapToLong(j -> j.getApplicationCount() != null ? j.getApplicationCount() : 0L).sum();
        stats.put("totalApplications", totalApplications);
        long totalHired = 0L;
        if (!jobIds.isEmpty()) {
            totalHired = jobApplicationRepository.countHiredByJobIds(jobIds);
        }
        stats.put("totalHired", totalHired);
        return stats;
    }

    // ---------------------------------------------------------------- helpers

    private void populateStats(Company company, Integer collegeId) {
        company.setDriveCount(0L);
        company.setLastActiveAt(null);
        for (Object[] row : jobRepository.countAndLastActiveByCompanyIdsForCollege(List.of(company.getId()), collegeId)) {
            if (row == null || row[0] == null) continue;
            company.setDriveCount(row[1] != null ? ((Number) row[1]).longValue() : 0L);
            company.setLastActiveAt((java.time.LocalDateTime) row[2]);
        }
    }

    private Map<Integer, List<String>> domainsOf(Set<Integer> companyIds) {
        Map<Integer, List<String>> out = new HashMap<>();
        if (companyIds.isEmpty()) return out;
        for (CompanyDomain d : companyDomainRepository.findByCompanyIds(companyIds)) {
            out.computeIfAbsent(d.getCompanyId(), k -> new ArrayList<>()).add(d.getDomain());
        }
        return out;
    }

    /**
     * A detached copy: the shared company merged with this college's private side. Never the managed entity, so setting the
     * private fields (transient on Company) or this college's deleted flag can never be flushed onto the shared row.
     */
    private static Company view(Company c, CollegeCompany link, List<String> domains) {
        Company v = new Company();
        v.setId(c.getId());
        v.setName(c.getName());
        v.setLogoUrl(c.getLogoUrl());
        v.setWebsite(c.getWebsite());
        v.setIndustry(c.getIndustry());
        v.setDescription(c.getDescription());
        v.setCollegeId(link.getCollegeId());
        v.setOrganizationId(c.getOrganizationId());
        v.setAddedByUserId(c.getAddedByUserId());
        v.setAddedByUserType(c.getAddedByUserType());
        v.setAddedByCollegeId(c.getAddedByCollegeId());
        v.setVerifiedBy42(c.getVerifiedBy42());
        v.setVerifiedBy42At(c.getVerifiedBy42At());
        v.setCreatedAt(c.getCreatedAt());
        v.setUpdatedAt(c.getUpdatedAt());
        v.setIsDeleted(Boolean.TRUE.equals(link.getIsDeleted()) || Boolean.TRUE.equals(c.getIsDeleted()));
        v.setContactPersonName(link.getContactPersonName());
        v.setContactEmail(link.getContactEmail());
        v.setContactPhone(link.getContactPhone());
        v.setInternalNotes(link.getInternalNotes());
        v.setDomains(domains);
        return v;
    }

    private static String nullToEmpty(String s) {
        return s == null ? null : (s.trim().isEmpty() ? null : TextSanitizer.sanitizeText(s.trim()));
    }

    private static String sanitizeOptionalUrl(String url, String fieldLabel) {
        if (url == null || url.trim().isEmpty()) return null;
        String trimmed = url.trim();
        // Company website/logo URLs are rendered as outbound links to students: https only.
        if (!trimmed.matches("^https://.+")) {
            throw new IllegalArgumentException(fieldLabel + " must be a valid https link");
        }
        if (trimmed.length() > 500) {
            throw new IllegalArgumentException(fieldLabel + " must be at most 500 characters");
        }
        return trimmed;
    }
}
