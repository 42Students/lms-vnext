package com._42students.lms.service.company;

import com._42students.lms.model.CollegeCompany;
import com._42students.lms.model.Company;
import com._42students.lms.model.CompanyDomain;
import com._42students.lms.repository.CollegeCompanyRepository;
import com._42students.lms.repository.CompanyDomainRepository;
import com._42students.lms.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Finds or creates THE company for a domain (recruiter phase 1, P1-1 / N2-N4). Every path that attaches a person or a
 * drive to a company (recruiter invites, super admin, the TPO adding a company) goes through here, so a domain always maps
 * to one company and a verified-by-42 company always keeps its name.
 */
@Service
@RequiredArgsConstructor
public class CompanyDirectoryService {

    private final CompanyRepository companyRepository;
    private final CompanyDomainRepository domainRepository;
    private final CompanyDomainService domainService;
    private final CollegeCompanyRepository collegeCompanyRepository;
    private final CompanySearchService searchIndex;

    /** Who is adding a company, for added_by_* columns. */
    public record Actor(String userType, Integer userId, Integer collegeId) {
    }

    /** The live company that owns this domain, if any. */
    public Optional<Company> byDomain(String domain) {
        if (domain == null) return Optional.empty();
        return domainRepository.findByDomain(domain)
                .flatMap(d -> companyRepository.findById(d.getCompanyId()))
                .map(this::followMerge)
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()));
    }

    /**
     * The company for a work email: the one owning its domain, or a new one named {@code nameIfNew} (falling back to the
     * domain's first label). Refuses personal, disposable and academic addresses with words a person can act on.
     */
    @Transactional
    public Company forWorkEmail(String email, String nameIfNew, Actor actor) {
        CompanyDomainService.Check check = domainService.checkEmail(email);
        if (!check.ok()) throw new IllegalArgumentException(check.message());
        return forDomain(check.domain(), nameIfNew, actor);
    }

    @Transactional
    public Company forDomain(String domain, String nameIfNew, Actor actor) {
        Optional<Company> existing = byDomain(domain);
        if (existing.isPresent()) return existing.get();
        Company c = new Company();
        String name = nameIfNew == null || nameIfNew.isBlank() ? defaultName(domain) : nameIfNew.trim();
        c.setName(name.length() > 150 ? name.substring(0, 150) : name);
        c.setVerifiedBy42(false);
        c.setIsDeleted(false);
        if (actor != null) {
            c.setAddedByUserType(actor.userType());
            c.setAddedByUserId(actor.userId());
            c.setAddedByCollegeId(actor.collegeId());
        }
        c = companyRepository.save(c);
        CompanyDomain d = new CompanyDomain();
        d.setCompanyId(c.getId());
        d.setDomain(domain);
        d.setVerifiedBy42(false);
        if (actor != null) {
            d.setAddedByUserType(actor.userType());
            d.setAddedByUserId(actor.userId());
            d.setAddedByCollegeId(actor.collegeId());
        }
        try {
            domainRepository.saveAndFlush(d);
            return c;
        } catch (org.springframework.dao.DataIntegrityViolationException race) {
            // Someone added this domain a moment ago: theirs is the company. Ours is left unused and soft-deleted.
            c.setIsDeleted(true);
            companyRepository.save(c);
            return byDomain(domain).orElseThrow(() -> race);
        }
    }

    public java.util.List<Company> allLive() {
        return companyRepository.findAllLive();
    }

    /**
     * One search result: what the TPO's company picker shows. source: "42" (a company on 42's list) or "ENGAGE" (a name this college
     * already uses in Engage or on an old drive that was never added as a company: id is null and picking it starts "Add other").
     * reason: why it matched ("Also known as TCS", "Matched infosys.com", "Did you mean Infosys?"); fuzzy: a near spelling.
     */
    public record Found(Integer id, String name, String logoUrl, java.util.List<String> domains, boolean verifiedBy42, boolean inMyList,
                        String source, String reason, boolean fuzzy, int colleges) {
    }

    /**
     * Strong company search for the TPO's drive form (docs/companies/COMPANY-SEARCH-2026-10-13.md): an email or a website finds its
     * company directly; names match however they were typed (case, punctuation, legal suffixes, word order, spacing, typos,
     * acronyms, known short names, 42's aliases). Ranked: how well it matched, then verified by 42, this college's own, widely used.
     * Then names from this college's Engage contacts and old drives that were never added.
     */
    public java.util.List<Found> search(String q, Integer collegeId) {
        String text = q == null ? "" : q.trim();
        if (text.length() < 2) return java.util.List.of();
        if (text.length() > 100) text = text.substring(0, 100);
        Integer domainHit = null;
        if (text.contains("@") || text.contains(".")) {
            CompanyDomainService.Check c = text.contains("@") ? domainService.checkDomain(text.substring(text.lastIndexOf('@') + 1), false) : domainService.checkDomain(text, false);
            if (c.domain() != null) domainHit = byDomain(c.domain()).map(Company::getId).orElse(null);
        }
        java.util.Set<Integer> mine = new java.util.HashSet<>();
        if (collegeId != null) collegeCompanyRepository.findForCollege(collegeId, false).forEach(l -> mine.add(l.getCompanyId()));
        java.util.List<CompanySearchService.Hit> hits = searchIndex.search(text, domainHit, 40);
        // This college's own companies rank above others that matched as well.
        hits.sort((a, b) -> {
            int sa = a.score() + (mine.contains(a.id()) ? 4 : 0);
            int sb = b.score() + (mine.contains(b.id()) ? 4 : 0);
            return sa != sb ? Integer.compare(sb, sa) : a.name().compareToIgnoreCase(b.name());
        });
        java.util.List<Found> out = new java.util.ArrayList<>();
        for (CompanySearchService.Hit h : hits) {
            if (out.size() >= 20) break;
            out.add(new Found(h.id(), h.name(), h.logoUrl(), h.domains(), h.verifiedBy42(), mine.contains(h.id()), "42", h.reason(), h.fuzzy(), h.colleges()));
        }
        if (collegeId != null) {
            for (String name : searchIndex.engageNames(collegeId, text, 5)) {
                out.add(new Found(null, name, null, java.util.List.of(), false, true, "ENGAGE", "In your Engage contacts, not added yet", false, 0));
            }
        }
        return out;
    }

    /** "Add other" with a name that is certainly an existing company: the TPO is pointed at it instead of making a second one. */
    public static class SameCompanyException extends RuntimeException {
        private final Integer companyId;
        private final String companyName;

        public SameCompanyException(Integer companyId, String companyName) {
            super(companyName + " is already on 42's company list. Pick it instead, so each company is kept once.");
            this.companyId = companyId;
            this.companyName = companyName;
        }

        public Integer getCompanyId() { return companyId; }

        public String getCompanyName() { return companyName; }
    }

    /** What "Add other" resolved to: the company, whether it already existed, and whether its name is locked by 42. */
    public record Resolved(Company company, boolean existed, boolean nameLocked) {
    }

    /**
     * "Add other" (N3): the TPO typed a name and optionally a website and a recruiter email. Any company domain among them that
     * already belongs to a company means it IS that company (a verified one keeps its name); otherwise a new unverified company
     * is created. Every unowned company domain given is added (website and recruiter email may differ). A personal recruiter email is
     * fine as a contact but never names the company. The company joins this college's list.
     */
    @Transactional
    public Resolved resolveForCollege(String name, String website, String recruiterEmail, Integer collegeId, Actor actor) {
        return resolveForCollege(name, website, recruiterEmail, collegeId, actor, false);
    }

    /** checkSameName: refuse a new company whose name is certainly an existing one (SameCompanyException), unless the TPO says it isn't. */
    @Transactional
    public Resolved resolveForCollege(String name, String website, String recruiterEmail, Integer collegeId, Actor actor, boolean checkSameName) {
        java.util.LinkedHashSet<String> domains = new java.util.LinkedHashSet<>();
        if (website != null && !website.isBlank()) {
            CompanyDomainService.Check c = domainService.checkDomain(website, false);
            if (!c.ok()) throw new IllegalArgumentException("Website: " + c.message());
            domains.add(c.domain());
        }
        if (recruiterEmail != null && !recruiterEmail.isBlank()) {
            CompanyDomainService.Check c = domainService.checkEmail(recruiterEmail);
            if (c.outcome() == CompanyDomainService.Outcome.INVALID) throw new IllegalArgumentException("Recruiter email is not valid");
            if (c.ok()) domains.add(c.domain());
        }
        Company company = null;
        for (String d : domains) {
            Optional<Company> owned = byDomain(d);
            if (owned.isPresent()) { company = owned.get(); break; }
        }
        boolean existed = company != null;
        if (company == null) {
            if (name == null || name.isBlank()) throw new IllegalArgumentException("Add the company name");
            if (checkSameName) {
                CompanySearchService.Hit same = searchIndex.sameCompany(name);
                if (same != null) throw new SameCompanyException(same.id(), same.name());
            }
            if (domains.isEmpty()) {
                throw new IllegalArgumentException("Add the company's website or the recruiter's company email, so each company is kept once");
            }
            company = forDomain(domains.iterator().next(), name, actor);
        }
        for (String d : domains) {
            if (domainRepository.findByDomain(d).isPresent()) continue;
            CompanyDomain row = new CompanyDomain();
            row.setCompanyId(company.getId());
            row.setDomain(d);
            row.setVerifiedBy42(false);
            if (actor != null) { row.setAddedByUserType(actor.userType()); row.setAddedByUserId(actor.userId()); row.setAddedByCollegeId(actor.collegeId()); }
            try { domainRepository.saveAndFlush(row); } catch (org.springframework.dao.DataIntegrityViolationException ignored) { }
        }
        if (website != null && !website.isBlank() && company.getWebsite() == null && website.trim().startsWith("https://") && website.trim().length() <= 500) {
            company.setWebsite(website.trim());
            company = companyRepository.save(company);
        }
        ensureListed(collegeId, company.getId());
        if (!existed) searchIndex.invalidate(); // a new company is findable at once
        return new Resolved(company, existed, Boolean.TRUE.equals(company.getVerifiedBy42()));
    }

    /** Puts the company on this college's list (or back on it). */
    @Transactional
    public void ensureListed(Integer collegeId, Integer companyId) {
        if (collegeId == null || companyId == null) return;
        CollegeCompany link = collegeCompanyRepository.lockByCollegeAndCompany(collegeId, companyId).orElse(null);
        if (link == null) {
            link = new CollegeCompany();
            link.setCollegeId(collegeId);
            link.setCompanyId(companyId);
        } else if (!Boolean.TRUE.equals(link.getIsDeleted())) {
            return;
        }
        link.setIsDeleted(false);
        try { collegeCompanyRepository.saveAndFlush(link); } catch (org.springframework.dao.DataIntegrityViolationException ignored) { }
    }

    public Optional<Company> live(Integer companyId) {
        if (companyId == null) return Optional.empty();
        return companyRepository.findById(companyId).map(this::followMerge).filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()));
    }

    /** The company's email and web domains. */
    public java.util.List<String> domainsOf(Integer companyId) {
        if (companyId == null) return java.util.List.of();
        return domainRepository.findByCompanyIds(java.util.List.of(companyId)).stream().map(CompanyDomain::getDomain).toList();
    }

    /**
     * A placement cell gives a company its first email domain (companies from before domains existed have none). Only the
     * first: domains are shared by every college, so any further domain is added by 42. The domain must pass the
     * company-domain check and belong to no other company, and the company must be on the college's own list.
     */
    @Transactional
    public String addDomain(Integer companyId, String input, Actor actor) {
        Company c = live(companyId).orElseThrow(() -> new IllegalArgumentException("Company not found"));
        String raw = input == null ? "" : input.trim();
        CompanyDomainService.Check check = raw.contains("@") ? domainService.checkEmail(raw) : domainService.checkDomain(raw, true);
        if (!check.ok()) throw new IllegalArgumentException(check.message());
        Optional<Company> owner = byDomain(check.domain());
        if (owner.isPresent()) {
            if (owner.get().getId() == c.getId()) return check.domain();
            throw new IllegalArgumentException(check.domain() + " belongs to " + owner.get().getName() + ".");
        }
        if (!domainsOf(c.getId()).isEmpty()) {
            throw new IllegalArgumentException(c.getName() + " already has its email domain. Ask 42 to add " + check.domain() + ".");
        }
        if (actor != null && actor.collegeId() != null && collegeCompanyRepository.findByCollegeIdAndCompanyId(actor.collegeId(), c.getId())
                .map(l -> Boolean.TRUE.equals(l.getIsDeleted())).orElse(true)) {
            throw new IllegalArgumentException("Company not found");
        }
        CompanyDomain row = new CompanyDomain();
        row.setCompanyId(c.getId());
        row.setDomain(check.domain());
        row.setVerifiedBy42(false);
        if (actor != null) { row.setAddedByUserType(actor.userType()); row.setAddedByUserId(actor.userId()); row.setAddedByCollegeId(actor.collegeId()); }
        domainRepository.saveAndFlush(row);
        return check.domain();
    }

    /** The company's display name, or null. */
    public String nameOf(Integer companyId) {
        if (companyId == null) return null;
        return companyRepository.findById(companyId).map(this::followMerge)
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted())).map(Company::getName).orElse(null);
    }

    private Company followMerge(Company c) {
        if (c.getMergedIntoCompanyId() == null) return c;
        return companyRepository.findById(c.getMergedIntoCompanyId()).orElse(c);
    }

    /** "omega.co.in" becomes "Omega": a starting name only, the person can correct it. */
    static String defaultName(String domain) {
        String first = domain.contains(".") ? domain.substring(0, domain.indexOf('.')) : domain;
        return first.isEmpty() ? domain : Character.toUpperCase(first.charAt(0)) + first.substring(1);
    }
}
