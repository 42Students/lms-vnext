package com._42students.lms.repository;

import com._42students.lms.model.ProjectWorkspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import javax.persistence.LockModeType;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ProjectWorkspaceRepository extends JpaRepository<ProjectWorkspace, Integer> {

    @Query(value = "SELECT p.id FROM ProjectWorkspace p WHERE p.isDeleted = false AND EXISTS (SELECT m.id FROM ProjectMember m "
            + "WHERE m.projectId = p.id AND m.userId = :userId AND UPPER(m.userType) = UPPER(:userType) "
            + "AND m.isDeleted = false AND (m.memberStatus IS NULL OR TRIM(m.memberStatus) = '' OR UPPER(TRIM(m.memberStatus)) = 'ACTIVE')) "
            + "AND (:status IS NULL OR :status = '' OR (:status = 'CURRENT' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%') OR UPPER(COALESCE(p.status,'')) = UPPER(:status)) "
            // Use LOCATE instead of LIKE ... ESCAPE here. Hibernate's pageable JPQL generation
            // mis-binds MySQL limit parameters when this query contains ESCAPE '\\', which breaks
            // this list before any row data is even read (see findActiveIdsByCollegeIdPaged below,
            // which had the identical bug).
            + "AND (:search IS NULL OR :search = '' OR LOCATE(LOWER(:search), LOWER(p.title)) > 0 OR LOCATE(LOWER(:search), LOWER(COALESCE(p.slug,''))) > 0 OR LOCATE(LOWER(:search), LOWER(COALESCE(p.courseLabel,''))) > 0) "
            + "AND (:attention IS NULL OR :attention = '' OR (:attention = 'BLOCKED' AND p.blocker IS NOT NULL AND TRIM(p.blocker) <> '') "
            + "OR (:attention = 'MENTOR_REVIEW' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL AND LOWER(COALESCE(d.reviewStatus,'')) IN ('submitted','under review') AND (d.reviewedAt IS NULL OR d.submittedAt > d.reviewedAt))) "
            + "OR (:attention = 'LEARNER_ACTION' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND LOWER(COALESCE(d.reviewStatus,'')) IN ('changes requested','draft')))) "
            + "ORDER BY CASE WHEN UPPER(COALESCE(p.status,'')) LIKE '%ARCHIV%' THEN 1 ELSE 0 END ASC, p.updatedAt DESC, p.id DESC",
            countQuery = "SELECT COUNT(p) FROM ProjectWorkspace p WHERE p.isDeleted = false AND EXISTS (SELECT m.id FROM ProjectMember m "
            + "WHERE m.projectId = p.id AND m.userId = :userId AND UPPER(m.userType) = UPPER(:userType) "
            + "AND m.isDeleted = false AND (m.memberStatus IS NULL OR TRIM(m.memberStatus) = '' OR UPPER(TRIM(m.memberStatus)) = 'ACTIVE')) "
            + "AND (:status IS NULL OR :status = '' OR (:status = 'CURRENT' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%') OR UPPER(COALESCE(p.status,'')) = UPPER(:status)) "
            + "AND (:search IS NULL OR :search = '' OR LOCATE(LOWER(:search), LOWER(p.title)) > 0 OR LOCATE(LOWER(:search), LOWER(COALESCE(p.slug,''))) > 0 OR LOCATE(LOWER(:search), LOWER(COALESCE(p.courseLabel,''))) > 0) "
            + "AND (:attention IS NULL OR :attention = '' OR (:attention = 'BLOCKED' AND p.blocker IS NOT NULL AND TRIM(p.blocker) <> '') "
            + "OR (:attention = 'MENTOR_REVIEW' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL AND LOWER(COALESCE(d.reviewStatus,'')) IN ('submitted','under review') AND (d.reviewedAt IS NULL OR d.submittedAt > d.reviewedAt))) "
            + "OR (:attention = 'LEARNER_ACTION' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND LOWER(COALESCE(d.reviewStatus,'')) IN ('changes requested','draft'))))")
    // MENTOR_REVIEW must mean "the learner submitted something newer than the mentor's last
    // review", not merely "this delivery has ever been submitted". Reopen-for-revision keeps the
    // historical submittedAt value and sets reviewedAt, so without the timestamp comparison a
    // mentor's own reopen action immediately put the project back into their review queue before
    // the learner changed anything. This now matches the card-level deliveryNeedsMentorReview logic.
    Page<Integer> findAccessibleIdsByUserPaged(@Param("userId") Integer userId,
                                               @Param("userType") String userType,
                                               @Param("status") String status,
                                               @Param("search") String search,
                                               @Param("attention") String attention,
                                               Pageable pageable);

    default Page<ProjectWorkspace> findAccessibleByUserPaged(Integer userId, String userType, String status,
                                                             String search, String attention, Pageable pageable) {
        return loadPageInOrder(findAccessibleIdsByUserPaged(userId, userType, status, search, attention, pageable));
    }

    @Query("SELECT p FROM ProjectWorkspace p WHERE p.id IN :ids AND p.isDeleted = false")
    List<ProjectWorkspace> findActiveByIdsUnsorted(@Param("ids") List<Integer> ids);

    /** Newest first. Sorted here, not by MySQL: see {@link #loadPageInOrder}. */
    default List<ProjectWorkspace> findActiveByIds(List<Integer> ids) {
        return sortNewestFirst(findActiveByIdsUnsorted(ids));
    }

    @Query("SELECT p FROM ProjectWorkspace p WHERE p.slug = :slug AND p.isDeleted = false")
    Optional<ProjectWorkspace> findActiveBySlug(@Param("slug") String slug);

    @Query("SELECT p FROM ProjectWorkspace p WHERE p.id = :id AND p.isDeleted = false")
    Optional<ProjectWorkspace> findActiveById(@Param("id") Integer id);

    @Query("SELECT p FROM ProjectWorkspace p WHERE p.teamGroupId = :groupId AND p.isDeleted = false")
    java.util.List<ProjectWorkspace> findActiveByTeamGroupId(@Param("groupId") Long groupId);

    /**
     * 2.6: closes the "only one ACTIVE sprint per project" TOCTOU -- startSprint reads sibling
     * sprints then writes with no lock and no unique constraint, so two mentors starting
     * different sprints concurrently can both pass the check. Taking a DB-level PESSIMISTIC_WRITE
     * lock on the parent project row before that read+write (same pattern as
     * ClassScheduleServiceImpl's faculty/class/hall locks) serializes concurrent startSprint
     * calls for the same project on the DB, so the second one re-checks siblings (including the
     * first one's now-committed row) before writing ACTIVE.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ProjectWorkspace p WHERE p.id = :id")
    Optional<ProjectWorkspace> findByIdForUpdate(@Param("id") Integer id);

    // College-scoped variants — the plain findActiveBySlug/findActiveById above have no tenant
    // check built in, so any new caller that forgets to separately verify collegeId leaks
    // cross-college data. Prefer these for anything reachable with an admin-supplied collegeId.
    @Query("SELECT p FROM ProjectWorkspace p WHERE p.slug = :slug AND p.collegeId = :collegeId AND p.isDeleted = false")
    Optional<ProjectWorkspace> findActiveBySlugAndCollegeId(@Param("slug") String slug, @Param("collegeId") Integer collegeId);

    @Query("SELECT p FROM ProjectWorkspace p WHERE p.id = :id AND p.collegeId = :collegeId AND p.isDeleted = false")
    Optional<ProjectWorkspace> findActiveByIdAndCollegeId(@Param("id") Integer id, @Param("collegeId") Integer collegeId);

    @Query("SELECT p FROM ProjectWorkspace p WHERE p.collegeId = :collegeId AND p.isDeleted = false")
    List<ProjectWorkspace> findActiveByCollegeIdUnsorted(@Param("collegeId") Integer collegeId);

    /** Newest first. Sorted here, not by MySQL: see {@link #loadPageInOrder}. */
    default List<ProjectWorkspace> findActiveByCollegeId(Integer collegeId) {
        return sortNewestFirst(findActiveByCollegeIdUnsorted(collegeId));
    }

    // DB-level paginated + filtered variant of findActiveByCollegeId — the plain version above
    // loads a college's ENTIRE workspace list into memory on every list/search request, which at
    // 3000-5000 students (bulkCreateProjectsForClass creates one workspace per learner, so
    // workspace count scales with enrollment, not a small "team count") means full-table loads on
    // every keystroke in the admin search box. status/search are pushed into the query itself
    // (not filtered in Java after fetch) so pagination and result counts stay consistent.
    @Query(
            // Use LOCATE instead of LIKE ... ESCAPE here. Hibernate's pageable JPQL generation
            // mis-binds MySQL limit parameters when this query contains ESCAPE '\\', which breaks
            // the college-admin projects list in production before any row data is read.
            value = "SELECT p.id FROM ProjectWorkspace p WHERE p.collegeId = :collegeId AND p.isDeleted = false "
                    + "AND (:status IS NULL OR :status = '' OR UPPER(p.status) = UPPER(:status)) "
                    + "AND (:search IS NULL OR :search = '' OR LOCATE(LOWER(:search), LOWER(p.title)) > 0 OR LOCATE(LOWER(:search), LOWER(p.slug)) > 0) "
                    + "AND (:view IS NULL OR :view = '' "
                    + "OR (:view = 'SUBMITTED' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL)) "
                    + "OR (:view = 'NOT_SUBMITTED' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND NOT EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL)) "
                    + "OR (:view = 'AT_RISK' AND (p.blocker IS NOT NULL AND TRIM(p.blocker) <> '' OR p.updatedAt < :staleCutoff OR EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND LOWER(COALESCE(d.reviewStatus,'')) IN ('submitted','under review')))) "
                    + "OR (:view = 'SUBMITTED_PENDING_REVIEW' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL AND LOWER(TRIM(COALESCE(d.reviewStatus,''))) IN ('','submitted'))) "
                    + "OR (:view = 'SUBMITTED_NEEDS_ACTION' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL AND LOWER(TRIM(COALESCE(d.reviewStatus,''))) IN ('draft','changes requested'))) "
                    + "OR (:view = 'SUBMITTED_REVIEWED' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL AND LOWER(TRIM(COALESCE(d.reviewStatus,''))) IN ('accepted','locked'))) "
                    + "OR (:view = 'AT_RISK_STALLED' AND p.updatedAt < :staleCutoff AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%COMPLET%' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%DONE%') "
                    + "OR (:view = 'AT_RISK_BLOCKER' AND p.blocker IS NOT NULL AND TRIM(p.blocker) <> '') "
                    + "OR (:view = 'AT_RISK_REVIEW' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND LOWER(COALESCE(d.reviewStatus,'')) IN ('submitted','under review'))) "
                    + "OR (:view = 'READINESS_OVERRIDE' AND p.readinessOverride IS NOT NULL)) "
                    + "ORDER BY p.updatedAt DESC",
            countQuery = "SELECT COUNT(p) FROM ProjectWorkspace p WHERE p.collegeId = :collegeId AND p.isDeleted = false "
                    + "AND (:status IS NULL OR :status = '' OR UPPER(p.status) = UPPER(:status)) "
                    + "AND (:search IS NULL OR :search = '' OR LOCATE(LOWER(:search), LOWER(p.title)) > 0 OR LOCATE(LOWER(:search), LOWER(p.slug)) > 0) "
                    + "AND (:view IS NULL OR :view = '' "
                    + "OR (:view = 'SUBMITTED' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL)) "
                    + "OR (:view = 'NOT_SUBMITTED' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND NOT EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL)) "
                    + "OR (:view = 'AT_RISK' AND (p.blocker IS NOT NULL AND TRIM(p.blocker) <> '' OR p.updatedAt < :staleCutoff OR EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND LOWER(COALESCE(d.reviewStatus,'')) IN ('submitted','under review')))) "
                    + "OR (:view = 'SUBMITTED_PENDING_REVIEW' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL AND LOWER(TRIM(COALESCE(d.reviewStatus,''))) IN ('','submitted'))) "
                    + "OR (:view = 'SUBMITTED_NEEDS_ACTION' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL AND LOWER(TRIM(COALESCE(d.reviewStatus,''))) IN ('draft','changes requested'))) "
                    + "OR (:view = 'SUBMITTED_REVIEWED' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND d.submittedAt IS NOT NULL AND LOWER(TRIM(COALESCE(d.reviewStatus,''))) IN ('accepted','locked'))) "
                    + "OR (:view = 'AT_RISK_STALLED' AND p.updatedAt < :staleCutoff AND UPPER(COALESCE(p.status,'')) NOT LIKE '%ARCHIV%' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%COMPLET%' AND UPPER(COALESCE(p.status,'')) NOT LIKE '%DONE%') "
                    + "OR (:view = 'AT_RISK_BLOCKER' AND p.blocker IS NOT NULL AND TRIM(p.blocker) <> '') "
                    + "OR (:view = 'AT_RISK_REVIEW' AND EXISTS (SELECT d.id FROM ProjectDelivery d WHERE d.projectId = p.id AND LOWER(COALESCE(d.reviewStatus,'')) IN ('submitted','under review'))) "
                    + "OR (:view = 'READINESS_OVERRIDE' AND p.readinessOverride IS NOT NULL))"
    )
    Page<Integer> findActiveIdsByCollegeIdPaged(
            @Param("collegeId") Integer collegeId,
            @Param("status") String status,
            @Param("search") String search,
            @Param("view") String view,
            @Param("staleCutoff") java.time.LocalDateTime staleCutoff,
            Pageable pageable
    );

    default Page<ProjectWorkspace> findActiveByCollegeIdPaged(Integer collegeId, String status, String search, String view,
                                                              java.time.LocalDateTime staleCutoff, Pageable pageable) {
        return loadPageInOrder(findActiveIdsByCollegeIdPaged(collegeId, status, search, view, staleCutoff, pageable));
    }

    // Backs the admin "restore a deleted workspace" view — findActiveByCollegeId excludes
    // soft-deleted rows entirely, so there was previously no query an admin UI could even call
    // to list what's recoverable.
    @Query(
            value = "SELECT p.id FROM ProjectWorkspace p WHERE p.collegeId = :collegeId AND p.isDeleted = true ORDER BY p.updatedAt DESC",
            countQuery = "SELECT COUNT(p) FROM ProjectWorkspace p WHERE p.collegeId = :collegeId AND p.isDeleted = true"
    )
    Page<Integer> findDeletedIdsByCollegeId(@Param("collegeId") Integer collegeId, Pageable pageable);

    default Page<ProjectWorkspace> findDeletedByCollegeId(Integer collegeId, Pageable pageable) {
        return loadPageInOrder(findDeletedIdsByCollegeId(collegeId, pageable));
    }

    @Query("SELECT p FROM ProjectWorkspace p WHERE p.classId = :classId AND p.isDeleted = false " +
            "AND ((:templateId IS NULL AND p.templateId IS NULL) OR p.templateId = :templateId)")
    List<ProjectWorkspace> findActiveByClassIdAndTemplateId(@Param("classId") Integer classId, @Param("templateId") Integer templateId);

    /**
     * How many live workspaces are attached to a template.
     *
     * Used to report the blast radius of a template rollback. Workspaces resolve their
     * never-materialized ("virtual") sections from the CURRENTLY attached template on every read,
     * so rolling a template back rewrites what every attached cohort sees — an admin fixing a typo
     * previously had no indication of how many live projects they were about to change.
     */
    @Query("SELECT COUNT(p) FROM ProjectWorkspace p WHERE p.isDeleted = false AND p.templateId = :templateId")
    long countActiveByTemplateId(@Param("templateId") Integer templateId);

    /** Workspaces still reading the live template (no pinned snapshot): the ones a template rollback actually changes. */
    @Query("SELECT COUNT(p) FROM ProjectWorkspace p WHERE p.isDeleted = false AND p.templateId = :templateId AND p.templateSnapshot IS NULL")
    long countActiveLiveLinkedByTemplateId(@Param("templateId") Integer templateId);

    /**
     * The same live workspaces, by name, so the rollback confirmation can say *which* cohorts it
     * is about to change rather than only how many. Paged because a widely-used template can have
     * hundreds attached and the confirmation only ever shows the first few.
     */
    @Query("SELECT p.id FROM ProjectWorkspace p WHERE p.isDeleted = false AND p.templateId = :templateId ORDER BY p.title ASC")
    List<Integer> findActiveIdsByTemplateId(@Param("templateId") Integer templateId,
                                            org.springframework.data.domain.Pageable pageable);

    default List<ProjectWorkspace> findActiveByTemplateId(Integer templateId, org.springframework.data.domain.Pageable pageable) {
        return loadInOrder(findActiveIdsByTemplateId(templateId, pageable));
    }

    // Audit trails must remain viewable even after a project is soft-deleted, so these lookups
    // deliberately do not filter on isDeleted.
    @Query("SELECT p FROM ProjectWorkspace p WHERE p.slug = :slug")
    Optional<ProjectWorkspace> findBySlugAny(@Param("slug") String slug);

    // ---- Why the list queries above select ids and sort in Java --------------------------------
    // A workspace row carries several large JSON columns (template_snapshot alone reaches ~400 KB).
    // MySQL fails with "Out of sort memory" (error 1038; sort_buffer_size is 256 KB) on ANY ORDER BY
    // over full rows once a handful of them exist, even for a user who can see a single project: the
    // admin list, the mentor/learner list and the deleted list all returned HTTP 500. Sorting only
    // the ids keeps every sort row tiny, and loading rows by primary key needs no sort at all.
    // MySqlRepositoryQueriesIT seeds large rows into a real MySQL to keep this from coming back.

    /** Loads the rows for a page of ids in that page's order; no ORDER BY is sent to MySQL. */
    default Page<ProjectWorkspace> loadPageInOrder(Page<Integer> ids) {
        return new PageImpl<>(loadInOrder(ids.getContent()), ids.getPageable(), ids.getTotalElements());
    }

    default List<ProjectWorkspace> loadInOrder(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        Map<Integer, ProjectWorkspace> byId = new HashMap<>();
        for (ProjectWorkspace workspace : findAllById(ids)) {
            byId.put(workspace.getId(), workspace);
        }
        List<ProjectWorkspace> ordered = new java.util.ArrayList<>(ids.size());
        for (Integer id : ids) {
            ProjectWorkspace workspace = byId.get(id);
            if (workspace != null) {
                ordered.add(workspace);
            }
        }
        return ordered;
    }

    /** updated_at DESC with NULLs last, id DESC as tie-break: what MySQL's ORDER BY used to give. */
    static List<ProjectWorkspace> sortNewestFirst(List<ProjectWorkspace> rows) {
        List<ProjectWorkspace> sorted = new java.util.ArrayList<>(rows);
        sorted.sort(Comparator
                .comparing(ProjectWorkspace::getUpdatedAt, Comparator.nullsLast(Comparator.<java.time.LocalDateTime>reverseOrder()))
                .thenComparing(ProjectWorkspace::getId, Comparator.nullsLast(Comparator.<Integer>reverseOrder())));
        return sorted;
    }
}
