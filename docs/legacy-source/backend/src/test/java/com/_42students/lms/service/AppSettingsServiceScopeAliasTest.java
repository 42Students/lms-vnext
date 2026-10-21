package com._42students.lms.service;

import com._42students.lms.model.AppSetting;
import com._42students.lms.repository.AppSettingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class AppSettingsServiceScopeAliasTest {

    @Test
    @DisplayName("Reads ORG/ORGANIZATION scope aliases for backward compatibility")
    void readsScopeAliases() {
        AppSettingRepository repo = mock(AppSettingRepository.class);

        AppSetting legacy = new AppSetting();
        legacy.setScopeType("ORG");
        legacy.setScopeId(2);
        legacy.setSettingKey("ff.module.jobs.enabled");
        legacy.setSettingValue("false");

        when(repo.findActiveRows("ORGANIZATION", 2, "ff.module.jobs.enabled")).thenReturn(java.util.List.of());
        when(repo.findActiveRows("ORG", 2, "ff.module.jobs.enabled")).thenReturn(java.util.List.of(legacy));

        AppSettingsService svc = new AppSettingsService(repo);
        String v = svc.getSettingValue("ORGANIZATION", 2, "ff.module.jobs.enabled");

        assertEquals("false", v);
    }
}

