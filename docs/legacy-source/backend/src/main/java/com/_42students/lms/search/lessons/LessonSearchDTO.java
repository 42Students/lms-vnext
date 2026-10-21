package com._42students.lms.search.lessons;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonSearchDTO implements SearchableDTO {
    private Integer id;
    private String lessonName;
    private Integer courseId;
    private String courseSlug;
    private String courseName;
    private Boolean active;
    
    @Override
    public Object getId() { return id; }
    
    @Override
    public String getDisplayName() { return lessonName != null ? lessonName : ""; }
}


