package com._42students.lms.dto.response;

import com._42students.lms.model.LessonContents;
import lombok.Data;

import java.util.List;

@Data
public class LessonContentsWithClassNameResponse {
    private List<LessonContents> lessonContents;
    private String className;
}

