package com._42students.lms.repository;

import com._42students.lms.model.ClassroomMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClassroomMessageRepository extends JpaRepository<ClassroomMessage, Integer> {

    // Strictly chronological — the frontend renders this single list both as the main log (day
    // separators, sender-grouping, unseen-count scroll heuristics all assume array order ==
    // send order) AND derives the pinned banner from it via a simple filter(). Ordering pinned
    // messages first here displaced every pinned message to the front of the main feed too,
    // corrupting all of that downstream logic for everything after it.
    @Query(value = """
            select * from classroom_messages
            where is_deleted = false
              and course_id = :courseId
              and class_id = :classId
            order by created_at asc, id asc
            """, nativeQuery = true)
    List<ClassroomMessage> findAllActiveForCourseAndClass(@Param("courseId") Integer courseId,
                                                          @Param("classId") Integer classId);

    /**
     * Everything that changed since a moment (new, edited, pinned/unpinned, deleted), for polling
     * (LRN-DISC-03): deleted rows are included so the client can drop them. ">=" so a row written in
     * the same instant as the cursor is not missed; the client de-duplicates by id.
     */
    @Query(value = """
            select * from classroom_messages
            where course_id = :courseId
              and class_id = :classId
              and updated_at >= :since
            order by created_at asc, id asc
            """, nativeQuery = true)
    List<ClassroomMessage> findChangedSince(@Param("courseId") Integer courseId,
                                            @Param("classId") Integer classId,
                                            @Param("since") java.time.LocalDateTime since);
}
