package com._42students.lms.repository;

import com._42students.lms.model.ProjectTemplateVersion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectTemplateVersionRepository extends JpaRepository<ProjectTemplateVersion, Integer> {

    @Query("SELECT v FROM ProjectTemplateVersion v WHERE v.templateId = :templateId ORDER BY v.templateVersion DESC, v.changedAt DESC, v.id DESC")
    List<ProjectTemplateVersion> findByTemplateIdOrderByVersionDesc(@Param("templateId") Integer templateId);

    /**
     * Bounded variant of findByTemplateIdOrderByVersionDesc — a template edited repeatedly
     * over a long lifetime can accumulate an unbounded number of version rows, and the
     * unpaginated GET /{templateId}/versions endpoint had no cap on how many it returned.
     * Callers pass PageRequest.of(0, 50) to keep only the most recent 50 versions.
     */
    @Query("SELECT v FROM ProjectTemplateVersion v WHERE v.templateId = :templateId ORDER BY v.templateVersion DESC, v.changedAt DESC, v.id DESC")
    List<ProjectTemplateVersion> findByTemplateIdOrderByVersionDesc(@Param("templateId") Integer templateId, Pageable pageable);

    @Query("SELECT v FROM ProjectTemplateVersion v WHERE v.templateId = :templateId ORDER BY v.templateVersion DESC, v.changedAt DESC, v.id DESC")
    Page<ProjectTemplateVersion> findPageByTemplateId(@Param("templateId") Integer templateId, Pageable pageable);
}
