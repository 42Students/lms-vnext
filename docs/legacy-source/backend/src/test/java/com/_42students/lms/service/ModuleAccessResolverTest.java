package com._42students.lms.service;

import com._42students.lms.model.AppSetting;
import com._42students.lms.model.Learner;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model._Class;
import com._42students.lms.repository.AppSettingRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/** Optional-module inheritance and authorization regression coverage. */
class ModuleAccessResolverTest {

    private static final String PLACEMENTS = "module.electives.enabled";
    private static final String PLACEMENTS_LOCK = "module.electives.locked";

    private AppSettingRepository appSettingRepository;
    private LearnerRepository learnerRepository;
    private _ClassRepository classRepository;
    private NewProgramRepository newProgramRepository;
    private ModuleAccessResolver resolver;

    @BeforeEach
    void setUp() {
        appSettingRepository = Mockito.mock(AppSettingRepository.class);
        learnerRepository = Mockito.mock(LearnerRepository.class);
        classRepository = Mockito.mock(_ClassRepository.class);
        newProgramRepository = Mockito.mock(NewProgramRepository.class);
        resolver = new ModuleAccessResolver(appSettingRepository, learnerRepository, classRepository,
                newProgramRepository,
                Mockito.mock(com._42students.lms.repository.BatchRepository.class),
                Mockito.mock(com._42students.lms.repository.DepartmentRepository.class),
                Mockito.mock(com._42students.lms.repository.CollegeRepository.class));
    }

    private AppSetting row(String scopeType, Integer scopeId, String key, String value) {
        AppSetting setting = new AppSetting();
        setting.setScopeType(scopeType);
        setting.setScopeId(scopeId);
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        return setting;
    }

    private List<ModuleAccessResolver.ScopeRef> fullChain() {
        return Arrays.asList(
                new ModuleAccessResolver.ScopeRef("LEARNER", 7),
                new ModuleAccessResolver.ScopeRef("CLASS", 30),
                new ModuleAccessResolver.ScopeRef("BATCH", 40),
                new ModuleAccessResolver.ScopeRef("PROGRAM", 50),
                new ModuleAccessResolver.ScopeRef("DEPARTMENT", 60),
                new ModuleAccessResolver.ScopeRef("COLLEGE", 5),
                new ModuleAccessResolver.ScopeRef("ORGANIZATION", 2),
                new ModuleAccessResolver.ScopeRef("GLOBAL", null));
    }

    private void storedRows(AppSetting... rows) {
        when(appSettingRepository.findAllActiveForScopeChain(any(), any(), any()))
                .thenReturn(new ArrayList<>(Arrays.asList(rows)));
    }

    @Test
    @DisplayName("nothing stored: Projects on, Placements off (paid); Courses is not a toggle")
    void nothingSet_defaultsToEnabled() {
        storedRows();
        Map<String, ModuleAccessResolver.Resolution> resolved = resolver.resolveAll(fullChain());
        assertFalse(resolved.get("placements").enabled, "Placements is a paid module: off until a college is switched on");
        assertTrue(resolved.get("projects").enabled);
        assertFalse(resolved.containsKey("courses"));
        assertEquals("DEFAULT", resolved.get("placements").level);
    }

    @Test
    @DisplayName("legacy Courses rows at any scope cannot disable or reintroduce the core module")
    void retiredCourseRowsAreIgnored() {
        storedRows(
                row("GLOBAL", null, "module.courses.enabled", "false"),
                row("COLLEGE", 5, "module.courses.locked", "true"),
                row("LEARNER", 7, "module.courses.enabled", "false"));
        Map<String, ModuleAccessResolver.Resolution> resolved = resolver.resolveAll(fullChain());
        // Exactly the optional-module catalog (projects, placements, electives, ...) and never Courses.
        assertEquals(ModuleFeatureCatalog.moduleKeys().size(), resolved.size());
        assertFalse(resolved.containsKey("courses"));
        assertTrue(resolved.get("projects").enabled);
        assertFalse(resolved.get("placements").enabled);
    }

    @Test
    @DisplayName("REGRESSION: a college-only Placements value resolves as before")
    void collegeOnlyRow_behavesExactlyAsBefore() {
        storedRows(row("COLLEGE", 5, PLACEMENTS, "false"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertFalse(result.enabled);
        assertEquals("COLLEGE", result.level);
    }

    @Test
    @DisplayName("a LEARNER value beats the college")
    void learnerLevelWins() {
        storedRows(row("COLLEGE", 5, PLACEMENTS, "true"), row("LEARNER", 7, PLACEMENTS, "false"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertFalse(result.enabled);
        assertEquals("LEARNER", result.level);
        assertEquals(7, result.scopeId);
    }

    @Test
    @DisplayName("CLASS is narrower than BATCH")
    void classBeatsBatch() {
        storedRows(row("BATCH", 40, PLACEMENTS, "false"), row("CLASS", 30, PLACEMENTS, "true"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertTrue(result.enabled);
        assertEquals("CLASS", result.level);
    }

    @Test
    @DisplayName("a narrower ON overrides a broad OFF")
    void narrowOnOverridesBroadOff() {
        storedRows(row("COLLEGE", 5, PLACEMENTS, "false"), row("BATCH", 40, PLACEMENTS, "true"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertTrue(result.enabled);
        assertEquals("BATCH", result.level);
    }

    @Test
    @DisplayName("AUTHORITY: locked COLLEGE OFF beats learner ON")
    void lockedCollegeBeatsLearner() {
        storedRows(
                row("COLLEGE", 5, PLACEMENTS, "false"),
                row("COLLEGE", 5, PLACEMENTS_LOCK, "true"),
                row("LEARNER", 7, PLACEMENTS, "true"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertFalse(result.enabled);
        assertEquals("COLLEGE", result.level);
        assertTrue(result.locked);
    }

    @Test
    @DisplayName("a locked ON also cannot be overridden")
    void lockIsSymmetric() {
        storedRows(
                row("COLLEGE", 5, PLACEMENTS, "true"),
                row("COLLEGE", 5, PLACEMENTS_LOCK, "true"),
                row("LEARNER", 7, PLACEMENTS, "false"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertTrue(result.enabled);
        assertEquals("COLLEGE", result.level);
        assertTrue(result.locked);
    }

    @Test
    @DisplayName("unlocked college setting remains overridable")
    void unlockedCollegeIsOverridable() {
        storedRows(
                row("COLLEGE", 5, PLACEMENTS, "false"),
                row("COLLEGE", 5, PLACEMENTS_LOCK, "false"),
                row("LEARNER", 7, PLACEMENTS, "true"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertTrue(result.enabled);
        assertEquals("LEARNER", result.level);
    }

    @Test
    @DisplayName("a lock without an explicit value is ignored")
    void lockWithoutValueIsIgnored() {
        storedRows(row("PROGRAM", 50, PLACEMENTS_LOCK, "true"), row("COLLEGE", 5, PLACEMENTS, "false"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertFalse(result.enabled);
        assertEquals("COLLEGE", result.level);
    }

    @Test
    @DisplayName("a non-learner ignores learner/class overrides")
    void nonLearnerChainIgnoresNarrowLevels() {
        storedRows(row("LEARNER", 7, PLACEMENTS, "false"), row("CLASS", 30, PLACEMENTS, "false"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(resolver.chainForCollege(5, 2)).get("electives");
        assertTrue(result.enabled);
        assertEquals("DEFAULT", result.level);
    }

    @Test
    @DisplayName("an override for a different learner is not matched")
    void wrongScopeIdIsNotMatched() {
        storedRows(row("LEARNER", 999, PLACEMENTS, "false"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("electives");
        assertTrue(result.enabled);
        assertEquals("DEFAULT", result.level);
    }

    @Test
    @DisplayName("settings-store failure must not turn an explicitly disabled module ON")
    void repositoryFailure_is503NotFailOpen() {
        when(appSettingRepository.findAllActiveForScopeChain(any(), any(), any()))
                .thenThrow(new RuntimeException("db down"));
        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> resolver.resolveAll(fullChain()));
        assertEquals(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
    }

    @Test
    @DisplayName("learner chain uses the class's canonical program")
    void chainForLearner_buildsFullHierarchy() {
        Learner learner = new Learner();
        learner.setId(7);
        learner.setClassId(30);
        learner.setProgramId(51);
        learner.setCollegeId(5);
        learner.setOrganizationId(2);
        learner.setDepartment("Some Free Text Dept");
        _Class klass = new _Class();
        klass.setId(30);
        klass.setBatchId(40);
        klass.setProgramId(50);
        when(classRepository.findByIdAndNotDeleted(30)).thenReturn(Optional.of(klass));
        NewProgram program = new NewProgram();
        program.setId(50);
        program.setDeptId(60);
        when(newProgramRepository.findById(50)).thenReturn(Optional.of(program));
        List<ModuleAccessResolver.ScopeRef> chain = resolver.chainForLearner(learner);
        List<String> levels = new ArrayList<>();
        for (ModuleAccessResolver.ScopeRef ref : chain) levels.add(ref.scopeType + ":" + ref.scopeId);
        assertEquals(List.of("LEARNER:7", "CLASS:30", "BATCH:40", "PROGRAM:50", "DEPARTMENT:60", "COLLEGE:5", "ORGANIZATION:2", "GLOBAL:null"), levels);
    }

    @Test
    @DisplayName("learner with no class resolves through college/global")
    void chainForLearner_toleratesMissingLinks() {
        Learner learner = new Learner();
        learner.setId(7);
        learner.setCollegeId(5);
        List<ModuleAccessResolver.ScopeRef> chain = resolver.chainForLearner(learner);
        List<String> levels = new ArrayList<>();
        for (ModuleAccessResolver.ScopeRef ref : chain) levels.add(ref.scopeType);
        assertEquals(List.of("LEARNER", "COLLEGE", "GLOBAL"), levels);
    }

    @Test
    @DisplayName("malformed active value fails closed instead of defaulting ON")
    void malformedEnabledValueCannotEnableModule() {
        storedRows(row("COLLEGE", 5, PLACEMENTS, "maybe"));
        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> resolver.resolveAll(fullChain()));
        assertEquals(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        assertEquals("INVALID_OPTIONAL_MODULE_SETTING", error.getReason());
    }

    @Test
    @DisplayName("malformed active lock fails closed instead of silently releasing authority")
    void malformedLockCannotReleaseAuthority() {
        storedRows(row("COLLEGE", 5, PLACEMENTS, "false"),
                row("COLLEGE", 5, PLACEMENTS_LOCK, "not-a-boolean"));
        org.springframework.web.server.ResponseStatusException error = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> resolver.resolveAll(fullChain()));
        assertEquals(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        assertEquals("INVALID_OPTIONAL_MODULE_SETTING", error.getReason());
    }

    @Test
    @DisplayName("contradictory duplicate active flags fail closed regardless of row order")
    void contradictoryDuplicateFlagsCannotDependOnRowOrder() {
        for (boolean reverse : new boolean[] { false, true }) {
            AppSetting enabled = row("COLLEGE", 5, PLACEMENTS, "true");
            AppSetting disabled = row("COLLEGE", 5, PLACEMENTS, "false");
            List<AppSetting> rows = reverse ? List.of(disabled, enabled) : List.of(enabled, disabled);
            org.springframework.web.server.ResponseStatusException error = assertThrows(
                    org.springframework.web.server.ResponseStatusException.class,
                    () -> resolver.resolveAll(fullChain(), rows));
            assertEquals(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
            assertEquals("CONFLICTING_OPTIONAL_MODULE_SETTINGS", error.getReason());
        }
    }

    @Test
    @DisplayName("duplicate equivalent stored values and truly absent flags preserve behavior")
    void equivalentDuplicateFlagsRemainValid() {
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain(), List.of(
                row("COLLEGE", 5, PLACEMENTS, "false"),
                row("COLLEGE", 5, PLACEMENTS, "off"))).get("electives");
        assertFalse(result.enabled);
        assertEquals("COLLEGE", result.level);
        assertFalse(resolver.resolveAll(fullChain(), List.of()).get("placements").enabled);
    }

    @Test
    @DisplayName("legacy catalog resolution never treats malformed persisted flags as ON")
    void malformedLegacyCatalogFlagIsNotEnabled() {
        assertFalse(ModuleFeatureCatalog.resolve(Map.of(PLACEMENTS, "unknown")).get("electives"));
        assertTrue(ModuleFeatureCatalog.resolve(Map.of()).get("electives"));
    }

    @Test
    @DisplayName("Placements is decided for the whole college: lower Module Access levels no longer decide it")
    void placementsIgnoresLevelsBelowTheCollege() {
        storedRows(row("COLLEGE", 5, "module.placements.enabled", "false"),
                row("LEARNER", 7, "module.placements.enabled", "true"),
                row("CLASS", 30, "module.placements.enabled", "true"));
        ModuleAccessResolver.Resolution result = resolver.resolveAll(fullChain()).get("placements");
        assertFalse(result.enabled);
        assertEquals("COLLEGE", result.level);

        storedRows(row("BATCH", 40, "module.placements.enabled", "false"));
        assertFalse(resolver.resolveAll(fullChain()).get("placements").enabled, "a batch switch has no effect: still the default (off)");
        assertTrue(ModuleFeatureCatalog.levelIgnored("placements", "department"));
        assertFalse(ModuleFeatureCatalog.levelIgnored("placements", "COLLEGE"));
        assertFalse(ModuleFeatureCatalog.levelIgnored("projects", "LEARNER"));
    }

}
