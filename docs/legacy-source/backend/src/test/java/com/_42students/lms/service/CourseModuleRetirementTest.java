package com._42students.lms.service;

import com._42students.lms.model.AppSetting;
import com._42students.lms.repository.AppSettingRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Courses availability must never be configurable at any hierarchy level. */
class CourseModuleRetirementTest {

    private final AppSettingRepository repository = mock(AppSettingRepository.class);
    private final AppSettingsService settings = new AppSettingsService(repository);

    @Test
    void catalogContainsOnlyOptionalModules() {
        assertEquals(List.of("projects", "placements", "electives"), ModuleFeatureCatalog.moduleKeys());
        assertEquals(List.of("module.projects.enabled", "module.placements.enabled", "module.electives.enabled"),
                ModuleFeatureCatalog.settingKeys());
        assertEquals(null, ModuleFeatureCatalog.settingKeyFor("courses"));
        assertEquals(null, ModuleFeatureCatalog.settingKeyFor(" COURSES "));
        assertEquals(null, ModuleFeatureCatalog.lockKeyFor("courses"));
        assertEquals(null, ModuleFeatureCatalog.moduleForSettingKey("module.courses.enabled"));
        Map<String, Boolean> resolved = ModuleFeatureCatalog.resolve(Map.of("module.courses.enabled", "false"));
        assertEquals(ModuleFeatureCatalog.moduleKeys().size(), resolved.size());
        assertFalse(resolved.containsKey("courses"));
        assertTrue(resolved.get("projects"));
        assertFalse(resolved.get("placements"), "Placements is a paid module: off until switched on");
        assertTrue(resolved.get("electives"));
    }

    @Test
    void retiredKeysRejectWritesAtEveryScopeWithoutSaving() {
        for (String scope : List.of("GLOBAL", "ORGANIZATION", "COLLEGE", "DEPARTMENT", "PROGRAM",
                "BATCH", "CLASS", "LEARNER")) {
            for (String key : List.of("module.courses.enabled", "module.courses.locked", " MODULE.COURSES.ENABLED ")) {
                assertThrows(IllegalArgumentException.class,
                        () -> settings.upsert(scope, 7, key, "false"));
            }
        }
        verify(repository, never()).save(any(AppSetting.class));
    }

    @Test
    void legacyRowsAreInvisibleToGenericReadsButUnrelatedCourseSettingsSurvive() {
        AppSetting retired = new AppSetting();
        retired.setSettingKey("module.courses.enabled");
        retired.setSettingValue("false");
        AppSetting ordinary = new AppSetting();
        ordinary.setSettingKey("course.maxEnrollment");
        ordinary.setSettingValue("100");
        when(repository.findAllActiveForScope("COLLEGE", 7)).thenReturn(List.of(retired, ordinary));

        assertTrue(settings.getString("COLLEGE", 7, "module.courses.enabled").isEmpty());
        assertTrue(settings.getString("COLLEGE", 7, "module.courses.locked").isEmpty());
        assertEquals(Map.of("course.maxEnrollment", "100"), settings.getAllForScope("COLLEGE", 7));
    }
}
