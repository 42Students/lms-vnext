package com._42students.lms.repository;

import com._42students.lms.model.AppSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AppSettingRepository extends JpaRepository<AppSetting, Integer> {

    /**
     * Returns a list, not an Optional, deliberately.
     *
     * <p>Until V138 the unique key could not constrain GLOBAL rows (MySQL ignores NULLs, and
     * GLOBAL is the only scope with a null scope_id), so duplicates were possible. An Optional
     * throws on a 2-row result — which getString swallowed into "unset" and upsert/delete turned
     * into a permanent 500 on that key. Newest-first so callers can take the first and keep
     * working even if a legacy duplicate survived the migration.
     */
    @Query("SELECT s FROM AppSetting s WHERE s.isDeleted = false AND s.scopeType = :scopeType AND ((:scopeId IS NULL AND s.scopeId IS NULL) OR s.scopeId = :scopeId) AND s.settingKey = :key ORDER BY s.id DESC")
    List<AppSetting> findActiveRows(@Param("scopeType") String scopeType, @Param("scopeId") Integer scopeId, @Param("key") String key);

    @Query("SELECT s FROM AppSetting s WHERE s.isDeleted = false AND s.scopeType = :scopeType AND ((:scopeId IS NULL AND s.scopeId IS NULL) OR s.scopeId = :scopeId)")
    List<AppSetting> findAllActiveForScope(@Param("scopeType") String scopeType, @Param("scopeId") Integer scopeId);

    /**
     * Deliberately includes soft-deleted rows, unlike {@link #findActive}.
     *
     * <p>uq_app_setting_scope_key is on (scope_type, scope_id, setting_key) and does NOT include
     * is_deleted, so a soft-deleted row still occupies its natural key. Without this, upsert-ing a
     * setting that was previously deleted inserts a duplicate and dies on the constraint — see
     * AppSettingsService.upsert.
     */
    @Query("SELECT s FROM AppSetting s WHERE s.scopeType = :scopeType AND ((:scopeId IS NULL AND s.scopeId IS NULL) OR s.scopeId = :scopeId) AND s.settingKey = :key ORDER BY s.id DESC")
    List<AppSetting> findAnyIncludingDeleted(@Param("scopeType") String scopeType, @Param("scopeId") Integer scopeId, @Param("key") String key);

    @Query("SELECT s FROM AppSetting s WHERE s.isDeleted = false AND s.scopeType = :scopeType AND s.settingKey IN :keys")
    List<AppSetting> findAllActiveForScopeTypeAndKeys(@Param("scopeType") String scopeType, @Param("keys") List<String> keys);

    /**
     * Every stored value for one scope type restricted to a set of ids — used to list which students
     * in a college carry their own override. Without this, an admin could set 1,000 per-student
     * overrides in one action and then had no way to find them again.
     */
    @Query("SELECT s FROM AppSetting s WHERE s.isDeleted = false AND s.scopeType = :scopeType "
            + "AND s.scopeId IN :scopeIds AND s.settingKey IN :keys")
    List<AppSetting> findAllActiveForScopeIdsAndKeys(@Param("scopeType") String scopeType,
                                                     @Param("scopeIds") List<Integer> scopeIds,
                                                     @Param("keys") List<String> keys);

    /**
     * One query for a whole resolution chain (learner → class → batch → program → department →
     * college → organization → global), used by ModuleAccessResolver instead of one lookup per
     * level.
     *
     * <p>Deliberately over-selects slightly: it matches any listed scopeType against any listed
     * scopeId rather than only the exact (type, id) pairs, because expressing tuple-IN portably in
     * JPQL means string-concatenating the pair, which defeats the (scope_type, scope_id,
     * setting_key) index. The caller filters to exact pairs in memory — the result set is at most a
     * few dozen rows (8 levels × 3 modules × 2 keys), so the over-fetch is free and the index is
     * still used. `scopeId IS NULL` is included because GLOBAL rows carry a null scopeId.
     */
    @Query("SELECT s FROM AppSetting s WHERE s.isDeleted = false AND s.settingKey IN :keys "
            + "AND s.scopeType IN :scopeTypes AND (s.scopeId IS NULL OR s.scopeId IN :scopeIds)")
    List<AppSetting> findAllActiveForScopeChain(@Param("scopeTypes") List<String> scopeTypes,
                                                @Param("scopeIds") List<Integer> scopeIds,
                                                @Param("keys") List<String> keys);
}


