package com._42students.lms.repository;

import com._42students.lms.model.ProjectTemplateCollege;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTemplateCollegeRepository extends JpaRepository<ProjectTemplateCollege, Integer> {

    boolean existsByTemplateIdAndCollegeId(Integer templateId, Integer collegeId);

    Optional<ProjectTemplateCollege> findByTemplateIdAndCollegeId(Integer templateId, Integer collegeId);

    List<ProjectTemplateCollege> findByCollegeId(Integer collegeId);

    // Not used yet — kept for a future "which colleges have this template" view on the
    // template's own page, same shape as the college-scoped lookup above.
    List<ProjectTemplateCollege> findByTemplateId(@Param("templateId") Integer templateId);

    void deleteByTemplateIdAndCollegeId(Integer templateId, Integer collegeId);
}
