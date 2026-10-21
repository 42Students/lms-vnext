package com._42students.lms.repository;

import com._42students.lms.model.Attend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
 
@Repository
public interface AttendanceRepository extends JpaRepository<Attend, Long> {

    @Query(value = "select * from attend where class_schedule_id=:classScheduleId and (is_deleted = false OR is_deleted IS NULL) order by class_schedule_id desc", nativeQuery = true)
    List<Attend> getClassScheduleAttendance(@Param("classScheduleId") String classScheduleId);

    @Query(value = "select * from attend where class_schedule_id=:classScheduleId" +
            " and student_id=:studentId and (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    Attend getAttendance(@Param("classScheduleId") String classScheduleId,
                         @Param("studentId") String studentId);

    /**
     * Same lookup as {@link #getAttendance} but INCLUDING soft-deleted rows.
     *
     * <p>Needed because absence removal is a soft delete while the table carries a unique key on
     * (student_id, class_schedule_id) that does not consider is_deleted (see V29). Re-marking a
     * student absent after they were marked present must therefore revive the existing row —
     * inserting a second one violates that key.
     */
    @Query(value = "select * from attend where class_schedule_id=:classScheduleId" +
            " and student_id=:studentId", nativeQuery = true)
    Attend getAttendanceIncludingDeleted(@Param("classScheduleId") String classScheduleId,
                                         @Param("studentId") String studentId);

    @Query(value = "select * from attend where class_schedule_id in (:classScheduleIds)" +
            " and created_at>=:startDate and created_at<=:endDate and (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Attend> getAttendanceBySchedule(@Param("classScheduleIds") List<Integer> classScheduleIds,
                         @Param("startDate") Date startDate,
                         @Param("endDate") Date endDate);

    /**
     * Returns attendance (absent) records for the given class schedule IDs.
     * Use this when the schedule IDs are already filtered by date range so that
     * attendance is shown for "sessions in this period", not "records created in this period".
     */
    @Query(value = "select * from attend where class_schedule_id in (:classScheduleIds) and (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Attend> getAttendanceByClassScheduleIds(@Param("classScheduleIds") List<Integer> classScheduleIds);

    /**
     * The class-schedule ids, out of the supplied set, for which this learner is marked absent.
     *
     * <p>Replaces a per-schedule {@code getAttendance} call in the learner attendance views, which
     * issued one query per session in the requested range.
     */
    @Query(value = "select class_schedule_id from attend where student_id = :studentId"
            + " and class_schedule_id in (:classScheduleIds)"
            + " and (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<Integer> getAbsentScheduleIdsForLearner(@Param("studentId") String studentId,
                                                 @Param("classScheduleIds") List<Integer> classScheduleIds);

    /** Counts distinct (student_id, class_schedule_id) to handle any legacy duplicates. */
    /**
     * Absences for this learner against sessions that have actually STARTED.
     *
     * Two bugs fixed here. The inner subquery had no is_deleted filter while the denominator
     * (getClassScheduleCountByClassId) did, so soft-deleting a schedule removed it from the
     * denominator while its absence row still counted in the numerator — driving
     * "total - absent" negative (which is why the caller had to clamp it to zero and, in doing
     * so, floored the learner at 0%). And it counted absences against future sessions, which
     * cannot be consistent with a held-only denominator.
     */
    @Query(value = "SELECT COUNT(DISTINCT a.class_schedule_id) FROM attend a " +
                         "INNER JOIN class_schedule cs ON cs.id = a.class_schedule_id " +
                         "WHERE cs.class_id = :classId AND cs.is_deleted = 0 " +
                         "AND cs.start_time IS NOT NULL AND cs.start_time <= NOW() " +
                         "AND a.student_id = :studentId " +
                         "AND (a.is_deleted = false OR a.is_deleted IS NULL)", nativeQuery = true)
    int getAbsentCountByLearnerAndClass(@Param("studentId") String studentId,
                                        @Param("classId") int classId);

    /** 2.5: per-course variant of getAbsentCountByLearnerAndClass, backing the new per-course percentage. */
    @Query(value = "SELECT COUNT(DISTINCT a.class_schedule_id) FROM attend a " +
                         "INNER JOIN class_schedule cs ON cs.id = a.class_schedule_id " +
                         "WHERE cs.class_id = :classId AND cs.course_id = :courseId AND cs.is_deleted = 0 " +
                         "AND cs.start_time IS NOT NULL AND cs.start_time <= NOW() " +
                         "AND a.student_id = :studentId " +
                         "AND (a.is_deleted = false OR a.is_deleted IS NULL)", nativeQuery = true)
    int getAbsentCountByLearnerAndClassAndCourse(@Param("studentId") String studentId,
                                                 @Param("classId") int classId,
                                                 @Param("courseId") int courseId);
}




//getattendancbyschedule
 
