package com._42students.lms.service;

import com._42students.lms.model.AppSetting;
import com._42students.lms.repository.AppSettingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class AppSettingsService {

    private final AppSettingRepository appSettingRepository;

    @Value("${app.base-domain:42lms.com}")
    private String baseDomainDefault;

    @Value("${app.global-host:}")
    private String globalHostDefault;

    @Value("${app.cookie.domain:}")
    private String cookieDomainDefault;

    public AppSettingsService(AppSettingRepository appSettingRepository) {
        this.appSettingRepository = appSettingRepository;
    }

    /**
     * Course availability is a core LMS capability. Do not let generic tenant-settings APIs
     * recreate the former module-level enable/lock flags after removing them from the catalog.
     * Exact-key matching deliberately leaves legitimate per-course settings untouched.
     */
    public static boolean isRetiredCourseModuleSetting(String key) {
        if (key == null) return false;
        String normalized = key.trim().toLowerCase(Locale.ROOT);
        return "module.courses.enabled".equals(normalized) || "module.courses.locked".equals(normalized);
    }

    public String getBaseDomain() {
        return getString("GLOBAL", null, "baseDomain").orElse(baseDomainDefault);
    }

    /**
     * The domain college subdomains are allotted under: kluniversity + "." + this. Prod: 42lms.com (the default);
     * dev sets GLOBAL tenantSubdomainBase = development.42lms.com. Both have wildcard DNS and a wildcard certificate,
     * so an allotted subdomain is live immediately.
     */
    public String getTenantSubdomainBase() {
        return getString("GLOBAL", null, "tenantSubdomainBase").orElse("42lms.com");
    }

    public String getGlobalHost() {
        return getString("GLOBAL", null, "globalHost").orElse(globalHostDefault);
    }

    public String getCookieDomain() {
        return getString("GLOBAL", null, "cookieDomain").orElse(cookieDomainDefault);
    }

    /** SameSite defaults to Lax; GLOBAL cookieSameSite can override it. */
    public String getCookieSameSite() {
        return getString("GLOBAL", null, "cookieSameSite").orElse("Lax");
    }

    public int getOtpMaxAttempts() {
        return getInt("GLOBAL", null, "otp.maxAttempts", 5);
    }

    public int getOtpWindowSeconds() {
        return getInt("GLOBAL", null, "otp.windowSeconds", 900);
    }

    public int getBulkStatusMax() {
        return getInt("GLOBAL", null, "ops.bulkStatusMax", 100);
    }

    public int getProgressBulkIdsMax() {
        return getInt("GLOBAL", null, "ops.progressBulkIdsMax", 500);
    }

    public int getIdentityMaxJsonSize() {
        return getInt("GLOBAL", null, "ops.identityMaxJsonSize", 10_000);
    }

    public Optional<String> getString(String scopeType, Integer scopeId, String key) {
        if (isRetiredCourseModuleSetting(key)) return Optional.empty();
        // Module enabled/locked reads are an authorization boundary. DB errors, malformed
        // data or conflicting active rows must not become a silently absent override.
        if (ModuleFeatureCatalog.settingAndLockKeys().contains(key)) {
            return getStrictModuleSetting(scopeType, scopeId, key);
        }
        String normalizedScope = normalizeScopeType(scopeType);
        try {
            Optional<String> primary = appSettingRepository.findActiveRows(normalizedScope, scopeId, key)
                    .stream().findFirst().map(AppSetting::getSettingValue);
            if (primary.isPresent()) return primary;
            String alias = legacyAliasScopeType(normalizedScope);
            if (alias != null) {
                return appSettingRepository.findActiveRows(alias, scopeId, key)
                        .stream().findFirst().map(AppSetting::getSettingValue);
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Optional<String> getStrictModuleSetting(String scopeType, Integer scopeId, String key) {
        String scope = normalizeScopeType(scopeType);
        try {
            List<AppSetting> primary = appSettingRepository.findActiveRows(scope, scopeId, key);
            if (!primary.isEmpty()) return requireUniqueModuleDecision(primary);
            String alias = legacyAliasScopeType(scope);
            if (alias != null) return requireUniqueModuleDecision(
                    appSettingRepository.findActiveRows(alias, scopeId, key));
            return Optional.empty();
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "OPTIONAL_MODULE_SETTINGS_UNAVAILABLE", e);
        }
    }

    private Optional<String> requireUniqueModuleDecision(List<AppSetting> rows) {
        String firstValue = null;
        Boolean firstDecision = null;
        for (AppSetting row : rows) {
            Boolean parsed = ModuleFeatureCatalog.parseValue(row.getSettingValue());
            if (parsed == null) throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "INVALID_OPTIONAL_MODULE_SETTING");
            if (firstDecision != null && !firstDecision.equals(parsed)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "CONFLICTING_OPTIONAL_MODULE_SETTINGS");
            }
            firstDecision = parsed;
            if (firstValue == null) firstValue = row.getSettingValue();
        }
        return Optional.ofNullable(firstValue);
    }

    public String getSettingValue(String scopeType, Integer scopeId, String key) {
        return getString(scopeType, scopeId, key).orElse(null);
    }

    public int getInt(String scopeType, Integer scopeId, String key, int defaultValue) {
        String raw = getString(scopeType, scopeId, key).orElse(null);
        if (raw == null || raw.trim().isEmpty()) return defaultValue;
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public double getDouble(String scopeType, Integer scopeId, String key, double defaultValue) {
        String raw = getString(scopeType, scopeId, key).orElse(null);
        if (raw == null || raw.trim().isEmpty()) return defaultValue;
        try {
            return Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public Map<String, String> getAllForScope(String scopeType, Integer scopeId) {
        String normalizedScope = normalizeScopeType(scopeType);
        Map<String, String> out = new HashMap<>();
        List<AppSetting> list = appSettingRepository.findAllActiveForScope(normalizedScope, scopeId);
        for (AppSetting setting : list) {
            String key = setting.getSettingKey();
            if (key != null && !isRetiredCourseModuleSetting(key)) {
                out.put(key, setting.getSettingValue());
            }
        }
        return out;
    }

    /** Batch-read settings grouped by scopeId without leaking retired course-module keys. */
    public Map<Integer, Map<String, String>> getForScopeTypeGroupedByScopeId(String scopeType, List<String> keys) {
        String normalizedScope = normalizeScopeType(scopeType);
        Map<Integer, Map<String, String>> out = new HashMap<>();
        if (keys == null || keys.isEmpty()) return out;
        List<String> activeKeys = keys.stream().filter(key -> !isRetiredCourseModuleSetting(key)).toList();
        if (activeKeys.isEmpty()) return out;
        List<AppSetting> list = appSettingRepository.findAllActiveForScopeTypeAndKeys(normalizedScope, activeKeys);
        for (AppSetting setting : list) {
            String key = setting.getSettingKey();
            if (key == null || isRetiredCourseModuleSetting(key)) continue;
            out.computeIfAbsent(setting.getScopeId(), id -> new HashMap<>()).put(key, setting.getSettingValue());
        }
        return out;
    }

    /** LEARNER-scope active overrides for optional modules only. */
    public List<AppSetting> findLearnerModuleRows(List<Integer> learnerIds) {
        if (learnerIds == null || learnerIds.isEmpty()) return List.of();
        return appSettingRepository.findAllActiveForScopeIdsAndKeys(
                "LEARNER", learnerIds, ModuleFeatureCatalog.settingKeys());
    }

    /** Batch-read learner locks before a bulk override; never N+1-query lock authority. */
    public List<AppSetting> findLearnerModuleLockRows(List<Integer> learnerIds) {
        if (learnerIds == null || learnerIds.isEmpty()) return List.of();
        return appSettingRepository.findAllActiveForScopeIdsAndKeys("LEARNER", learnerIds,
                ModuleFeatureCatalog.moduleKeys().stream().map(ModuleFeatureCatalog::lockKeyFor).toList());
    }

    /** Revives soft-deleted settings, but never retired course-module toggles. */
    public AppSetting upsert(String scopeType, Integer scopeId, String key, String value) {
        if (isRetiredCourseModuleSetting(key)) {
            throw new IllegalArgumentException("Courses is a core module and cannot be toggled");
        }
        String normalizedScope = normalizeScopeType(scopeType);
        AppSetting setting = appSettingRepository.findActiveRows(normalizedScope, scopeId, key).stream().findFirst()
                .or(() -> appSettingRepository.findAnyIncludingDeleted(normalizedScope, scopeId, key).stream().findFirst())
                .orElseGet(AppSetting::new);
        setting.setScopeType(normalizedScope);
        setting.setScopeId(scopeId);
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        setting.setIsDeleted(false);
        return appSettingRepository.save(setting);
    }

    /** Soft-delete an override; remains available for cleaning up legacy data. */
    public boolean delete(String scopeType, Integer scopeId, String key) {
        String normalizedScope = normalizeScopeType(scopeType);
        AppSetting setting = appSettingRepository.findActiveRows(normalizedScope, scopeId, key)
                .stream().findFirst().orElse(null);
        if (setting == null) {
            String alias = legacyAliasScopeType(normalizedScope);
            if (alias != null) {
                setting = appSettingRepository.findActiveRows(alias, scopeId, key)
                        .stream().findFirst().orElse(null);
            }
        }
        if (setting == null) return false;
        setting.setIsDeleted(true);
        appSettingRepository.save(setting);
        return true;
    }

    private String normalizeScopeType(String scopeType) {
        if (scopeType == null) return "GLOBAL";
        String scope = scopeType.trim().toUpperCase(Locale.ROOT);
        if (scope.isEmpty()) return "GLOBAL";
        return "ORG".equals(scope) ? "ORGANIZATION" : scope;
    }

    private String legacyAliasScopeType(String normalizedScopeType) {
        if (normalizedScopeType == null) return null;
        String scope = normalizedScopeType.trim().toUpperCase(Locale.ROOT);
        if ("ORGANIZATION".equals(scope)) return "ORG";
        if ("ORG".equals(scope)) return "ORGANIZATION";
        return null;
    }
}
