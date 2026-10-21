package com._42students.lms.repository;

import com._42students.lms.model.ProjectTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import javax.persistence.LockModeType;

// Project templates went global (see V136__project_template_global.sql) — a single platform-wide
// catalog super-admin maintains and every college picks from, not a per-college tenant entity.
// The college-scoped finders this repository used to carry (findActiveByCollegeId etc.) are gone;
// every college now sees the same rows.
@Repository
public interface ProjectTemplateRepository extends JpaRepository<ProjectTemplate, Integer> {

    @Query("SELECT p FROM ProjectTemplate p WHERE p.id = :id AND p.isDeleted = false")
    Optional<ProjectTemplate> findActiveById(@Param("id") Integer id);

    @Query("SELECT p FROM ProjectTemplate p WHERE p.slug = :slug AND p.isDeleted = false")
    Optional<ProjectTemplate> findActiveBySlug(@Param("slug") String slug);

    @Query("SELECT p.id FROM ProjectTemplate p WHERE p.isDeleted = false")
    List<Integer> findAllActiveIds();

    /** Newest first. Sorted here, not by MySQL: see {@link #sortNewestFirst}. */
    default List<ProjectTemplate> findAllActive() {
        return sortNewestFirst(findAllById(findAllActiveIds()));
    }

    // Archiving soft-deletes a template (isDeleted=true), so findAllActive can never return one —
    // the list endpoint's "Archived" lifecycle filter would be permanently dead without this,
    // since there would be no query that could ever surface a template in that state. Used only
    // when the admin explicitly filters for Archived.
    @Query("SELECT p.id FROM ProjectTemplate p")
    List<Integer> findAllIdsAny();

    /** Newest first, including soft-deleted rows. Sorted here, not by MySQL: see {@link #sortNewestFirst}. */
    default List<ProjectTemplate> findAllOrderByUpdatedAtDesc() {
        return sortNewestFirst(findAllById(findAllIdsAny()));
    }

    // ---- Why the two finders above select ids and sort in Java --------------------------------
    // A template row carries large JSON columns and reaches ~480 KB in production. MySQL fails with
    // "Out of sort memory" (error 1038, sort_buffer_size 256 KB) on ANY ORDER BY over whole rows once
    // a row that size exists, even for a single-row result — this took down the project-templates
    // admin list. Sorting only the ids keeps the sort tiny; loading by primary key needs no sort.
    // MySqlRepositoryQueriesIT seeds a production-size row to keep this from coming back.

    /** updated_at DESC with NULLs last, id DESC as tie-break: what MySQL's ORDER BY used to give. */
    static List<ProjectTemplate> sortNewestFirst(List<ProjectTemplate> rows) {
        List<ProjectTemplate> sorted = new java.util.ArrayList<>(rows);
        sorted.sort(Comparator
                .comparing(ProjectTemplate::getUpdatedAt, Comparator.nullsLast(Comparator.<java.time.LocalDateTime>reverseOrder()))
                .thenComparing(ProjectTemplate::getId, Comparator.nullsLast(Comparator.<Integer>reverseOrder())));
        return sorted;
    }

    /** Row lock held to commit; serializes replace-all edits such as the bulk college assignment. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM ProjectTemplate t WHERE t.id = :id")
    Optional<ProjectTemplate> findByIdForUpdate(@Param("id") Integer id);
}
