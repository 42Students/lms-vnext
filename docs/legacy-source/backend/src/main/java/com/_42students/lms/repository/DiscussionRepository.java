package com._42students.lms.repository;

import com._42students.lms.model.Discussions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussions, Long> {
    @Query(value = "select * from discussions where lesson_content_id=:lessonContentId", nativeQuery = true)
    List<Discussions> fetchDiscussion(@Param("lessonContentId") int lessonContentId);
}
