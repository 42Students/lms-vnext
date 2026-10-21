package com._42students.lms.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com._42students.lms.dto.request.ClassDTO;
import com._42students.lms.model._Class;

public interface ClassService {
    _Class register(ClassDTO classDTO);

    _Class getClassDetail(String classId);

    List<_Class> findAll();

    String getClassNameById(String classId);

    Map<Integer, String> getClassesByProgram(int programId);

    List<_Class> getClassesByCollegeId(int collegeId);

    List<_Class> getClassesByOrganizationId(int orgId);

    Optional<_Class> findById(Integer id);

    _Class updateClass(Integer id, ClassDTO classDTO);

    void deleteClass(Integer id);

    /** A2: paged variant of the college-scoped list. Additive -- the unpaged method stays. */
    org.springframework.data.domain.Page<_Class> getClassesByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable);
}
 

