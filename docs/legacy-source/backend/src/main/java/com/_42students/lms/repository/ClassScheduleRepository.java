package com._42students.lms.repository;

import com._42students.lms.model.ClassSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

// ID type must match ClassSchedule's id (BaseModel: int). With Long here every findById threw
// "Provided id of the wrong type ... Expected Integer, got Long", so update/delete always 500'd.
@Repository
public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Integer> {

        @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE class_id = :classId AND is_deleted = 0", nativeQuery = true)
        int getClassScheduleCountByClassId(@Param("classId") int classId);

        /**
         * Sessions for this class that have actually STARTED, i.e. the only ones that can
         * legitimately count toward an attendance percentage.
         *
         * getClassScheduleCountByClassId above counts every scheduled session including future
         * ones. Used as an attendance denominator that inflates the percentage massively: a
         * learner cannot be marked absent from a class that has not happened, so early in a term
         * everyone scores near 100% regardless of actual attendance. The frontend already
         * corrects for this (StudentAttendanceView/TeacherAttendanceView filter to "held"
         * sessions); this brings the backend in line so every consumer agrees.
         */
        @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE class_id = :classId AND is_deleted = 0 "
                + "AND start_time IS NOT NULL AND start_time <= NOW()", nativeQuery = true)
        int getHeldClassScheduleCountByClassId(@Param("classId") int classId);

        /**
         * 2.5: per-course variant of getHeldClassScheduleCountByClassId. getAttendancePercentage
         * aggregates every course a class has ever had a session for; exam eligibility is normally
         * assessed per subject, so this (additive, doesn't change the existing class-wide endpoint)
         * backs a new per-course percentage.
         */
        @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE class_id = :classId AND course_id = :courseId "
                + "AND is_deleted = 0 AND start_time IS NOT NULL AND start_time <= NOW()", nativeQuery = true)
        int getHeldClassScheduleCountByClassIdAndCourseId(@Param("classId") int classId, @Param("courseId") int courseId);

    @Query(value = "SELECT * FROM class_schedule WHERE faculty_id = :facultyId AND start_time >= :startTime" +
            " AND start_time <= :endTime AND is_deleted = 0", nativeQuery = true)
    List<ClassSchedule> getClassSchedule(@Param("facultyId") String facultyId,
                                         @Param("startTime") Date startTime,
                                         @Param("endTime") Date endTime);

    @Query(value = "SELECT * FROM class_schedule WHERE id = :classScheduleId AND is_deleted = 0", nativeQuery = true)
    ClassSchedule getClassScheduleDetail(@Param("classScheduleId") int classScheduleId);

    @Query(value = "SELECT * FROM class_schedule WHERE class_id = :classId AND start_time >= :startTime" +
            " AND end_time <= :endTime AND is_deleted = 0", nativeQuery = true)
    List<ClassSchedule> getClassScheduleByClassId(@Param("classId") String classId,
                                                  @Param("startTime") Date startTime,
                                                  @Param("endTime") Date endTime);

    /** A learner's timetable across every class they belong to (home section plus elective offerings). */
    @Query(value = "SELECT * FROM class_schedule WHERE class_id IN (:classIds) AND start_time >= :startTime" +
            " AND end_time <= :endTime AND is_deleted = 0", nativeQuery = true)
    List<ClassSchedule> getClassScheduleByClassIds(@Param("classIds") List<Integer> classIds,
                                                   @Param("startTime") Date startTime,
                                                   @Param("endTime") Date endTime);

    /** Future sessions of one class that overlap sessions of another — the elective clash warning. */
    @Query(value = "SELECT COUNT(*) FROM class_schedule a JOIN class_schedule b ON b.class_id = :otherClassId AND b.is_deleted = 0 " +
            "AND a.start_time < b.end_time AND b.start_time < a.end_time " +
            "WHERE a.class_id = :classId AND a.is_deleted = 0 AND a.end_time >= NOW()", nativeQuery = true)
    long countFutureOverlaps(@Param("classId") int classId, @Param("otherClassId") int otherClassId);

    @Query(value = "SELECT * FROM class_schedule WHERE class_id = :classId AND start_time >= :startTime AND end_time <= :endTime AND course_id = :courseId AND is_deleted = 0", nativeQuery = true)
    List<ClassSchedule> getClassScheduleByClassIdAndCourseId(@Param("classId") String classId, @Param("startTime") Date startTime, @Param("endTime") Date endTime, @Param("courseId") String courseId);

    @Query(value = "SELECT * FROM class_schedule WHERE faculty_id = :facultyId AND start_time >= :dateFormat" +
            " AND end_time <= :endDateFormat AND is_deleted = 0", nativeQuery = true)
    List<ClassSchedule> getClassScheduleByFacultyId(@Param("facultyId") String facultyId,
                                                  @Param("dateFormat") Date dateFormat,
                                                  @Param("endDateFormat") Date endDateFormat);

    @Query(value = "SELECT DISTINCT course_id FROM class_schedule WHERE faculty_id = :facultyId AND is_deleted = 0", nativeQuery = true)
    List<Integer> getCourses(@Param("facultyId") int facultyId);

    @Query(value = "SELECT DISTINCT course_id FROM class_schedule WHERE class_id = :classId AND is_deleted = 0", nativeQuery = true)
    List<Integer> findDistinctCourseIdsByClassId(@Param("classId") int classId);

    @Query(value = "SELECT cs.* FROM class_schedule cs WHERE cs.faculty_id = :facultyId" +
            " AND cs.class_id = :classId AND cs.course_id = :courseId AND cs.start_time >= :startDate" +
            " AND cs.start_time <= :endDate AND cs.is_deleted = 0", nativeQuery = true)
    List<ClassSchedule> getClassScheduleByClassRange(@Param("facultyId") int facultyId,
                                                @Param("classId") int classId,
                                                @Param("courseId") int courseId,
                                                @Param("startDate") Date startDate,
                                                @Param("endDate") Date endDate);

    // Admin oversight variant of getClassScheduleByClassRange — no facultyId filter, so it covers
    // every session for this class+course regardless of which faculty taught it (substitutions,
    // co-teaching, a faculty reassignment mid-semester). The faculty-scoped query above stays
    // exactly as-is for the existing per-faculty endpoints; this is additive, not a replacement.
    @Query(value = "SELECT cs.* FROM class_schedule cs WHERE cs.class_id = :classId" +
            " AND cs.course_id = :courseId AND cs.start_time >= :startDate" +
            " AND cs.start_time <= :endDate AND cs.is_deleted = 0", nativeQuery = true)
    List<ClassSchedule> getClassScheduleByClassRangeAnyFaculty(@Param("classId") int classId,
                                                @Param("courseId") int courseId,
                                                @Param("startDate") Date startDate,
                                                @Param("endDate") Date endDate);

    @Query(value = "SELECT * FROM class_schedule WHERE class_id = :classId AND course_id = :courseId " +
            "AND faculty_id = :facultyId AND start_time >= :startTime AND start_time <= :endTime AND is_deleted = 0", nativeQuery = true)
    List<ClassSchedule> getClassSchedulesInRange(@Param("classId") int classId,
                                                 @Param("courseId") int courseId,
                                                 @Param("facultyId") int facultyId,
                                                 @Param("startTime") Date startTime,
                                                 @Param("endTime") Date endTime);

    @Query(value = "SELECT SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) FROM class_schedule WHERE faculty_id = :facultyId AND is_deleted = 0", nativeQuery = true)
    Long getTotalHoursTaughtByFaculty(@Param("facultyId") int facultyId);

    @Query(value = "SELECT SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) FROM class_schedule WHERE faculty_id = :facultyId AND course_id = :courseId AND is_deleted = 0", nativeQuery = true)
    Long getTotalHoursTaughtByFacultyAndCourse(@Param("facultyId") int facultyId, @Param("courseId") int courseId);

    @Query(value = "SELECT SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) FROM class_schedule WHERE faculty_id = :facultyId AND class_id = :classId AND is_deleted = 0", nativeQuery = true)
    Long getTotalHoursTaughtByFacultyAndClass(@Param("facultyId") int facultyId, @Param("classId") int classId);

    @Query(value = "SELECT SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) FROM class_schedule WHERE faculty_id = :facultyId AND course_id = :courseId AND class_id = :classId AND is_deleted = 0", nativeQuery = true)
    Long getTotalHoursTaughtByFacultyAndCourseAndClass(@Param("facultyId") int facultyId, @Param("courseId") int courseId, @Param("classId") int classId);

    @Query(value = "SELECT * FROM class_schedule " +
               "WHERE faculty_id = :facultyId " +
               "AND start_time > NOW() " +
               "AND is_deleted = 0 " +
               "ORDER BY start_time ASC " +
               "LIMIT 1", nativeQuery = true)
    ClassSchedule findUpcomingClass(@Param("facultyId") int facultyId);

    /** AT-07: detect faculty double-booking — returns overlapping schedules for the same faculty */
    @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE faculty_id = :facultyId AND is_deleted = 0 AND start_time < :newEnd AND end_time > :newStart", nativeQuery = true)
    int countFacultyConflicts(@Param("facultyId") int facultyId, @Param("newStart") String newStart, @Param("newEnd") String newEnd);

    /** AT-07: detect batch (class) double-booking — returns overlapping schedules for the same class */
    @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE class_id = :classId AND is_deleted = 0 AND start_time < :newEnd AND end_time > :newStart", nativeQuery = true)
    int countClassConflicts(@Param("classId") int classId, @Param("newStart") String newStart, @Param("newEnd") String newEnd);

    /** AT-07: detect lecture-hall double-booking */
    @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE lecture_hall_id = :lectureHallId AND is_deleted = 0 AND start_time < :newEnd AND end_time > :newStart", nativeQuery = true)
    int countLectureHallConflicts(@Param("lectureHallId") int lectureHallId, @Param("newStart") String newStart, @Param("newEnd") String newEnd);

    // Update variants of the three AT-07 conflict checks. Identical to the create-time queries
    // except that they ignore the row being edited — otherwise a schedule would always collide
    // with itself and no edit could ever succeed.
    @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE faculty_id = :facultyId AND is_deleted = 0 "
            + "AND id <> :excludeId AND start_time < :newEnd AND end_time > :newStart", nativeQuery = true)
    int countFacultyConflictsExcluding(@Param("facultyId") int facultyId, @Param("newStart") String newStart,
                                       @Param("newEnd") String newEnd, @Param("excludeId") int excludeId);

    @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE class_id = :classId AND is_deleted = 0 "
            + "AND id <> :excludeId AND start_time < :newEnd AND end_time > :newStart", nativeQuery = true)
    int countClassConflictsExcluding(@Param("classId") int classId, @Param("newStart") String newStart,
                                     @Param("newEnd") String newEnd, @Param("excludeId") int excludeId);

    @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE lecture_hall_id = :lectureHallId AND is_deleted = 0 "
            + "AND id <> :excludeId AND start_time < :newEnd AND end_time > :newStart", nativeQuery = true)
    int countLectureHallConflictsExcluding(@Param("lectureHallId") int lectureHallId, @Param("newStart") String newStart,
                                           @Param("newEnd") String newEnd, @Param("excludeId") int excludeId);

    /**
     * Used by LectureHallServiceImpl.deleteLectureHall to block deletion while class_schedule
     * rows still reference this lecture hall (no FK exists at the DB level to catch this).
     */
    @Query(value = "SELECT COUNT(*) FROM class_schedule WHERE lecture_hall_id = :lectureHallId AND is_deleted = 0", nativeQuery = true)
    int countByLectureHallId(@Param("lectureHallId") int lectureHallId);
}

