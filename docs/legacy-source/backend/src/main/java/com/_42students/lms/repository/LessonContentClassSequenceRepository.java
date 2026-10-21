package com._42students.lms.repository;

import com._42students.lms.model.LessonContentClassSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonContentClassSequenceRepository extends JpaRepository<LessonContentClassSequence, Integer> {

    List<LessonContentClassSequence> findByLessonContentIdInAndClassId(List<Integer> lessonContentIds, Integer classId);

    @Modifying
    @Query("DELETE FROM com._42students.lms.model.LessonContentClassSequence s WHERE s.lessonContentId IN :contentIds AND s.classId = :classId")
    void deleteByLessonContentIdInAndClassId(@Param("contentIds") List<Integer> contentIds, @Param("classId") int classId);
}

