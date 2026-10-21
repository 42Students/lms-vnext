package com._42students.lms.service;
import com._42students.lms.dto.request.BulkFacultyCourseAssociationCreateRequestDTO;
import com._42students.lms.dto.request.FacultyCourseAssociationCreateRequestDTO;
import com._42students.lms.dto.response.ActiveCourseResponseDTO;
import com._42students.lms.dto.response.FacultyInfoDTO;

import java.util.List;

public interface FacultyCourseAssociationService {
    void createAssociation(FacultyCourseAssociationCreateRequestDTO associationCreateRequestDTO);
    void createBulkAssociations(BulkFacultyCourseAssociationCreateRequestDTO bulkRequestDTO);
    void deactivateAssociation(Long mappingId);
    /** Faculty id owning the given association mapping, for access-control checks before mutating it. Returns null if not found. */
    Integer getFacultyIdForAssociation(Long mappingId);
    List<Integer> fetchActiveFacultiesByCourse(int courseId);
    List<FacultyInfoDTO> fetchActiveFacultiesInfoByCourse(int courseId);
    List<ActiveCourseResponseDTO> fetchCoursesByFaculty(int facultyId);
    List<ActiveCourseResponseDTO> fetchActiveCoursesByFaculty(int facultyId);
    // Other service methods for managing associations
}
 
