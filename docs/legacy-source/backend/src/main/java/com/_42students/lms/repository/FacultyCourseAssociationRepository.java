package com._42students.lms.repository;

import com._42students.lms.model.FacultyCourseAssociation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacultyCourseAssociationRepository extends JpaRepository<FacultyCourseAssociation, Long> {

    @Query("SELECT fc.courseId FROM FacultyCourseAssociation fc WHERE fc.facultyId = :facultyId")
    List<Integer> findCourseIdsByFacultyId(int facultyId);


    @Query("SELECT fc.facultyId FROM FacultyCourseAssociation fc WHERE fc.courseId = :courseId")
    List<Integer> findFacultyIdsByCourseId(int courseId);

    @Modifying
    @Query("UPDATE FacultyCourseAssociation fc SET fc.active = 0 WHERE fc.facultyId = :facultyId AND fc.courseId = :courseId")
    void deactivateAssociation(int facultyId, int courseId);

    @Query("SELECT fca.facultyId FROM FacultyCourseAssociation fca WHERE fca.courseId = :courseId AND fca.active = 1")
    List<Integer> findActiveFacultyIdsByCourseId(int courseId);

    @Query("SELECT fca.courseId FROM FacultyCourseAssociation fca WHERE fca.facultyId = :facultyId AND fca.active = 1")
    List<Integer> findActiveCourseIdsByFacultyId(int facultyId);
    

    FacultyCourseAssociation findByFacultyIdAndCourseId(int facultyId, int courseId);




}

