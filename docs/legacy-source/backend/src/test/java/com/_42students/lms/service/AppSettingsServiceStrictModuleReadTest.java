package com._42students.lms.service;

import com._42students.lms.model.AppSetting;
import com._42students.lms.repository.AppSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class AppSettingsServiceStrictModuleReadTest {
    private static final String KEY = "module.projects.enabled";
    private AppSettingRepository repo;
    private AppSettingsService service;

    @BeforeEach
    void setUp() {
        repo = Mockito.mock(AppSettingRepository.class);
        service = new AppSettingsService(repo);
    }

    private AppSetting row(String value) {
        AppSetting result = new AppSetting();
        result.setSettingKey(KEY);
        result.setSettingValue(value);
        return result;
    }

    @Test
    void databaseFailureNeverPretendsModuleUnset() {
        when(repo.findActiveRows("COLLEGE", 5, KEY)).thenThrow(new RuntimeException("db down"));
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.getSettingValue("COLLEGE", 5, KEY));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        assertEquals("OPTIONAL_MODULE_SETTINGS_UNAVAILABLE", error.getReason());
    }

    @Test
    void malformedActiveModuleValueCannotBecomeUnset() {
        when(repo.findActiveRows("COLLEGE", 5, KEY)).thenReturn(List.of(row("garbage")));
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.getSettingValue("COLLEGE", 5, KEY));
        assertEquals("INVALID_OPTIONAL_MODULE_SETTING", error.getReason());
    }

    @Test
    void conflictingDuplicateRowsCannotDependOnIterationOrder() {
        when(repo.findActiveRows("COLLEGE", 5, KEY)).thenReturn(List.of(row("true"), row("false")));
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.getSettingValue("COLLEGE", 5, KEY));
        assertEquals("CONFLICTING_OPTIONAL_MODULE_SETTINGS", error.getReason());
    }

    @Test
    void equivalentAliasesAndMissingRowsRemainCompatible() {
        when(repo.findActiveRows("COLLEGE", 5, KEY)).thenReturn(List.of(row("false"), row("off")));
        assertEquals("false", service.getSettingValue("COLLEGE", 5, KEY));
        assertNull(service.getSettingValue("GLOBAL", null, KEY));
    }
}
