package com._42students.lms.dto.response;

import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import lombok.Data;

import java.util.List;

@Data
public class LessonResponseDTO {
    private Lesson lesson;
    private List<LessonContents> lessonContents;
}

