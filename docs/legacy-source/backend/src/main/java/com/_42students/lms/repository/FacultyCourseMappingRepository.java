package com._42students.lms.repository;

import com._42students.lms.model.FacultyCourseMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacultyCourseMappingRepository extends JpaRepository<FacultyCourseMapping, Integer> {
    @Query(value = "select distinct course_id from faculty_course_mapping where faculty_id=:facultyId and active=1", nativeQuery = true)
    List<Integer> getCourses(@Param("facultyId") int facultyId);

    @Query(value = "select * from faculty_course_mapping where faculty_id=:facultyId and active=1", nativeQuery = true)
    List<FacultyCourseMapping> getFacultyClassMapping(@Param("facultyId") int facultyId);

    @Query(value = "select distinct faculty_id from faculty_course_mapping where class_id=:classId and active=1", nativeQuery = true)
    List<Integer> getFacultyIdsForClass(@Param("classId") int classId);

    default Integer getFacultyId(int classId) {
        List<Integer> facultyIds = getFacultyIdsForClass(classId);
        if (facultyIds.isEmpty()) return null;
        if (facultyIds.size() != 1) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Multiple instructors teach this class; specify the course and faculty");
        }
        return facultyIds.get(0);
    }

    @Query(value = "select course_id, faculty_id, class_id, id from faculty_course_mapping where course_id=:courseId and active=1", nativeQuery = true)
    List<Object[]> findByCourseId(@Param("courseId") int courseId);

    List<FacultyCourseMapping> findByFacultyIdAndCourseIdAndClassId(int facultyId, Integer courseId, Integer classId);

    // metrics
    @Query(value = "SELECT COUNT(DISTINCT class_id) FROM faculty_course_mapping WHERE faculty_id = :facultyId AND active = 1", nativeQuery = true)
    int countUniqueClassesByFacultyId(@Param("facultyId") int facultyId);
    
    @Query(value = "SELECT COUNT(DISTINCT course_id) FROM faculty_course_mapping WHERE faculty_id = :facultyId AND active = 1", nativeQuery = true)
    int countUniqueCoursesByFacultyId(@Param("facultyId") int facultyId);
    
    @Query(value = "SELECT COUNT(DISTINCT class_id) FROM faculty_course_mapping WHERE faculty_id = :facultyId AND course_id = :courseId AND active = 1", nativeQuery = true)
    int countUniqueClassesForCourse(@Param("facultyId") int facultyId, @Param("courseId") int courseId);
    
    @Query(value = "SELECT COUNT(DISTINCT course_id) FROM faculty_course_mapping WHERE faculty_id = :facultyId AND class_id = :classId AND active = 1", nativeQuery = true)
    int countUniqueCoursesForClass(@Param("facultyId") int facultyId, @Param("classId") int classId);
    

 
}
 
