package com._42students.lms.service;

import com._42students.lms.dto.request.CollegeDTO;
import com._42students.lms.dto.response.CollegeResponseDTO;
import com._42students.lms.model.College;

import java.util.List;
import java.util.Optional;

public interface CollegeService {
    College createCollege(CollegeDTO collegeDTO);

    List<College> fetchColleges(int orgId);

    College fetchCollege(int collegeId);

    List<CollegeResponseDTO> fetchCollegeList();

    List<CollegeResponseDTO> fetchOnlyNames(int orgId);

    Optional<College> findById(Integer id);

    College updateCollege(Integer id, CollegeDTO collegeDTO);

    void deleteCollege(Integer id);
}

