package com._42students.lms.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FeatureFlagServiceTargetCollegeTest {
    private ModuleAccessResolver resolver;
    private FeatureFlagService service;

    @BeforeEach
    void setUp() {
        resolver = Mockito.mock(ModuleAccessResolver.class);
        service = new FeatureFlagService(Mockito.mock(AppSettingsService.class), resolver);
    }

    @Test
    void disabledTargetCollegeIsDeniedEvenForGlobalAdminOperation() {
        List<ModuleAccessResolver.ScopeRef> target = List.of(
                new ModuleAccessResolver.ScopeRef("COLLEGE", 9),
                new ModuleAccessResolver.ScopeRef("GLOBAL", null));
        when(resolver.chainForCollege(eq(9), eq(null))).thenReturn(target);
        when(resolver.resolveAll(target)).thenReturn(Map.of(
                "projects", new ModuleAccessResolver.Resolution(false, "COLLEGE", 9, false)));
        assertThrows(AccessDeniedException.class, () ->
                service.requireEnabledForCollege("module.projects.enabled", 9));
        verify(resolver).chainForCollege(9, null);
    }

    @Test
    void enabledTargetCollegeIsAllowed() {
        List<ModuleAccessResolver.ScopeRef> target = List.of(new ModuleAccessResolver.ScopeRef("COLLEGE", 5));
        when(resolver.chainForCollege(eq(5), eq(null))).thenReturn(target);
        when(resolver.resolveAll(target)).thenReturn(Map.of(
                "placements", new ModuleAccessResolver.Resolution(true, "COLLEGE", 5, false)));
        assertDoesNotThrow(() -> service.requireEnabledForCollege("module.placements.enabled", 5));
    }

    @Test
    void missingTargetOrUnknownModuleCannotSilentlyPass() {
        assertThrows(IllegalArgumentException.class, () ->
                service.requireEnabledForCollege("module.projects.enabled", null));
        assertThrows(IllegalArgumentException.class, () ->
                service.requireEnabledForCollege("module.courses.enabled", 5));
    }

    @Test
    void missingResolvedModuleCannotAccidentallyAuthorizeWork() {
        when(resolver.chainForCollege(eq(9), eq(null))).thenReturn(List.of());
        when(resolver.resolveAll(any())).thenReturn(Map.of());
        assertThrows(AccessDeniedException.class, () ->
                service.requireEnabledForCollege("module.placements.enabled", 9));
    }

    @Test
    void missingPrincipalResolutionMustNotGrantOptionalModule() {
        when(resolver.chainForCollege(eq(null), eq(null))).thenReturn(List.of());
        when(resolver.resolveAll(any())).thenReturn(Map.of());
        org.junit.jupiter.api.Assertions.assertFalse(
                service.isEnabledForPrincipal("module.placements.enabled", null, null));
    }

    @Test
    void legacyLookupHonorsInheritedOrganizationOff() {
        List<ModuleAccessResolver.ScopeRef> target = List.of(
                new ModuleAccessResolver.ScopeRef("COLLEGE", 5),
                new ModuleAccessResolver.ScopeRef("ORGANIZATION", 2),
                new ModuleAccessResolver.ScopeRef("GLOBAL", null));
        when(resolver.chainForCollege(eq(5), eq(null))).thenReturn(target);
        when(resolver.resolveAll(target)).thenReturn(Map.of(
                "placements", new ModuleAccessResolver.Resolution(false, "ORGANIZATION", 2, true)));
        org.junit.jupiter.api.Assertions.assertFalse(service.isEnabled("module.placements.enabled", 5));
    }
}
