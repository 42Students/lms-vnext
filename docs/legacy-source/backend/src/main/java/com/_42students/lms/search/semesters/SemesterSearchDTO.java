package com._42students.lms.search.semesters;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SemesterSearchDTO implements SearchableDTO {
    private Integer id;
    private Integer programId;
    private String programName;
    private Integer semesterNumber;
    private String name;
    
    @Override
    public Object getId() { return id; }
    
    @Override
    public String getDisplayName() { return name != null ? name : "Semester " + semesterNumber; }
}


