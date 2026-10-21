package com._42students.lms.repository;

import com._42students.lms.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Integer> {

    @Query("SELECT m.projectId FROM ProjectMember m WHERE m.userId = :userId AND UPPER(m.userType) = UPPER(:userType) AND m.isDeleted = false")
    List<Integer> findProjectIdsForUser(@Param("userId") Integer userId, @Param("userType") String userType);

    @Query("SELECT m.projectId FROM ProjectMember m WHERE m.userId = :userId AND UPPER(m.userType) = UPPER(:userType) AND m.isDeleted = false AND (m.memberStatus IS NULL OR TRIM(m.memberStatus) = '' OR UPPER(TRIM(m.memberStatus)) = 'ACTIVE')")
    List<Integer> findAccessibleProjectIdsForUser(@Param("userId") Integer userId, @Param("userType") String userType);

    // project_id/user_id/user_type is a hard unique key regardless of is_deleted, so a soft-deleted
    // row for this triple must be revived (not re-inserted) when the member rejoins the project.
    @Query("SELECT m FROM ProjectMember m WHERE m.projectId = :projectId AND m.userId = :userId AND UPPER(m.userType) = UPPER(:userType)")
    Optional<ProjectMember> findByProjectAndUserAndType(@Param("projectId") Integer projectId, @Param("userId") Integer userId, @Param("userType") String userType);

    @Query("SELECT m FROM ProjectMember m WHERE m.projectId = :projectId AND m.isDeleted = false ORDER BY m.id ASC")
    List<ProjectMember> findActiveByProjectId(@Param("projectId") Integer projectId);

    // Batched variant of findActiveByProjectId for list endpoints that would otherwise issue one
    // query per row (e.g. building a project list for a whole college) — group the single
    // result set by projectId in memory instead of querying per project.
    @Query("SELECT m FROM ProjectMember m WHERE m.projectId IN :projectIds AND m.isDeleted = false ORDER BY m.id ASC")
    List<ProjectMember> findActiveByProjectIdIn(@Param("projectIds") Collection<Integer> projectIds);

    @Query("SELECT COUNT(m) > 0 FROM ProjectMember m WHERE m.projectId = :projectId AND m.userId = :userId AND UPPER(m.userType) = UPPER(:userType) AND m.isDeleted = false")
    boolean existsActiveMembership(@Param("projectId") Integer projectId, @Param("userId") Integer userId, @Param("userType") String userType);

    @Query("SELECT m FROM ProjectMember m WHERE m.projectId = :projectId AND m.isDeleted = true ORDER BY m.id ASC")
    List<ProjectMember> findInactiveByProjectId(@Param("projectId") Integer projectId);

    // Unlike findActiveByProjectIdIn, deliberately includes soft-deleted rows — used only to
    // resolve "who the mentor WAS" for the deleted-workspaces list, where deleteProject's cascade
    // has already soft-deleted every membership before this is ever queried.
    @Query("SELECT m FROM ProjectMember m WHERE m.projectId IN :projectIds ORDER BY m.id ASC")
    List<ProjectMember> findAllByProjectIdIn(@Param("projectIds") Collection<Integer> projectIds);

    // Used by SuperAdminFeatureController to warn before disabling Projects for a college: a
    // mentor's entire nav (once Projects is off) has nothing left to hide behind, so this surfaces
    // how many people that actually affects. Mirrors ProjectWorkspaceServiceImpl's own
    // isPrimaryMentorRoleLabel (null/blank/"project mentor", case-insensitive) rather than
    // introducing a second, possibly-drifting definition of "the mentor" on a project.
    @Query("SELECT COUNT(DISTINCT m.userId) FROM ProjectMember m, ProjectWorkspace p " +
            "WHERE m.projectId = p.id AND p.collegeId = :collegeId AND p.isDeleted = false " +
            "AND m.isDeleted = false AND UPPER(m.userType) = 'FACULTY' " +
            "AND (m.memberStatus IS NULL OR TRIM(m.memberStatus) = '' OR UPPER(TRIM(m.memberStatus)) = 'ACTIVE') " +
            "AND (m.roleLabel IS NULL OR TRIM(m.roleLabel) = '' OR LOWER(TRIM(m.roleLabel)) = 'project mentor')")
    long countActivePrimaryMentorsForCollege(@Param("collegeId") Integer collegeId);
}
