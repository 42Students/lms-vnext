package com._42students.lms.service;

import com._42students.lms.model.AppSetting;
import com._42students.lms.model.Learner;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model._Class;
import com._42students.lms.repository.AppSettingRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Resolves a module's on/off state for a subject by walking the academic hierarchy.
 *
 * <h3>The chain</h3>
 * <pre>LEARNER → CLASS → BATCH → PROGRAM → DEPARTMENT → COLLEGE → ORGANIZATION → GLOBAL</pre>
 * Narrowest first. CLASS is narrower than BATCH (a batch is a cohort within a program; a class is a
 * section within that batch — see {@code _Class.batchId}).
 *
 * <h3>Precedence</h3>
 * Most-specific-wins: the narrowest level with an explicitly stored value decides, and everything
 * broader is ignored. Nothing stored anywhere means enabled — the same opt-out-not-opt-in default
 * the college-only flags have always used, which is what makes this whole change behaviour-neutral
 * until someone actually sets a value at one of the new levels.
 *
 * <p><b>Locks override that.</b> A level may mark its value final ({@code module.x.locked=true}),
 * in which case no narrower level can override it — checked broadest-first, before the normal
 * ladder. This exists so a college-admin cannot re-enable at PROGRAM level something a super-admin
 * turned off at COLLEGE level. See MODULE-ACCESS-HIERARCHY-PLAN-2026-09-06.md §2.2.
 *
 * <h3>Non-learners</h3>
 * Faculty, mentors and admins resolve at COLLEGE → ORGANIZATION → GLOBAL only — exactly today's
 * behaviour. They have no class/batch/program membership in this sense, and the existing
 * admin-facing {@code requireEnabled} call sites must not change meaning.
 *
 * <h3>A trap worth naming</h3>
 * {@code Learner.department} is a free-text String, not a foreign key, and must never be used for
 * resolution — it cannot be relied on to match a real department row. DEPARTMENT is resolved via
 * {@code programId → new_program.deptId}.
 */
@Service
@Slf4j
public class ModuleAccessResolver {

    /** Narrowest → broadest. Iteration order of this list *is* the precedence ladder. */
    public static final List<String> LEVELS_NARROWEST_FIRST = List.of(
            "LEARNER", "CLASS", "BATCH", "PROGRAM", "DEPARTMENT", "COLLEGE", "ORGANIZATION", "GLOBAL");

    private final AppSettingRepository appSettingRepository;
    private final LearnerRepository learnerRepository;
    private final _ClassRepository classRepository;
    private final NewProgramRepository newProgramRepository;
    private final com._42students.lms.repository.BatchRepository batchRepository;
    private final com._42students.lms.repository.DepartmentRepository departmentRepository;
    private final com._42students.lms.repository.CollegeRepository collegeRepository;

    public ModuleAccessResolver(AppSettingRepository appSettingRepository,
                                LearnerRepository learnerRepository,
                                _ClassRepository classRepository,
                                NewProgramRepository newProgramRepository,
                                com._42students.lms.repository.BatchRepository batchRepository,
                                com._42students.lms.repository.DepartmentRepository departmentRepository,
                                com._42students.lms.repository.CollegeRepository collegeRepository) {
        this.appSettingRepository = appSettingRepository;
        this.learnerRepository = learnerRepository;
        this.classRepository = classRepository;
        this.newProgramRepository = newProgramRepository;
        this.batchRepository = batchRepository;
        this.departmentRepository = departmentRepository;
        this.collegeRepository = collegeRepository;
    }

    /** One link in a resolution chain. {@code scopeId} is null only for GLOBAL. */
    public static final class ScopeRef {
        public final String scopeType;
        public final Integer scopeId;

        public ScopeRef(String scopeType, Integer scopeId) {
            this.scopeType = scopeType;
            this.scopeId = scopeId;
        }
    }

    /** The answer, plus where it came from — the explain view depends on this, so it is not a separate path. */
    public static final class Resolution {
        public final boolean enabled;
        public final String level;
        public final Integer scopeId;
        public final boolean locked;

        public Resolution(boolean enabled, String level, Integer scopeId, boolean locked) {
            this.enabled = enabled;
            this.level = level;
            this.scopeId = scopeId;
            this.locked = locked;
        }
    }

    /**
     * Where a chain builder gets each node's parent from.
     *
     * <p>This interface exists so the same walk serves both callers: the enforcement paths look
     * parents up in the database, while the admin grid — which resolves ~250 nodes at once and
     * cannot afford a query per node — supplies maps it has already fetched in bulk. Before this,
     * the grid had its own copy of the walk, and the two drifted: the grid dropped BATCH whenever
     * the batch wasn't in its own fetched list, and took PROGRAM from the batch rather than the
     * class. The result was a grid that could show ON while the student was actually blocked, with
     * no row visible anywhere to explain it. One implementation, two parent sources.
     */
    public interface AncestorSource {
        /** {batchId, programId} for a class; either may be null. Null if the class is unknown. */
        Integer[] classParents(Integer classId);
        Integer batchProgram(Integer batchId);
        Integer programDepartment(Integer programId);
        Integer departmentCollege(Integer departmentId);
        Integer collegeOrganization(Integer collegeId);
    }

    /** Parent lookups straight from the database — used by every enforcement path. */
    public AncestorSource dbAncestors() {
        return new AncestorSource() {
            @Override public Integer[] classParents(Integer classId) {
                _Class klass = classId == null ? null : classRepository.findByIdAndNotDeleted(classId).orElse(null);
                if (klass == null) return null;
                return new Integer[] { klass.getBatchId(), klass.getProgramId() > 0 ? klass.getProgramId() : null };
            }
            @Override public Integer batchProgram(Integer batchId) {
                return batchId == null ? null : batchRepository.findById(batchId.longValue())
                        .map(b -> b.getProgramId() == null ? null : b.getProgramId().intValue()).orElse(null);
            }
            @Override public Integer programDepartment(Integer programId) {
                return programId == null ? null : newProgramRepository.findById(programId)
                        .map(NewProgram::getDeptId).filter(id -> id > 0).orElse(null);
            }
            @Override public Integer departmentCollege(Integer departmentId) {
                return departmentId == null ? null : departmentRepository.findById(departmentId)
                        .map(d -> d.getCollegeId()).filter(id -> id > 0).orElse(null);
            }
            @Override public Integer collegeOrganization(Integer collegeId) {
                return collegeId == null ? null : collegeRepository.findById(collegeId)
                        .map(c -> c.getOrgId()).orElse(null);
            }
        };
    }

    /**
     * The one chain walk. Every builder goes through here so they cannot disagree.
     *
     * <p>Missing links are skipped rather than guessed — a learner with no class still resolves
     * through program/college/org. Two precedence rules are deliberate:
     * <ul>
     *   <li>A class's own {@code programId} beats a learner's, which goes stale when they move
     *       class.</li>
     *   <li>ORGANIZATION is always derived from the college row, never taken from the caller's
     *       column or token claim. {@code learner.organization_id} is NULL for anyone created
     *       before org scoping, and faculty created through the ordinary admin flow never get it
     *       set at all — so trusting it meant an org-level (even locked) OFF simply did not apply
     *       to them, while the admin console showed it as locked and in force.</li>
     * </ul>
     */
    private List<ScopeRef> buildChain(Integer learnerId, Integer classId, Integer batchId, Integer programId,
                                      Integer deptId, Integer collegeId, Integer orgId, AncestorSource src) {
        List<ScopeRef> chain = new ArrayList<>();
        if (learnerId != null) {
            chain.add(new ScopeRef("LEARNER", learnerId));
        }
        if (classId != null) {
            chain.add(new ScopeRef("CLASS", classId));
            Integer[] parents = src.classParents(classId);
            if (parents != null) {
                if (batchId == null) batchId = parents[0];
                if (parents[1] != null) programId = parents[1];
            }
        }
        if (batchId != null) {
            // Unconditional. The grid used to add this only when the batch was in its own fetched
            // list, so a class pointing at a deleted or foreign batch silently lost the level here
            // while enforcement kept it.
            chain.add(new ScopeRef("BATCH", batchId));
            if (programId == null) programId = src.batchProgram(batchId);
        }
        if (programId != null && programId > 0) {
            chain.add(new ScopeRef("PROGRAM", programId));
            if (deptId == null) deptId = src.programDepartment(programId);
        }
        if (deptId != null && deptId > 0) {
            chain.add(new ScopeRef("DEPARTMENT", deptId));
            if (collegeId == null) collegeId = src.departmentCollege(deptId);
        }
        if (collegeId != null) {
            chain.add(new ScopeRef("COLLEGE", collegeId));
            Integer derivedOrg = src.collegeOrganization(collegeId);
            if (derivedOrg != null) orgId = derivedOrg;
        }
        if (orgId != null) {
            chain.add(new ScopeRef("ORGANIZATION", orgId));
        }
        chain.add(new ScopeRef("GLOBAL", null));
        return chain;
    }

    /** Public entry point for the admin grid, which supplies its own bulk-fetched parent maps. */
    public List<ScopeRef> chainForNode(String scopeType, Integer scopeId, Integer classBatchId,
                                       Integer classProgramId, Integer collegeId, AncestorSource src) {
        String type = scopeType == null ? "GLOBAL" : scopeType.trim().toUpperCase(Locale.ROOT);
        return switch (type) {
            case "CLASS" -> buildChain(null, scopeId, classBatchId, classProgramId, null, collegeId, null, src);
            case "BATCH" -> buildChain(null, null, scopeId, null, null, collegeId, null, src);
            case "PROGRAM" -> buildChain(null, null, null, scopeId, null, collegeId, null, src);
            case "DEPARTMENT" -> buildChain(null, null, null, null, scopeId, collegeId, null, src);
            default -> buildChain(null, null, null, null, null, collegeId, null, src);
        };
    }

    /**
     * Builds the chain for a learner. COLLEGE stays anchored to {@code learner.college_id} — that
     * is the tenancy field the rest of the application uses — but everything above it is derived.
     */
    public List<ScopeRef> chainForLearner(Learner learner) {
        if (learner == null) {
            return new ArrayList<>(List.of(new ScopeRef("GLOBAL", null)));
        }
        return buildChain(learner.getId(), learner.getClassId(), null, learner.getProgramId(),
                null, learner.getCollegeId(), learner.getOrganizationId(), dbAncestors());
    }

    /** Chain for a non-learner (faculty/mentor/admin) — college-scoped, with the org derived. */
    public List<ScopeRef> chainForCollege(Integer collegeId, Integer organizationId) {
        return buildChain(null, null, null, null, null, collegeId, organizationId, dbAncestors());
    }

    /**
     * Chain starting at an arbitrary node, used by the admin console to show what a setting at that
     * node currently resolves to (a department's effective value depends on college/org/global
     * above it, so the page cannot compute this from the node's own row alone).
     */
    /**
     * Chain starting at an arbitrary node, used by the admin console to show what a setting at that
     * node currently resolves to. Delegates to the same walk as enforcement.
     */
    public List<ScopeRef> chainFromNode(String scopeType, Integer scopeId) {
        String type = scopeType == null ? "GLOBAL" : scopeType.trim().toUpperCase(Locale.ROOT);
        if ("LEARNER".equals(type)) {
            return chainForLearner(scopeId == null ? null : learnerRepository.findById(scopeId).orElse(null));
        }
        if ("ORGANIZATION".equals(type)) {
            List<ScopeRef> chain = new ArrayList<>();
            if (scopeId != null) chain.add(new ScopeRef("ORGANIZATION", scopeId));
            chain.add(new ScopeRef("GLOBAL", null));
            return chain;
        }
        if ("GLOBAL".equals(type)) {
            return new ArrayList<>(List.of(new ScopeRef("GLOBAL", null)));
        }
        return chainForNode(type, scopeId, null, null, "COLLEGE".equals(type) ? scopeId : null, dbAncestors());
    }

    /** Chain for whoever is making the request. */
    public List<ScopeRef> chainForPrincipal(UserPrincipal principal) {
        if (principal == null) {
            return List.of(new ScopeRef("GLOBAL", null));
        }
        if (principal.isLearner()) {
            Learner learner = learnerRepository.findById(principal.getId()).orElse(null);
            if (learner != null) {
                return chainForLearner(learner);
            }
            // Principal says learner but no row resolved (deleted mid-session, or a token for a
            // learner that no longer exists) — fall back to their token's college rather than
            // failing open to GLOBAL-only.
        }
        return chainForCollege(principal.getCollegeId(), principal.getOrganizationId());
    }

    /** Resolve every module in the catalog for a chain, in one query. */
    public Map<String, Resolution> resolveAll(List<ScopeRef> chain) {
        return resolveAll(chain, fetchRowsForChain(chain));
    }

    /**
     * Resolve against rows the caller already has.
     *
     * <p>The admin console's grid renders every node in a college at once. Letting it call the
     * single-chain variant per node would be one settings query per row; instead it fetches the
     * college's settings once with {@link #fetchRowsForScopes} and resolves every node against
     * that one list.
     */
    public Map<String, Resolution> resolveAll(List<ScopeRef> chain, List<AppSetting> rows) {
        Map<String, String> byExactPair = indexByExactPair(chain, rows);
        Map<String, Resolution> out = new LinkedHashMap<>();
        for (String module : ModuleFeatureCatalog.moduleKeys()) {
            out.put(module, resolveOne(chain, byExactPair, module));
        }
        return out;
    }

    /** Every module setting stored against any of these scopes, in one query. */
    public List<AppSetting> fetchRowsForScopes(List<String> scopeTypes, List<Integer> scopeIds) {
        List<String> types = scopeTypes.isEmpty() ? new ArrayList<>(List.of("GLOBAL")) : new ArrayList<>(scopeTypes);
        List<Integer> ids = new ArrayList<>(scopeIds);
        // `IN ()` is invalid SQL — a GLOBAL-only lookup carries no ids, so give the query a
        // sentinel that can never match a real row rather than letting it fail.
        if (ids.isEmpty()) {
            ids.add(-1);
        }
        try {
            return appSettingRepository.findAllActiveForScopeChain(
                    types, ids, ModuleFeatureCatalog.settingAndLockKeys());
        } catch (Exception e) {
            // A query failure is NOT the same as no configured rows. Never restore a locked OFF
            // entitlement because the settings store is unavailable; let the caller return 503.
            log.error("Optional-module settings unavailable", e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "OPTIONAL_MODULE_SETTINGS_UNAVAILABLE", e);
        }
    }

    private List<AppSetting> fetchRowsForChain(List<ScopeRef> chain) {
        List<String> scopeTypes = new ArrayList<>();
        List<Integer> scopeIds = new ArrayList<>();
        for (ScopeRef ref : chain) {
            scopeTypes.add(ref.scopeType);
            if (ref.scopeId != null) {
                scopeIds.add(ref.scopeId);
            }
        }
        return fetchRowsForScopes(scopeTypes, scopeIds);
    }

    /**
     * (scopeType|scopeId|key) → value, filtered to the exact pairs in this chain. The query
     * intentionally over-selects (see findAllActiveForScopeChain), and when resolving many nodes
     * from one fetch the row list covers the whole college — so this exact-pair filter is what
     * keeps one node's settings from leaking into another's resolution.
     */
    private Map<String, String> indexByExactPair(List<ScopeRef> chain, List<AppSetting> rows) {
        Map<String, String> byExactPair = new LinkedHashMap<>();
        if (rows == null) {
            return byExactPair;
        }
        for (AppSetting row : rows) {
            for (ScopeRef ref : chain) {
                if (ref.scopeType.equals(row.getScopeType()) && Objects.equals(ref.scopeId, row.getScopeId())) {
                    // Malformed active flags/locks are not absent: never default them ON.
                    String key = row.getSettingKey();
                    if (!ModuleFeatureCatalog.settingAndLockKeys().contains(key)) break;
                    Boolean parsed = ModuleFeatureCatalog.parseValue(row.getSettingValue());
                    if (parsed == null) {
                        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                                "INVALID_OPTIONAL_MODULE_SETTING");
                    }
                    String pair = pairKey(ref.scopeType, ref.scopeId, key);
                    String previous = byExactPair.putIfAbsent(pair, row.getSettingValue());
                    // Duplicate active rows cannot let DB row order determine authorization.
                    // Equivalent spellings (e.g. false/off) retain the same decision.
                    if (previous != null && !parsed.equals(ModuleFeatureCatalog.parseValue(previous))) {
                        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                                "CONFLICTING_OPTIONAL_MODULE_SETTINGS");
                    }
                    break;
                }
            }
        }
        return byExactPair;
    }

    private Resolution resolveOne(List<ScopeRef> chain, Map<String, String> byExactPair, String module) {
        String enabledKey = ModuleFeatureCatalog.settingKeyFor(module);
        String lockKey = ModuleFeatureCatalog.lockKeyFor(module);

        // Pass 1, broadest → narrowest: a locked level's value is final.
        for (int i = chain.size() - 1; i >= 0; i--) {
            ScopeRef ref = chain.get(i);
            if (ModuleFeatureCatalog.levelIgnored(module, ref.scopeType)) continue;
            Boolean value = ModuleFeatureCatalog.parseValue(byExactPair.get(pairKey(ref.scopeType, ref.scopeId, enabledKey)));
            if (value == null) continue;
            if (ModuleFeatureCatalog.isTrue(byExactPair.get(pairKey(ref.scopeType, ref.scopeId, lockKey)))) {
                return new Resolution(value, ref.scopeType, ref.scopeId, true);
            }
        }

        // Pass 2, narrowest → broadest: normal most-specific-wins. An unrecognised value is NOT a
        // decision — resolution falls through rather than defaulting it to enabled.
        for (ScopeRef ref : chain) {
            if (ModuleFeatureCatalog.levelIgnored(module, ref.scopeType)) continue;
            Boolean value = ModuleFeatureCatalog.parseValue(byExactPair.get(pairKey(ref.scopeType, ref.scopeId, enabledKey)));
            if (value != null) {
                return new Resolution(value, ref.scopeType, ref.scopeId, false);
            }
        }

        return new Resolution(ModuleFeatureCatalog.defaultEnabled(module), "DEFAULT", null, false);
    }

    private static String pairKey(String scopeType, Integer scopeId, String settingKey) {
        return scopeType.toUpperCase(Locale.ROOT) + "|" + scopeId + "|" + settingKey;
    }
}
