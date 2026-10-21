package com._42students.lms.search.departments;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentSearchDTO implements SearchableDTO {

    private Integer id;
    private String name;
    private Integer deptChairId;
    private Integer deptViceChairId;
    private Integer collegeId;
    private String collegeName;

    @Override
    public Object getId() { return id; }

    @Override
    public String getDisplayName() {
        return name != null ? name : "";
    }

    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (name != null) sb.append(name).append(" ");
        if (collegeName != null) sb.append(collegeName).append(" ");
        return sb.toString().trim();
    }
}
