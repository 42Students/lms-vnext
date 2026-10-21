package com._42students.lms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com._42students.lms.dto.request.BulkFacultyRegisterRequest;
import com._42students.lms.dto.request.BulkValidateRequest;
import com._42students.lms.dto.request.FacultyDTO;
import com._42students.lms.dto.response.BulkFacultyRegisterResponse;
import com._42students.lms.dto.response.BulkValidateResponse;
import com._42students.lms.dto.response.FacultyCourseClassDTO;
import com._42students.lms.dto.response.FacultyCourseClassMappingDTO;
import com._42students.lms.dto.response.FacultyCourseMappingDTO;
import com._42students.lms.dto.response.FacultyCourseMappingDetailsDTO;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.FacultyCourseMapping;

import java.util.List;
import java.util.Optional;

public interface FacultyService {
    Faculty register(FacultyDTO instructorDTO);

    BulkValidateResponse bulkValidate(BulkValidateRequest request);

    BulkFacultyRegisterResponse bulkRegister(BulkFacultyRegisterRequest request);

    /**
     * Persists a single row of a bulk faculty import in its own transaction.
     *
     * <p>On the interface (rather than a private helper) so {@code bulkRegister} can call it
     * through Spring's transactional proxy and actually get {@code REQUIRES_NEW}; a bare
     * self-invocation bypasses AOP and would run every row in the caller's transaction.
     */
    com._42students.lms.model.Faculty saveBulkFacultyRow(
            com._42students.lms.dto.request.BulkFacultyItem item,
            Integer collegeId,
            String normalizedMobile,
            String normalizedEmailLower);

    Faculty getFacultyDetails(String instructorId);

    List<Integer> getCourses(int facultyId);

    void createFacultyCourses(int facultyId, int courseId, int classId);
    
    List<FacultyCourseMapping> findAllCourseMappings();

    List<FacultyCourseMappingDTO> getFacultyClassMapping(int facultyId);

    Integer getFacultyId(int classId);

    List<Faculty> getFacultyByDeptId(int deptId);

    List<Faculty> findAll();
 
    List<Faculty> fetchContactsByCollegeId(int collegeId);

    Page<Faculty> fetchAdminRosterPage(int collegeId, String search, Integer deptId,
                                       String facultyType, String status, Pageable pageable);


    /** DB-level search variant of fetchContactsByCollegeId (name/mobile/email/uniqueId/department). */
    List<Faculty> searchContactsByCollegeId(int collegeId, String search);

    List<Faculty> fetchContactsByOrganizationId(int orgId);
    FacultyCourseClassDTO getFacultyCourseMappingByCourseId(int courseId);
    void createFacultyCoursesBulk(int facultyId, int courseId, int classId);
    void deactivateCourseMapping(int mappingId);
    /** Fetch the raw FacultyCourseMapping entity by id, for access-control checks before mutating/reading it. Returns null if not found. */
    FacultyCourseMapping getCourseMappingById(int mappingId);
    List<FacultyCourseClassMappingDTO> getCourseFacultyClassMapping(int courseId);
    FacultyCourseMappingDetailsDTO getFacultyCourseMappingDetails(int mappingId);

    //metrics from here

    int getUniqueClassesTaughtByFaculty(int facultyId);
    int getUniqueCoursesTaughtByFaculty(int facultyId);
    int getUniqueClassesForCourse(int facultyId, int courseId);
    int getUniqueCoursesForClass(int facultyId, int classId);

    // CRUD operations
    Optional<Faculty> findById(Integer id);
    Faculty updateFaculty(Integer id, FacultyDTO facultyDTO);
    void deleteFaculty(Integer id);
}

