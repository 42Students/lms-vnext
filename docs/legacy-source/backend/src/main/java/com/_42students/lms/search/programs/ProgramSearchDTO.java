package com._42students.lms.search.programs;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgramSearchDTO implements SearchableDTO {

    private Long id;
    private String name;
    private String startYear;
    private String endYear;
    private Integer organizationId;
    private Integer collegeId;
    private Integer deptId;
    private String deptName;

    @Override
    public Object getId() { return id; }

    @Override
    public String getDisplayName() {
        return name != null ? name : "";
    }

    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (name != null) sb.append(name).append(" ");
        if (startYear != null) sb.append(startYear).append(" ");
        if (endYear != null) sb.append(endYear).append(" ");
        if (deptName != null) sb.append(deptName).append(" ");
        return sb.toString().trim();
    }
}

