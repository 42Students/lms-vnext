package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Superadmin-only management of hierarchical optional-module access at every scope.
 * Every read, individual update and bulk update checks Superadmin authority, then enforces
 * active organization/college scope against the actual owning entity. College Admin may
 * consume ordinary effective feature flags but cannot manage Module Access at any level.
 * Module settings express operational allocation, NOT a verified purchase or contract.
 */
@Service
@Slf4j
public class ModuleAccessService {

    private final AppSettingsService appSettingsService;
    private final ModuleAccessResolver resolver;
    private final AccessControlService accessControlService;
    private final AdminAuditLogService auditLogService;
    // Only used to build the whole-college grid in one pass (getCollegeTree).
    private final com._42students.lms.repository.DepartmentRepository departmentRepository;
    private final com._42students.lms.repository.NewProgramRepository newProgramRepository;
    private final com._42students.lms.repository.BatchRepository batchRepository;
    private final com._42students.lms.repository._ClassRepository classRepository;
    private final com._42students.lms.repository.LearnerRepository learnerRepository;
    private final com._42students.lms.repository.CollegeRepository collegeRepository;
    private final com._42students.lms.repository.OrganizationRepository organizationRepository;
    private final com._42students.lms.repository.FacultyRepository facultyRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com._42students.lms.service.tpo.PlacementEligibilityService placementEligibility;

    public ModuleAccessService(AppSettingsService appSettingsService,
                               ModuleAccessResolver resolver,
                               AccessControlService accessControlService,
                               AdminAuditLogService auditLogService,
                               com._42students.lms.repository.DepartmentRepository departmentRepository,
                               com._42students.lms.repository.NewProgramRepository newProgramRepository,
                               com._42students.lms.repository.BatchRepository batchRepository,
                               com._42students.lms.repository._ClassRepository classRepository,
                               com._42students.lms.repository.LearnerRepository learnerRepository,
                               com._42students.lms.repository.CollegeRepository collegeRepository,
                               com._42students.lms.repository.OrganizationRepository organizationRepository,
                               com._42students.lms.repository.FacultyRepository facultyRepository) {
        this.appSettingsService = appSettingsService;
        this.resolver = resolver;
        this.accessControlService = accessControlService;
        this.auditLogService = auditLogService;
        this.departmentRepository = departmentRepository;
        this.newProgramRepository = newProgramRepository;
        this.batchRepository = batchRepository;
        this.classRepository = classRepository;
        this.learnerRepository = learnerRepository;
        this.collegeRepository = collegeRepository;
        this.organizationRepository = organizationRepository;
        this.facultyRepository = facultyRepository;
    }

    /**
     * The whole college as one flat list of nodes, each already resolved for both optional modules.
     *
     * <p>This backs the admin grid, which shows every department / program / batch / class at once
     * rather than making an admin drill a picker to discover what is set where. Deliberately one
     * request: four hierarchy queries, one settings query, one learner-count query — not a
     * per-node resolve, which at ~250 nodes would be ~250 round trips.
     *
     * <p>Students are NOT included. A college has thousands of them; they are reached by search
     * (and edited in bulk from the Students page) rather than rendered as a fifth tier here.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCollegeTree(UserPrincipal principal, Integer collegeId) {
        requireReadAuthority(principal, "COLLEGE", collegeId);

        List<com._42students.lms.model.Department> departments = departmentRepository.fetchAllDepartments(collegeId);
        List<com._42students.lms.model.NewProgram> programs = newProgramRepository.findByCollegeId(collegeId);
        List<com._42students.lms.model.Batch> batches = batchRepository.findByCollegeId(collegeId);
        List<com._42students.lms.model._Class> classes = classRepository.getClassesByCollegeId(collegeId);

        // Learner counts.
        //
        // Rolled up bottom-up through the tree, NOT read per level from the learner row. A learner's
        // own programId can be stale or unset while their class is correct (the same reason
        // ModuleAccessResolver prefers the class's programId), so counting programs directly from
        // learner.programId under-reports: a program would show 0 students while the batch beneath
        // it showed 50. This number is the blast radius shown before a broad change is confirmed —
        // a quietly wrong one is worse than none.
        //
        // directLearners holds only what belongs to a node itself: a class's own learners, and
        // learners attached to a program or the college with no class of their own. Everything else
        // arrives by summing children.
        Map<String, Integer> directLearners = new LinkedHashMap<>();
        int collegeLearners = 0;
        for (Object[] row : learnerRepository.countActiveByClassAndProgram(collegeId)) {
            Integer classId = (Integer) row[0];
            Integer programId = (Integer) row[1];
            int count = ((Number) row[2]).intValue();
            collegeLearners += count;
            if (classId != null) {
                directLearners.merge("CLASS:" + classId, count, Integer::sum);
            } else if (programId != null) {
                // Enrolled in a program but not yet in a class — still real students under it.
                directLearners.merge("PROGRAM:" + programId, count, Integer::sum);
            } else {
                directLearners.merge("COLLEGE:" + collegeId, count, Integer::sum);
            }
        }

        // Every scope in this college, so the settings fetch is a single query.
        List<String> scopeTypes = List.of("GLOBAL", "ORGANIZATION", "COLLEGE", "DEPARTMENT", "PROGRAM", "BATCH", "CLASS");
        List<Integer> scopeIds = new ArrayList<>();
        scopeIds.add(collegeId);
        Integer orgId = collegeRepository.findById(collegeId).map(c -> c.getOrgId()).orElse(null);
        if (orgId != null) scopeIds.add(orgId);
        departments.forEach(d -> scopeIds.add(d.getId()));
        programs.forEach(p -> scopeIds.add(p.getId()));
        batches.forEach(b -> scopeIds.add(b.getId() == null ? null : b.getId().intValue()));
        classes.forEach(c -> scopeIds.add(c.getId()));
        scopeIds.removeIf(Objects::isNull);
        List<com._42students.lms.model.AppSetting> rows = resolver.fetchRowsForScopes(scopeTypes, scopeIds);

        // Parent lookups so each node's chain can be built in memory.
        Map<Integer, Integer> programToDept = new LinkedHashMap<>();
        programs.forEach(p -> programToDept.put(p.getId(), p.getDeptId()));
        Map<Integer, Integer> batchToProgram = new LinkedHashMap<>();
        batches.forEach(b -> {
            if (b.getId() != null && b.getProgramId() != null) {
                batchToProgram.put(b.getId().intValue(), b.getProgramId().intValue());
            }
        });

        // The grid resolves ~250 nodes; a per-node DB walk would be ~250 round trips. So it feeds
        // the resolver's own walk with the parents it already fetched in bulk. Crucially this is
        // the SAME walk enforcement uses — the grid previously had a private copy, and the two
        // drifted in two places (BATCH dropped when absent from the fetched list, PROGRAM taken
        // from the batch rather than the class), which let the grid show ON for students who were
        // actually blocked.
        final Integer resolvedOrgId = orgId;
        ModuleAccessResolver.AncestorSource ancestors = new ModuleAccessResolver.AncestorSource() {
            @Override public Integer[] classParents(Integer classId) {
                for (com._42students.lms.model._Class c : classes) {
                    if (Objects.equals(c.getId(), classId)) {
                        return new Integer[] { c.getBatchId(), c.getProgramId() > 0 ? c.getProgramId() : null };
                    }
                }
                return null;
            }
            @Override public Integer batchProgram(Integer batchId) { return batchToProgram.get(batchId); }
            @Override public Integer programDepartment(Integer programId) { return programToDept.get(programId); }
            @Override public Integer departmentCollege(Integer departmentId) { return collegeId; }
            @Override public Integer collegeOrganization(Integer cid) { return resolvedOrgId; }
        };

        List<Map<String, Object>> nodes = new ArrayList<>();
        nodes.add(treeNode("COLLEGE", collegeId, collegeName(collegeId), null, null,
                0, resolver.chainForNode("COLLEGE", collegeId, null, null, collegeId, ancestors), rows));

        for (com._42students.lms.model.Department d : departments) {
            nodes.add(treeNode("DEPARTMENT", d.getId(), d.getName(), "COLLEGE", collegeId, 0,
                    resolver.chainForNode("DEPARTMENT", d.getId(), null, null, collegeId, ancestors), rows));
        }
        for (com._42students.lms.model.NewProgram p : programs) {
            nodes.add(treeNode("PROGRAM", p.getId(), p.getName(), "DEPARTMENT", p.getDeptId(),
                    directLearners.getOrDefault("PROGRAM:" + p.getId(), 0),
                    resolver.chainForNode("PROGRAM", p.getId(), null, null, collegeId, ancestors), rows));
        }
        for (com._42students.lms.model.Batch b : batches) {
            if (b.getId() == null) continue;
            int batchId = b.getId().intValue();
            nodes.add(treeNode("BATCH", batchId, b.getBatchName(), "PROGRAM",
                    b.getProgramId() == null ? null : b.getProgramId().intValue(), 0,
                    resolver.chainForNode("BATCH", batchId, null, null, collegeId, ancestors), rows));
        }
        for (com._42students.lms.model._Class c : classes) {
            // Classes hang off their BATCH when one is known — that matches the precedence order
            // (a batch is a cohort, a class a section within it). A class with no batch is parented
            // to its program instead, rather than silently drawn as a batch sibling.
            boolean hasBatch = c.getBatchId() != null && batchToProgram.containsKey(c.getBatchId());
            nodes.add(treeNode("CLASS", c.getId(), c.getName(),
                    hasBatch ? "BATCH" : "PROGRAM",
                    hasBatch ? c.getBatchId() : c.getProgramId(),
                    directLearners.getOrDefault("CLASS:" + c.getId(), 0),
                    resolver.chainForNode("CLASS", c.getId(), c.getBatchId(), c.getProgramId(), collegeId, ancestors), rows));
        }

        rollUpLearnerCounts(nodes, directLearners.getOrDefault("COLLEGE:" + collegeId, 0));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("collegeId", collegeId);
        out.put("learnerCount", collegeLearners);
        out.put("canEditCollegeLevel", accessControlService.isSuperAdmin(principal));
        out.put("nodes", nodes);
        return out;
    }

    private Map<String, Object> treeNode(String scopeType, Integer scopeId, String name,
                                         String parentType, Integer parentId, int learnerCount,
                                         List<ModuleAccessResolver.ScopeRef> chain,
                                         List<com._42students.lms.model.AppSetting> rows) {
        Map<String, ModuleAccessResolver.Resolution> resolved = resolver.resolveAll(chain, rows);
        List<Map<String, Object>> modules = new ArrayList<>();
        for (String module : ModuleFeatureCatalog.moduleKeys()) {
            ModuleAccessResolver.Resolution r = resolved.get(module);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("module", module);
            m.put("label", ModuleFeatureCatalog.labelFor(module));
            m.put("explicitValue", explicitFromRows(rows, scopeType, scopeId, ModuleFeatureCatalog.settingKeyFor(module)));
            m.put("locked", Boolean.TRUE.equals(explicitFromRows(rows, scopeType, scopeId, ModuleFeatureCatalog.lockKeyFor(module))));
            m.put("effectiveEnabled", r == null || r.enabled);
            m.put("effectiveLevel", r == null ? "DEFAULT" : r.level);
            m.put("effectiveScopeId", r == null ? null : r.scopeId);
            m.put("effectiveLocked", r != null && r.locked);
            m.put("enforcement", "NAV_AND_API");
            if (ModuleFeatureCatalog.levelIgnored(module, scopeType)) m.put("managedBy", "PLACEMENT_ELIGIBILITY");
            modules.add(m);
        }
        Map<String, Object> node = new LinkedHashMap<>();
        node.put("scopeType", scopeType);
        node.put("scopeId", scopeId);
        node.put("name", name);
        node.put("parentType", parentType);
        node.put("parentId", parentId);
        node.put("learnerCount", learnerCount);
        node.put("modules", modules);
        return node;
    }

    /**
     * Sums each node's learner count into its ancestors, deepest level first.
     *
     * <p>Nodes are built narrowest-last (college → departments → programs → batches → classes), so
     * walking the list backwards guarantees a node's children are already totalled before it is.
     * The college's own count is its direct unassigned learners plus everything beneath it.
     */
    private void rollUpLearnerCounts(List<Map<String, Object>> nodes, int collegeDirectLearners) {
        Map<String, Map<String, Object>> byKey = new LinkedHashMap<>();
        for (Map<String, Object> node : nodes) {
            byKey.put(node.get("scopeType") + ":" + node.get("scopeId"), node);
        }
        int orphanedLearners = 0;
        for (int i = nodes.size() - 1; i >= 0; i--) {
            Map<String, Object> node = nodes.get(i);
            Object parentType = node.get("parentType");
            Object parentId = node.get("parentId");
            if (parentType == null || parentId == null) {
                continue;
            }
            Map<String, Object> parent = byKey.get(parentType + ":" + parentId);
            if (parent == null) {
                // Orphaned node (e.g. a class whose batch row was deleted). Its learners still
                // exist, so they are folded into the college rather than dropped. This previously
                // said exactly that and then `continue`d, silently dropping them — which
                // understated the blast radius shown before a broad change and, below the
                // 100-student confirmation threshold, suppressed the confirmation entirely.
                orphanedLearners += ((Number) node.get("learnerCount")).intValue();
                continue;
            }
            int childCount = ((Number) node.get("learnerCount")).intValue();
            int parentCount = ((Number) parent.get("learnerCount")).intValue();
            parent.put("learnerCount", parentCount + childCount);
        }
        if (!nodes.isEmpty()) {
            Map<String, Object> college = nodes.get(0);
            college.put("learnerCount",
                    ((Number) college.get("learnerCount")).intValue() + collegeDirectLearners + orphanedLearners);
        }
    }

    /** Reads a node's own stored value out of the already-fetched college-wide row list. */
    private Boolean explicitFromRows(List<com._42students.lms.model.AppSetting> rows,
                                     String scopeType, Integer scopeId, String key) {
        for (com._42students.lms.model.AppSetting row : rows) {
            if (scopeType.equals(row.getScopeType()) && Objects.equals(scopeId, row.getScopeId())
                    && key.equals(row.getSettingKey())) {
                return ModuleFeatureCatalog.parseValue(row.getSettingValue());
            }
        }
        return null;
    }

    private String collegeName(Integer collegeId) {
        return collegeRepository.findById(collegeId).map(c -> c.getName()).orElse("This college");
    }

    /**
     * Human name for one node in a trace — "Locked OFF at College NSRIT" is actionable, "locked at
     * COLLEGE:6" is not. Called at most eight times per trace (once per level), so a lookup each is
     * fine; the grid deliberately does not use this and reads names from its bulk fetch instead.
     */
    private String scopeName(String scopeType, Integer scopeId) {
        if (scopeId == null) return "Platform-wide";
        try {
            switch (scopeType) {
                case "COLLEGE":
                    return collegeRepository.findById(scopeId).map(c -> c.getName()).orElse(null);
                case "DEPARTMENT":
                    return departmentRepository.findById(scopeId).map(d -> d.getName()).orElse(null);
                case "PROGRAM":
                    return newProgramRepository.findById(scopeId).map(p -> p.getName()).orElse(null);
                case "BATCH":
                    return batchRepository.findById(scopeId.longValue()).map(b -> b.getBatchName()).orElse(null);
                case "CLASS":
                    return classRepository.findById(scopeId).map(c -> c.getName()).orElse(null);
                case "LEARNER":
                    return learnerRepository.findById(scopeId)
                            .map(l -> (l.getFirstName() + " " + (l.getLastName() == null ? "" : l.getLastName())).trim())
                            .orElse(null);
                default:
                    return null;
            }
        } catch (Exception e) {
            // A missing name must never break the trace — the level and its value still explain
            // the outcome, which is the point of the screen.
            log.debug("Could not resolve name for {}:{}", scopeType, scopeId);
            return null;
        }
    }

    /**
     * Every student in this college who carries their own module override.
     *
     * <p>Per-student overrides are the narrowest level and always win, so a forgotten one follows a
     * student through class changes, promotions and graduation. They are also the only level the
     * grid cannot display (a college has thousands of students). Without this listing an admin
     * could set a thousand of them in one bulk action and then have no way to find them again —
     * which made a mistaken bulk effectively permanent.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listLearnerOverrides(UserPrincipal principal, Integer collegeId) {
        requireReadAuthority(principal, "COLLEGE", collegeId);

        List<com._42students.lms.model.Learner> learners = learnerRepository.findActiveByCollegeIdForOverrides(collegeId);
        Map<Integer, com._42students.lms.model.Learner> byId = new LinkedHashMap<>();
        List<Integer> ids = new ArrayList<>();
        for (com._42students.lms.model.Learner l : learners) {
            byId.put(l.getId(), l);
            ids.add(l.getId());
        }

        List<Map<String, Object>> out = new ArrayList<>();
        if (!ids.isEmpty()) {
            Map<Integer, Map<String, Boolean>> byLearner = new LinkedHashMap<>();
            for (com._42students.lms.model.AppSetting row : appSettingsService.findLearnerModuleRows(ids)) {
                String module = ModuleFeatureCatalog.moduleForSettingKey(row.getSettingKey());
                Boolean value = ModuleFeatureCatalog.parseValue(row.getSettingValue());
                if (module == null || value == null || ModuleFeatureCatalog.collegeLevelOnly(module)) continue;
                byLearner.computeIfAbsent(row.getScopeId(), k -> new LinkedHashMap<>()).put(module, value);
            }
            // Include legacy lock-only rows, even when the corresponding enabled row was
            // deleted. Otherwise the admin sees no affected learner yet cannot reset that lock.
            Map<Integer, Map<String, Boolean>> locksByLearner = new LinkedHashMap<>();
            for (com._42students.lms.model.AppSetting lock : appSettingsService.findLearnerModuleLockRows(ids)) {
                if (!Boolean.TRUE.equals(ModuleFeatureCatalog.parseValue(lock.getSettingValue()))) continue;
                for (String module : ModuleFeatureCatalog.moduleKeys()) {
                    if (ModuleFeatureCatalog.collegeLevelOnly(module) || !ModuleFeatureCatalog.lockKeyFor(module).equals(lock.getSettingKey())) continue;
                    if (!byId.containsKey(lock.getScopeId())) continue;
                    locksByLearner.computeIfAbsent(lock.getScopeId(), k -> new LinkedHashMap<>()).put(module, true);
                    byLearner.computeIfAbsent(lock.getScopeId(), k -> new LinkedHashMap<>());
                }
            }
            for (Map.Entry<Integer, Map<String, Boolean>> e : byLearner.entrySet()) {
                com._42students.lms.model.Learner l = byId.get(e.getKey());
                if (l == null) continue;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("learnerId", l.getId());
                row.put("name", (l.getFirstName() + " " + (l.getLastName() == null ? "" : l.getLastName())).trim());
                row.put("rollNumber", l.getRollNumber());
                row.put("classId", l.getClassId());
                row.put("overrides", e.getValue());
                row.put("locks", locksByLearner.getOrDefault(e.getKey(), Map.of()));
                out.add(row);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("collegeId", collegeId);
        result.put("count", out.size());
        result.put("students", out);
        return result;
    }

    /**
     * Recent module-access changes for this college, rendered readable.
     *
     * <p>Every change was already audited, but nothing read those rows: MODULE_ACCESS_SET appeared
     * nowhere in the UI, and the payload — which carries the previous value, the scope and the
     * module — was never rendered even where the audit page could reach it. An unread log is close
     * to no log, and since upsert overwrites in place the audit trail is the only record of what a
     * value used to be.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listHistory(UserPrincipal principal, Integer collegeId, int limit) {
        requireReadAuthority(principal, "COLLEGE", collegeId);
        // Normalize once for both the DB page and the final slice. A negative limit used to
        // reach subList(0, -1), returning 500 after an otherwise successful audit read.
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        List<Map<String, Object>> entries = new ArrayList<>();
        for (String action : List.of("MODULE_ACCESS_SET", "MODULE_ACCESS_BULK_SET", "COLLEGE_FEATURE_TOGGLE")) {
            auditLogService.search(action, null, null, collegeId, null, null, null, null, 0,
                    safeLimit).getContent().forEach(row -> {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("action", row.getActionKey());
                e.put("at", row.getCreatedAt());
                e.put("actorUserId", row.getActorUserId());
                e.put("actorName", resolveActorName(row.getActorUserId(), row.getActorUserType()));
                e.put("payload", row.getPayloadJson());
                entries.add(e);
            });
        }
        // Both action keys are queried separately, so re-sort into one timeline.
        entries.sort((a, b) -> {
            Object x = a.get("at");
            Object y = b.get("at");
            if (x == null || y == null) return 0;
            return String.valueOf(y).compareTo(String.valueOf(x));
        });

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("collegeId", collegeId);
        out.put("limit", safeLimit);
        out.put("entries", entries.size() > safeLimit ? entries.subList(0, safeLimit) : entries);
        return out;
    }

    /** Best-effort display name for an audit actor; the log stores only an id and a type. */
    private String resolveActorName(Integer actorId, String actorType) {
        if (actorId == null) return null;
        try {
            if ("LEARNER".equalsIgnoreCase(actorType)) {
                return learnerRepository.findById(actorId)
                        .map(l -> (l.getFirstName() + " " + (l.getLastName() == null ? "" : l.getLastName())).trim())
                        .orElse(null);
            }
            return facultyRepository.findById(actorId)
                    .map(f -> (f.getFirstName() + " " + (f.getLastName() == null ? "" : f.getLastName())).trim())
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    /** What is explicitly set at this node, and what it currently resolves to. */
    public Map<String, Object> getNode(UserPrincipal principal, String scopeType, Integer scopeId) {
        requireModuleAccessSuperAdmin(principal);
        String level = normalizeLevel(scopeType);
        requireReadAuthority(principal, level, scopeId);

        List<ModuleAccessResolver.ScopeRef> chain = resolver.chainFromNode(level, scopeId);
        Map<String, ModuleAccessResolver.Resolution> effective = resolver.resolveAll(chain);

        List<Map<String, Object>> modules = new ArrayList<>();
        for (String module : ModuleFeatureCatalog.moduleKeys()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("module", module);
            row.put("label", ModuleFeatureCatalog.labelFor(module));
            // null = nothing set here = inherit. The UI needs this distinct from an explicit false,
            // which is why the control is tri-state rather than a switch.
            row.put("explicitValue", readExplicit(level, scopeId, ModuleFeatureCatalog.settingKeyFor(module)));
            row.put("locked", Boolean.TRUE.equals(readExplicit(level, scopeId, ModuleFeatureCatalog.lockKeyFor(module))));
            ModuleAccessResolver.Resolution r = effective.get(module);
            row.put("effectiveEnabled", r == null || r.enabled);
            row.put("effectiveLevel", r == null ? "DEFAULT" : r.level);
            row.put("effectiveScopeId", r == null ? null : r.scopeId);
            row.put("effectiveLocked", r != null && r.locked);
            row.put("enforcement", "NAV_AND_API");
            modules.add(row);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("scopeType", level);
        out.put("scopeId", scopeId);
        out.put("modules", modules);
        return out;
    }

    /** Set (or clear, when {@code enabled} is null) one module's value at one node. */
    /**
     * One unit of work: the value write and the lock write must not be able to half-apply.
     * Without this a failed lock write left the value change committed while the request
     * reported failure — producing exactly the unlocked-OFF state the lock exists to prevent.
     */
    @Transactional
    public Map<String, Object> setValue(UserPrincipal principal, String scopeType, Integer scopeId,
                                        String module, Boolean enabled, Boolean locked,
                                        HttpServletRequest request) {
        requireModuleAccessSuperAdmin(principal);
        String level = normalizeLevel(scopeType);
        String settingKey = ModuleFeatureCatalog.settingKeyFor(module);
        if (settingKey == null) {
            throw new IllegalArgumentException("Unknown module: " + module);
        }
        if (ModuleFeatureCatalog.levelIgnored(module, level)) {
            throw new IllegalArgumentException("Placements is switched for the whole college. Who is in placements is decided by the placement cell on the Batches page.");
        }
        requireWriteAuthority(principal, level, scopeId);
        // Locking is the mechanism that stops a college-admin re-enabling from below, so only a
        // super-admin may set it. Checked BEFORE anything is written: when this ran after the value
        // write, a college-admin's rejected lock request still left the value change applied — a
        // partial write from a request that reported failure.
        if (locked != null && !accessControlService.isSuperAdmin(principal)) {
            throw new AccessDeniedException("Only a super admin can lock a module setting");
        }

        String lockKey = ModuleFeatureCatalog.lockKeyFor(module);
        if (enabled == null && Boolean.TRUE.equals(locked)) {
            throw new IllegalArgumentException("Cannot lock a module setting without an explicit value");
        }
        if (!accessControlService.isSuperAdmin(principal)
                && Boolean.TRUE.equals(readExplicit(level, scopeId, lockKey))) {
            throw new AccessDeniedException("Only a super admin can change or clear a locked module setting");
        }
        if (enabled != null) {
            ModuleAccessResolver.Resolution deciding = resolver.resolveAll(
                    resolver.chainFromNode(level, scopeId)).get(module);
            if (deciding != null && deciding.locked
                    && (!level.equals(deciding.level) || !Objects.equals(scopeId, deciding.scopeId))) {
                throw new AccessDeniedException("Module access is locked at an ancestor scope");
            }
        }

        Boolean previous = readExplicit(level, scopeId, settingKey);
        if (enabled == null) {
            appSettingsService.delete(level, scopeId, settingKey);
            // Clear the companion lock too. A lock with no value is inert (resolveOne only consults
            // a lock on a level that also has a value), so leaving it behind hid a live constraint:
            // months later an innocuous set at this same node silently re-armed it, freezing every
            // level beneath with no visible cause — and could hand a college-admin a lock they are
            // not allowed to create and cannot remove.
            appSettingsService.delete(level, scopeId, ModuleFeatureCatalog.lockKeyFor(module));
        } else {
            appSettingsService.upsert(level, scopeId, settingKey, String.valueOf(enabled));
        }

        if (locked != null) {
            if (Boolean.TRUE.equals(locked)) {
                appSettingsService.upsert(level, scopeId, lockKey, "true");
            } else {
                appSettingsService.delete(level, scopeId, lockKey);
            }
        }

        audit(request, principal, level, scopeId, module, enabled, locked, previous);
        return getNode(principal, level, scopeId);
    }

    /**
     * Bulk-set one module for many learners — the answer to scale, since a college with thousands
     * of students cannot be managed one toggle at a time. Every learner is authority-checked
     * individually; a single foreign learner in the list fails the whole request rather than being
     * silently skipped, so the caller can never half-apply a change they thought was atomic.
     */
    @Transactional
    public Map<String, Object> setBulkForLearners(UserPrincipal principal, String module, Boolean enabled,
                                                  List<Integer> learnerIds, HttpServletRequest request) {
        requireModuleAccessSuperAdmin(principal);
        String settingKey = ModuleFeatureCatalog.settingKeyFor(module);
        if (settingKey == null) {
            throw new IllegalArgumentException("Unknown module: " + module);
        }
        if (learnerIds == null || learnerIds.isEmpty()) {
            throw new IllegalArgumentException("At least one learner must be selected");
        }
        if (ModuleFeatureCatalog.collegeLevelOnly(module)) {
            throw new IllegalArgumentException("Placements is switched for the whole college. Who is in placements is decided by the placement cell on the Batches page.");
        }
        // The limit is on DISTINCT learners, not repeated checkbox IDs. Deduplicate before
        // checking the cap so 1001 copies of the same learner remain one atomic operation.
        List<Integer> ids = learnerIds.stream().distinct().collect(java.util.stream.Collectors.toList());
        if (ids.size() > 1000) {
            throw new IllegalArgumentException("Select at most 1000 students at a time");
        }
        // Authority for the whole selection in ONE query, not a chain walk per learner. The old
        // loop ran requireWriteAuthority -> collegeOf -> chainFromNode for every id: roughly 4-5
        // queries each, so ~7,500 round trips for a 1,000-student selection, taking 8-15s against
        // a 30s client timeout. Every learner is still checked before anything is written.
        for (Integer learnerId : ids) {
            if (learnerId == null || learnerId <= 0) {
                throw new IllegalArgumentException("Invalid learner id in selection");
            }
        }
        List<com._42students.lms.model.Learner> found = learnerRepository.findAllById(ids);
        if (found.size() != ids.size()) {
            // Silently skipping unknown ids would let a stale selection report success for students
            // it never touched.
            throw new IllegalArgumentException("Some selected students no longer exist — refresh and try again");
        }
        for (com._42students.lms.model.Learner learner : found) {
            Integer learnerCollege = learner.getCollegeId();
            requireWithinSuperAdminScope(principal, "COLLEGE", learnerCollege);
        }
        String learnerLockKey = ModuleFeatureCatalog.lockKeyFor(module);
        if (!accessControlService.isSuperAdmin(principal)) {
            boolean hasProtectedLearner = appSettingsService.findLearnerModuleLockRows(ids).stream()
                    .anyMatch(row -> learnerLockKey.equals(row.getSettingKey())
                            && Boolean.TRUE.equals(ModuleFeatureCatalog.parseValue(row.getSettingValue())));
            if (hasProtectedLearner) {
                throw new AccessDeniedException("Selection contains a learner with a super-admin locked module setting");
            }
        }
        // Explicit bulk overrides must obey the SAME ancestor locks as single-node writes.
        // Preflight ALL cohorts before the first write, so a single locked class never creates
        // dormant overrides for other learners that unexpectedly activate on a later unlock.
        // Inherit is safe: it removes learner overrides and cannot override a parent lock.
        if (enabled != null) {
            Map<List<Integer>, List<ModuleAccessResolver.ScopeRef>> ancestorChains = new LinkedHashMap<>();
            java.util.Set<String> scopeTypes = new java.util.LinkedHashSet<>();
            java.util.Set<Integer> scopeIds = new java.util.LinkedHashSet<>();
            for (com._42students.lms.model.Learner learner : found) {
                // One canonical parent walk per distinct class/program/college cohort rather
                // than one hierarchy lookup per learner in a 1,000-student bulk request.
                List<Integer> cohort = java.util.Arrays.asList(
                        learner.getClassId(), learner.getProgramId(), learner.getCollegeId());
                if (ancestorChains.containsKey(cohort)) continue;
                List<ModuleAccessResolver.ScopeRef> chain = resolver.chainForLearner(learner);
                if (chain == null || chain.size() < 2 || !"LEARNER".equals(chain.get(0).scopeType)
                        || !Objects.equals(chain.get(0).scopeId, learner.getId())) {
                    throw new AccessDeniedException("Could not validate the selected students' module access");
                }
                List<ModuleAccessResolver.ScopeRef> ancestors = new ArrayList<>(chain.subList(1, chain.size()));
                ancestorChains.put(cohort, ancestors);
                for (ModuleAccessResolver.ScopeRef ref : ancestors) {
                    scopeTypes.add(ref.scopeType);
                    if (ref.scopeId != null) scopeIds.add(ref.scopeId);
                }
            }
            // Fetch once across all exact scope pairs; resolver still filters each chain so
            // another class's lock cannot accidentally apply to this learner's class.
            List<com._42students.lms.model.AppSetting> ancestorRows = resolver.fetchRowsForScopes(
                    new ArrayList<>(scopeTypes), new ArrayList<>(scopeIds));
            if (ancestorRows == null) {
                throw new AccessDeniedException("Could not validate the selected students' module access");
            }
            for (List<ModuleAccessResolver.ScopeRef> ancestors : ancestorChains.values()) {
                Map<String, ModuleAccessResolver.Resolution> resolved = resolver.resolveAll(ancestors, ancestorRows);
                ModuleAccessResolver.Resolution deciding = resolved == null ? null : resolved.get(module);
                if (deciding == null || deciding.locked) {
                    throw new AccessDeniedException("Selection contains a learner whose module is locked at an ancestor scope");
                }
            }
        }
        learnerIds = ids;

        int updated = 0;
        // Captured per learner so the log records what to restore, not merely what was set.
        Map<String, Object> previousValues = new LinkedHashMap<>();
        for (Integer learnerId : learnerIds) {
            previousValues.put(String.valueOf(learnerId),
                    String.valueOf(readExplicit("LEARNER", learnerId, settingKey)));
            if (enabled == null) {
                appSettingsService.delete("LEARNER", learnerId, settingKey);
                appSettingsService.delete("LEARNER", learnerId, learnerLockKey);
            } else {
                appSettingsService.upsert("LEARNER", learnerId, settingKey, String.valueOf(enabled));
            }
            updated++;
        }
        // A global/org Superadmin has no principal.collegeId; a single null-college audit
        // record cannot appear in listHistory(collegeId). Partition the *already validated*
        // selection and write one college-scoped audit row per affected college. Record only
        // that college's learner IDs and prior values, so history never exposes students in
        // another college. This is part of the same @Transactional bulk write: an audit failure
        // must roll back ALL settings, not leave partial settings or partial history.
        Map<Integer, List<Integer>> learnerIdsByCollege = new LinkedHashMap<>();
        for (com._42students.lms.model.Learner learner : found) {
            learnerIdsByCollege.computeIfAbsent(learner.getCollegeId(), k -> new ArrayList<>())
                    .add(learner.getId());
        }
        for (Map.Entry<Integer, List<Integer>> collegeEntry : learnerIdsByCollege.entrySet()) {
            List<Integer> collegeLearnerIds = collegeEntry.getValue();
            Map<String, Object> collegePreviousValues = new LinkedHashMap<>();
            for (Integer learnerId : collegeLearnerIds) {
                collegePreviousValues.put(String.valueOf(learnerId), previousValues.get(String.valueOf(learnerId)));
            }
            Map<String, Object> auditPayload = new LinkedHashMap<>();
            auditPayload.put("module", module);
            auditPayload.put("enabled", String.valueOf(enabled));
            auditPayload.put("learnerCount", collegeLearnerIds.size());
            auditPayload.put("learnerIds", new ArrayList<>(collegeLearnerIds));
            auditPayload.put("previousValues", collegePreviousValues);
            auditLogService.logRequired(request, "MODULE_ACCESS_BULK_SET", "learner", null,
                    null, collegeEntry.getKey(), auditPayload);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("module", module);
        out.put("enabled", enabled);
        out.put("updated", updated);
        return out;
    }

    /**
     * "Why can't this student see Placements?" — with up to eight levels of override this is the
     * question the support desk will ask most, so it is a first-class endpoint rather than
     * something to reconstruct by hand.
     */
    public Map<String, Object> explainForLearner(UserPrincipal principal, Integer learnerId) {
        requireReadAuthority(principal, "LEARNER", learnerId);
        List<ModuleAccessResolver.ScopeRef> chain = resolver.chainFromNode("LEARNER", learnerId);
        Map<String, ModuleAccessResolver.Resolution> resolved = resolver.resolveAll(chain);

        List<Map<String, Object>> chainOut = new ArrayList<>();
        for (ModuleAccessResolver.ScopeRef ref : chain) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("scopeType", ref.scopeType);
            node.put("scopeId", ref.scopeId);
            chainOut.add(node);
        }

        List<com._42students.lms.model.AppSetting> rows = resolver.fetchRowsForScopes(
                chain.stream().map(c -> c.scopeType).collect(java.util.stream.Collectors.toList()),
                chain.stream().map(c -> c.scopeId).filter(Objects::nonNull).collect(java.util.stream.Collectors.toList()));

        List<Map<String, Object>> modules = new ArrayList<>();
        for (String module : ModuleFeatureCatalog.moduleKeys()) {
            ModuleAccessResolver.Resolution r = resolved.get(module);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("module", module);
            row.put("label", ModuleFeatureCatalog.labelFor(module));
            row.put("enabled", r == null || r.enabled);
            row.put("decidedAtLevel", r == null ? "DEFAULT" : r.level);
            row.put("decidedAtScopeId", r == null ? null : r.scopeId);
            row.put("locked", r != null && r.locked);
            row.put("enforcement", "NAV_AND_API");

            // Per-level detail for this module. Every level is included, including the ones with
            // nothing set — in an override system the empty levels and the set-but-ignored ones are
            // exactly what people misread, so the trace states both rather than listing only hits.
            List<Map<String, Object>> levels = new ArrayList<>();
            boolean decisionSeen = false;
            for (ModuleAccessResolver.ScopeRef ref : chain) {
                Boolean explicit = explicitFromRows(rows, ref.scopeType, ref.scopeId,
                        ModuleFeatureCatalog.settingKeyFor(module));
                boolean lockedHere = Boolean.TRUE.equals(explicitFromRows(rows, ref.scopeType, ref.scopeId,
                        ModuleFeatureCatalog.lockKeyFor(module)));
                boolean isDecider = r != null && ref.scopeType.equals(r.level) && Objects.equals(ref.scopeId, r.scopeId);

                String status;
                if (ModuleFeatureCatalog.levelIgnored(module, ref.scopeType)) {
                    status = "MANAGED_BY_ELIGIBILITY";
                } else if (explicit == null) {
                    status = "UNSET";
                } else if (isDecider) {
                    status = "DECIDED";
                } else if (!decisionSeen) {
                    // Narrower than the deciding level but not winning — only a lock above can do
                    // that, and it is the single most confusing state in this system.
                    status = "SHADOWED_BY_LOCK";
                } else {
                    status = "OVERRIDDEN_BY_NARROWER";
                }
                if (isDecider) decisionSeen = true;

                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("scopeType", ref.scopeType);
                entry.put("scopeId", ref.scopeId);
                entry.put("scopeName", scopeName(ref.scopeType, ref.scopeId));
                entry.put("explicitValue", explicit);
                entry.put("locked", lockedHere);
                entry.put("status", status);
                levels.add(entry);
            }
            row.put("levels", levels);
            if ("placements".equals(module) && placementEligibility != null) {
                com._42students.lms.service.tpo.PlacementEligibilityService.Resolved pe = placementEligibility.resolve(learnerId);
                Map<String, Object> elig = new LinkedHashMap<>(pe.toMap());
                elig.put("collegeHasPlacements", r == null || r.enabled);
                row.put("placementEligibility", elig);
                row.put("collegeEnabled", r == null || r.enabled);
                row.put("enabled", (r == null || r.enabled) && com._42students.lms.service.tpo.PlacementEligibilityService.ELIGIBLE.equals(pe.status));
                row.put("decidedAtLevel", (r == null || r.enabled) ? "PLACEMENT_ELIGIBILITY" : (r == null ? "DEFAULT" : r.level));
            }
            modules.add(row);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("learnerId", learnerId);
        out.put("chain", chainOut);
        out.put("modules", modules);
        return out;
    }

    // ---- authority ----------------------------------------------------------------------------

    /** All Module Access management operations require Superadmin authority. */
    private void requireModuleAccessSuperAdmin(UserPrincipal principal) {
        if (principal == null || !accessControlService.isSuperAdmin(principal)) {
            throw new AccessDeniedException("Super-admin access required");
        }
    }

    private void requireReadAuthority(UserPrincipal principal, String level, Integer scopeId) {
        requireModuleAccessSuperAdmin(principal);
        requireWithinSuperAdminScope(principal, level, scopeId);
    }

    private void requireWriteAuthority(UserPrincipal principal, String level, Integer scopeId) {
        requireModuleAccessSuperAdmin(principal);
        requireWithinSuperAdminScope(principal, level, scopeId);
    }

    /** A super-admin narrowed to one college/org may only act inside it — mirrors SuperAdminFeatureController. */
    private void requireWithinSuperAdminScope(UserPrincipal principal, String level, Integer scopeId) {
        if (principal.getCollegeId() == null && principal.getOrganizationId() == null) {
            // A global super-admin has broad authority, not permission to manufacture rows
            // against nonexistent/deleted scope IDs. Validate before writes and read traces.
            requireExistingSuperAdminScope(level, scopeId);
            return;
        }
        if ("GLOBAL".equals(level)) {
            throw new AccessDeniedException("A scoped super admin cannot change global module access");
        }
        Integer collegeId = collegeOf(level, scopeId);
        if (principal.getCollegeId() != null) {
            if (!Objects.equals(principal.getCollegeId(), collegeId)) {
                throw new AccessDeniedException("You are scoped to a single college and cannot change another college's module access");
            }
            return;
        }
        if ("ORGANIZATION".equals(level)) {
            if (!Objects.equals(principal.getOrganizationId(), scopeId)) {
                throw new AccessDeniedException("You are scoped to a single organization");
            }
            return;
        }
        // Org-scoped super-admin acting on a college-or-narrower node: the node's college must
        // belong to their organization.
        //
        // This previously fell out of the method with no check at all, behind a comment claiming
        // "chainFromNode already resolves" it — it resolves the college but never compares it to
        // the principal's org, so an org-scoped super-admin could write any college in any
        // organization. Mirrors SuperAdminFeatureController.requireScopedSuperadminCollegeWithinScope,
        // which had this right; this is the copy that didn't.
        Integer resolvedOrgId = collegeId == null
                ? null
                : collegeRepository.findById(collegeId).map(c -> c.getOrgId()).orElse(null);
        if (resolvedOrgId == null || !Objects.equals(principal.getOrganizationId(), resolvedOrgId)) {
            throw new AccessDeniedException("You are scoped to a single organization and cannot change another organization's module access");
        }
    }

    /** Validate all scope IDs even for an unrestricted super-admin; GLOBAL alone has no ID. */
    private void requireExistingSuperAdminScope(String level, Integer scopeId) {
        if ("GLOBAL".equals(level)) {
            if (scopeId != null) throw new IllegalArgumentException("GLOBAL cannot have a scopeId");
            return;
        }
        if (scopeId == null || scopeId <= 0) {
            throw new IllegalArgumentException("A positive scopeId is required for " + level);
        }
        boolean exists = switch (level) {
            case "ORGANIZATION" -> organizationRepository.findById(scopeId)
                    .filter(row -> !Boolean.TRUE.equals(row.getIsDeleted())).isPresent();
            case "COLLEGE" -> collegeRepository.findById(scopeId)
                    .filter(row -> !Boolean.TRUE.equals(row.getIsDeleted())).isPresent();
            case "DEPARTMENT" -> departmentRepository.findById(scopeId)
                    .filter(row -> !Boolean.TRUE.equals(row.getIsDeleted())).isPresent();
            case "PROGRAM" -> newProgramRepository.findById(scopeId)
                    .filter(row -> !Boolean.TRUE.equals(row.getIsDeleted())).isPresent();
            case "BATCH" -> batchRepository.findById(scopeId.longValue()).isPresent();
            case "CLASS" -> classRepository.findById(scopeId)
                    .filter(row -> !Boolean.TRUE.equals(row.getIsDeleted())).isPresent();
            case "LEARNER" -> learnerRepository.findById(scopeId)
                    .filter(row -> !Boolean.TRUE.equals(row.getIsDeleted())).isPresent();
            default -> throw new IllegalArgumentException("Unknown scope type: " + level);
        };
        if (!exists) throw new IllegalArgumentException("Unknown or deleted " + level + " scopeId: " + scopeId);
    }

    /** Which college does this node belong to? Resolved via the same chain resolution uses. */
    private Integer collegeOf(String level, Integer scopeId) {
        if ("GLOBAL".equals(level) || "ORGANIZATION".equals(level)) {
            return null;
        }
        if ("COLLEGE".equals(level)) {
            return scopeId;
        }
        for (ModuleAccessResolver.ScopeRef ref : resolver.chainFromNode(level, scopeId)) {
            if ("COLLEGE".equals(ref.scopeType)) {
                return ref.scopeId;
            }
        }
        return null;
    }

    // ---- helpers ------------------------------------------------------------------------------

    private String normalizeLevel(String scopeType) {
        String level = scopeType == null ? "" : scopeType.trim().toUpperCase(Locale.ROOT);
        if (!ModuleAccessResolver.LEVELS_NARROWEST_FIRST.contains(level)) {
            throw new IllegalArgumentException("Unknown scope type: " + scopeType);
        }
        return level;
    }

    /** The value stored *at this exact node* — null means nothing set here (inherit). */
    private Boolean readExplicit(String level, Integer scopeId, String key) {
        return ModuleFeatureCatalog.parseValue(appSettingsService.getSettingValue(level, scopeId, key));
    }

    private void audit(HttpServletRequest request, UserPrincipal principal, String level, Integer scopeId,
                       String module, Boolean enabled, Boolean locked, Boolean previous) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("scopeType", level);
        payload.put("scopeId", String.valueOf(scopeId));
        payload.put("module", module);
        payload.put("enabled", String.valueOf(enabled));
        payload.put("locked", String.valueOf(locked));
        // The stored row is overwritten in place, so the audit trail is the only record of what the
        // value used to be.
        payload.put("previousValue", String.valueOf(previous));
        auditLogService.logRequired(request, "MODULE_ACCESS_SET", level.toLowerCase(Locale.ROOT), String.valueOf(scopeId),
                null, collegeOf(level, scopeId), payload);
    }
}
