package com._42students.lms.search.lecturehalls;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LectureHallSearchDTO implements SearchableDTO {
    private Integer id;
    private String name;
    private Integer capacity;
    private String description;
    private Integer collegeId;
    private Integer deptId;
    private String roomType;
    
    @Override
    public Object getId() { return id; }
    
    @Override
    public String getDisplayName() { return name != null ? name : ""; }
}


