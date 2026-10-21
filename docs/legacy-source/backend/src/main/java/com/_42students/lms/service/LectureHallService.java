package com._42students.lms.service;

import com._42students.lms.dto.request.LectureHallDTO;
import com._42students.lms.model.LectureHall;

import java.util.List;
import java.util.Optional;

public interface LectureHallService {
    LectureHall createLectureHall(LectureHallDTO lectureHallDTO);
    List<LectureHall> findAll();
    Optional<LectureHall> findById(Integer id);
    List<LectureHall> findByCollegeId(int collegeId);
    List<LectureHall> findByOrganizationId(int orgId);
    List<LectureHall> findByDeptId(int deptId);
    LectureHall updateLectureHall(Integer id, LectureHallDTO lectureHallDTO);
    void deleteLectureHall(Integer id);

    /** A2: paged variant of the college-scoped list. Additive -- the unpaged method stays. */
    org.springframework.data.domain.Page<com._42students.lms.model.LectureHall> findByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable);
}

