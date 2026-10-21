package com._42students.lms.service.company;

import com._42students.lms.model.Company;
import com._42students.lms.model.CompanyDomain;
import com._42students.lms.repository.CompanyDomainRepository;
import com._42students.lms.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 42's curated company list (recruiter phase 1, N3), for super admin: see every company with its domains and who added it,
 * mark it verified by 42 (its name then wins everywhere), correct its shared details, add or remove domains, and merge a
 * duplicate into the right company. Jobs, recruiters and every college's private side move with a merge.
 */
@Service
@RequiredArgsConstructor
public class CompanyCurationService {

    private final CompanyRepository companyRepository;
    private final CompanyDomainRepository domainRepository;
    private final CompanyDomainService domainService;
    private final NamedParameterJdbcTemplate jdbc;
    private final CompanySearchService searchIndex;

    public Map<String, Object> list(String q, boolean onlyUnverified, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 100));
        int safePage = Math.max(0, page);
        String like = "%" + (q == null ? "" : q.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")) + "%";
        MapSqlParameterSource p = new MapSqlParameterSource("q", like).addValue("u", onlyUnverified).addValue("lim", safeSize).addValue("off", safePage * safeSize);
        String where = "WHERE (c.is_deleted = 0 OR c.is_deleted IS NULL) AND c.merged_into_company_id IS NULL "
                + "AND (LOWER(c.name) LIKE :q OR EXISTS (SELECT 1 FROM company_domain d WHERE d.company_id = c.id AND d.domain LIKE :q) "
                + "OR EXISTS (SELECT 1 FROM company_alias a WHERE a.company_id = c.id AND LOWER(a.alias) LIKE :q)) "
                + "AND (:u = 0 OR c.verified_by_42 = 0) ";
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT c.id, c.name, c.logo_url AS logoUrl, c.website, c.industry, c.verified_by_42 AS verifiedBy42, "
                + "c.added_by_user_type AS addedByUserType, c.added_by_college_id AS addedByCollegeId, col.name AS addedByCollege, c.created_at AS createdAt, "
                + "(SELECT GROUP_CONCAT(d.domain ORDER BY d.id SEPARATOR ',') FROM company_domain d WHERE d.company_id = c.id) AS domains, "
                + "(SELECT GROUP_CONCAT(a.alias ORDER BY a.alias SEPARATOR '\u0001') FROM company_alias a WHERE a.company_id = c.id) AS aliases, "
                + "(SELECT COUNT(*) FROM college_company cc WHERE cc.company_id = c.id AND cc.is_deleted = 0) AS colleges, "
                + "(SELECT COUNT(*) FROM job j WHERE j.company_id = c.id AND (j.is_deleted = 0 OR j.is_deleted IS NULL)) AS drives "
                + "FROM company c LEFT JOIN college col ON col.id = c.added_by_college_id " + where
                + "ORDER BY c.verified_by_42 ASC, c.created_at DESC LIMIT :lim OFFSET :off", p);
        for (Map<String, Object> r : rows) {
            Object d = r.get("domains");
            r.put("domains", d == null ? List.of() : List.of(String.valueOf(d).split(",")));
            Object a = r.get("aliases");
            r.put("aliases", a == null ? List.of() : List.of(String.valueOf(a).split("\u0001")));
        }
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM company c " + where, p, Long.class);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("total", total == null ? 0 : total);
        out.put("page", safePage);
        out.put("size", safeSize);
        return out;
    }

    @Transactional
    public Company setVerified(Integer companyId, boolean verified, Integer actorId) {
        Company c = live(companyId);
        c.setVerifiedBy42(verified);
        c.setVerifiedBy42At(verified ? LocalDateTime.now() : null);
        c.setVerifiedBy42UserId(verified ? actorId : null);
        jdbc.update("UPDATE company_domain SET verified_by_42 = :v WHERE company_id = :c", new MapSqlParameterSource("v", verified).addValue("c", companyId));
        Company saved = companyRepository.save(c);
        searchIndex.invalidate();
        return saved;
    }

    public static class Details {
        public String name;
        public String logoUrl;
        public String website;
        public String industry;
        public String description;
    }

    @Transactional
    public Company update(Integer companyId, Details in) {
        Company c = live(companyId);
        if (in.name != null) {
            String n = in.name.trim();
            if (n.length() < 2 || n.length() > 150) throw new IllegalArgumentException("Company name must be between 2 and 150 characters");
            c.setName(n);
        }
        if (in.logoUrl != null) c.setLogoUrl(httpsOrNull(in.logoUrl, "Logo URL"));
        if (in.website != null) c.setWebsite(httpsOrNull(in.website, "Website"));
        if (in.industry != null) c.setIndustry(in.industry.isBlank() ? null : in.industry.trim());
        if (in.description != null) c.setDescription(in.description.isBlank() ? null : in.description.trim());
        Company saved = companyRepository.save(c);
        // Every drive shows the shared name and logo.
        jdbc.update("UPDATE job SET company_name = :n, company_logo = :l WHERE company_id = :c",
                new MapSqlParameterSource("n", saved.getName()).addValue("l", saved.getLogoUrl()).addValue("c", companyId));
        searchIndex.invalidate();
        return saved;
    }

    @Transactional
    public List<String> addDomain(Integer companyId, String domainOrEmail) {
        Company c = live(companyId);
        CompanyDomainService.Check check = domainOrEmail != null && domainOrEmail.contains("@")
                ? domainService.checkEmail(domainOrEmail) : domainService.checkDomain(domainOrEmail, true);
        if (!check.ok()) throw new IllegalArgumentException(check.message());
        domainRepository.findByDomain(check.domain()).ifPresent(owner -> {
            if (!owner.getCompanyId().equals(companyId)) throw new IllegalArgumentException(check.domain() + " already belongs to another company. Merge them instead.");
        });
        if (domainRepository.findByDomain(check.domain()).isEmpty()) {
            CompanyDomain d = new CompanyDomain();
            d.setCompanyId(c.getId());
            d.setDomain(check.domain());
            d.setVerifiedBy42(Boolean.TRUE.equals(c.getVerifiedBy42()));
            d.setAddedByUserType("SUPER_ADMIN");
            domainRepository.save(d);
        }
        searchIndex.invalidate();
        return domainsOf(companyId);
    }

    @Transactional
    public List<String> removeDomain(Integer companyId, String domain) {
        live(companyId);
        CompanyDomain d = domainRepository.findByDomain(domain == null ? "" : domain.trim().toLowerCase(Locale.ROOT))
                .filter(x -> x.getCompanyId().equals(companyId))
                .orElseThrow(() -> new IllegalArgumentException("That domain is not on this company"));
        if (domainsOf(companyId).size() <= 1) throw new IllegalArgumentException("A company keeps at least one domain");
        domainRepository.delete(d);
        searchIndex.invalidate();
        return domainsOf(companyId);
    }

    /** Folds {@code fromId} into {@code intoId}: domains, drives, recruiters and every college's private side move. */
    @Transactional
    public Company merge(Integer fromId, Integer intoId) {
        if (fromId == null || fromId.equals(intoId)) throw new IllegalArgumentException("Pick two different companies");
        Company from = live(fromId);
        Company into = live(intoId);
        MapSqlParameterSource p = new MapSqlParameterSource("f", fromId).addValue("t", intoId);
        jdbc.update("UPDATE company_domain SET company_id = :t WHERE company_id = :f", p);
        jdbc.update("UPDATE job SET company_id = :t WHERE company_id = :f", p);
        jdbc.update("UPDATE recruiter SET company_id = :t WHERE company_id = :f", p);
        // A college that had both keeps the target's side and gets the other side's notes appended.
        jdbc.update("UPDATE college_company keep JOIN college_company gone ON gone.college_id = keep.college_id AND gone.company_id = :f "
                + "SET keep.internal_notes = TRIM(CONCAT(COALESCE(keep.internal_notes, ''), CASE WHEN gone.internal_notes IS NULL OR gone.internal_notes = '' THEN '' ELSE CONCAT('\\n', gone.internal_notes) END)), "
                + "keep.is_deleted = LEAST(keep.is_deleted, gone.is_deleted) WHERE keep.company_id = :t", p);
        jdbc.update("DELETE gone FROM college_company gone JOIN college_company keep ON keep.college_id = gone.college_id AND keep.company_id = :t WHERE gone.company_id = :f", p);
        jdbc.update("UPDATE college_company SET company_id = :t WHERE company_id = :f", p);
        jdbc.update("UPDATE job SET company_name = :n, company_logo = :l WHERE company_id = :t",
                new MapSqlParameterSource("n", into.getName()).addValue("l", into.getLogoUrl()).addValue("t", intoId));
        // The merged company's name and aliases become the target's aliases: searching the old name still finds it.
        jdbc.update("UPDATE IGNORE company_alias SET company_id = :t WHERE company_id = :f", p);
        jdbc.update("DELETE FROM company_alias WHERE company_id = :f", p);
        String fromKey = CompanySearchService.norm(from.getName());
        if (!fromKey.equals(CompanySearchService.norm(into.getName()))) {
            jdbc.update("INSERT IGNORE INTO company_alias (company_id, alias, alias_key) VALUES (:t, :a, :k)",
                    new MapSqlParameterSource("t", intoId).addValue("a", from.getName()).addValue("k", fromKey));
        }
        from.setMergedIntoCompanyId(intoId);
        from.setIsDeleted(true);
        companyRepository.save(from);
        searchIndex.invalidate();
        return into;
    }

    // ---------------------------------------------------------------- aliases (strong company search)

    public List<String> aliasesOf(Integer companyId) {
        return jdbc.queryForList("SELECT alias FROM company_alias WHERE company_id = :c ORDER BY alias", new MapSqlParameterSource("c", companyId), String.class);
    }

    /**
     * Another name the company goes by ("TCS", "Cognizant Technology Solutions"): the search finds the company by it. Refused when it
     * is the company's own name, or another company's name or alias (that would make one search point at two companies).
     */
    @Transactional
    public List<String> addAlias(Integer companyId, String alias, Integer actorId) {
        Company c = live(companyId);
        String a = alias == null ? "" : alias.trim().replaceAll("\\s+", " ");
        if (a.length() < 2 || a.length() > 150) throw new IllegalArgumentException("An alias needs 2 to 150 characters");
        String key = CompanySearchService.norm(a);
        if (key.isBlank()) throw new IllegalArgumentException("Type letters or numbers");
        if (key.equals(CompanySearchService.norm(c.getName()))) throw new IllegalArgumentException("That is already the company's name");
        List<String> other = jdbc.queryForList("SELECT c.name FROM company_alias a JOIN company c ON c.id = a.company_id WHERE a.alias_key = :k AND a.company_id <> :id " +
                "AND (c.is_deleted = 0 OR c.is_deleted IS NULL)", new MapSqlParameterSource("k", key).addValue("id", companyId), String.class);
        if (!other.isEmpty()) throw new IllegalArgumentException("\"" + a + "\" is already an alias of " + other.get(0).replaceAll("\\.+$", ""));
        for (Company x : companyRepository.findAllLive()) {
            if (x.getId() != companyId.intValue() && CompanySearchService.norm(x.getName()).equals(key)) throw new IllegalArgumentException("\"" + a + "\" is the name of another company, " + x.getName().replaceAll("\\.+$", "") + ". Merge them instead.");
        }
        jdbc.update("INSERT IGNORE INTO company_alias (company_id, alias, alias_key, created_by_user_id) VALUES (:c, :a, :k, :u)",
                new MapSqlParameterSource("c", companyId).addValue("a", a).addValue("k", key).addValue("u", actorId));
        searchIndex.invalidate();
        return aliasesOf(companyId);
    }

    @Transactional
    public List<String> removeAlias(Integer companyId, String alias) {
        live(companyId);
        jdbc.update("DELETE FROM company_alias WHERE company_id = :c AND (alias = :a OR alias_key = :k)",
                new MapSqlParameterSource("c", companyId).addValue("a", alias == null ? "" : alias.trim()).addValue("k", CompanySearchService.norm(alias)));
        searchIndex.invalidate();
        return aliasesOf(companyId);
    }

    public List<String> domainsOf(Integer companyId) {
        List<String> out = new ArrayList<>();
        domainRepository.findByCompanyIdOrderByIdAsc(companyId).forEach(d -> out.add(d.getDomain()));
        return out;
    }

    private Company live(Integer companyId) {
        Company c = companyRepository.findById(companyId == null ? -1 : companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        if (Boolean.TRUE.equals(c.getIsDeleted()) || c.getMergedIntoCompanyId() != null) throw new IllegalArgumentException("Company not found");
        return c;
    }

    private static String httpsOrNull(String url, String label) {
        if (url == null || url.isBlank()) return null;
        String t = url.trim();
        if (!t.startsWith("https://") || t.length() > 500) throw new IllegalArgumentException(label + " must be a valid https link");
        return t;
    }
}
