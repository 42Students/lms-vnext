package com._42students.lms.service;

import com._42students.lms.model.AppSetting;
import com._42students.lms.repository.AppSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * uq_app_setting_scope_key covers (scope_type, scope_id, setting_key) and does NOT include
 * is_deleted, so a soft-deleted row keeps owning its natural key. upsert() looked up active rows
 * only, so any set → delete → set-again sequence tried to INSERT a duplicate and died on the
 * constraint with a raw 500.
 *
 * <p>That sequence is entirely routine — an admin turning a module off for a student, resetting it
 * to inherit, then turning it on again — and it was found by exercising exactly that flow against
 * the running app. This is the same soft-delete/unique-key interaction that previously bit
 * tenant_domain, so it is pinned here at the shared service rather than in one caller.
 */
class AppSettingsServiceUpsertReviveTest {

    private AppSettingRepository repo;
    private AppSettingsService service;

    @BeforeEach
    void setUp() {
        repo = Mockito.mock(AppSettingRepository.class);
        service = new AppSettingsService(repo);
        when(repo.save(any(AppSetting.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("REGRESSION: upsert revives a soft-deleted row instead of inserting a duplicate that violates the unique key")
    void upsertRevivesSoftDeletedRow() {
        AppSetting softDeleted = new AppSetting();
        softDeleted.setId(42);
        softDeleted.setScopeType("LEARNER");
        softDeleted.setScopeId(159);
        softDeleted.setSettingKey("module.placements.enabled");
        softDeleted.setSettingValue("false");
        softDeleted.setIsDeleted(true);

        when(repo.findActiveRows("LEARNER", 159, "module.placements.enabled")).thenReturn(java.util.List.of());
        when(repo.findAnyIncludingDeleted("LEARNER", 159, "module.placements.enabled"))
                .thenReturn(java.util.List.of(softDeleted));

        service.upsert("LEARNER", 159, "module.placements.enabled", "true");

        ArgumentCaptor<AppSetting> saved = ArgumentCaptor.forClass(AppSetting.class);
        verify(repo).save(saved.capture());
        // Same row id -> an UPDATE, not an INSERT that would collide on uq_app_setting_scope_key.
        assertEquals(42, saved.getValue().getId());
        assertEquals("true", saved.getValue().getSettingValue());
        assertFalse(Boolean.TRUE.equals(saved.getValue().getIsDeleted()));
    }

    @Test
    @DisplayName("an active row is still updated in place, unchanged behaviour")
    void upsertUpdatesActiveRow() {
        AppSetting active = new AppSetting();
        active.setId(7);
        active.setScopeType("COLLEGE");
        active.setScopeId(6);
        active.setSettingKey("module.projects.enabled");
        active.setSettingValue("true");
        active.setIsDeleted(false);

        when(repo.findActiveRows("COLLEGE", 6, "module.projects.enabled")).thenReturn(java.util.List.of(active));

        service.upsert("COLLEGE", 6, "module.projects.enabled", "false");

        ArgumentCaptor<AppSetting> saved = ArgumentCaptor.forClass(AppSetting.class);
        verify(repo).save(saved.capture());
        assertEquals(7, saved.getValue().getId());
        assertEquals("false", saved.getValue().getSettingValue());
        // The deleted-row lookup is only a fallback; an active hit must not need it.
        verify(repo, Mockito.never()).findAnyIncludingDeleted(any(), any(), any());
    }

    @Test
    @DisplayName("a genuinely new optional setting still inserts")
    void upsertInsertsWhenNothingExists() {
        // Courses is an immutable core module, so use a genuinely configurable module here.
        when(repo.findActiveRows("LEARNER", 200, "module.placements.enabled")).thenReturn(java.util.List.of());
        when(repo.findAnyIncludingDeleted("LEARNER", 200, "module.placements.enabled")).thenReturn(java.util.List.of());

        service.upsert("LEARNER", 200, "module.placements.enabled", "false");

        ArgumentCaptor<AppSetting> saved = ArgumentCaptor.forClass(AppSetting.class);
        verify(repo).save(saved.capture());
        assertEquals("LEARNER", saved.getValue().getScopeType());
        assertEquals(200, saved.getValue().getScopeId());
        assertEquals("false", saved.getValue().getSettingValue());
    }
}
