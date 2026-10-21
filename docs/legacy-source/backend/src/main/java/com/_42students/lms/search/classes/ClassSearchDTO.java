package com._42students.lms.search.classes;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassSearchDTO implements SearchableDTO {

    private Integer id;
    private String name;
    private String description;
    private Date startDate;
    private Date endDate;
    private Integer organizationId;
    private Integer collegeId;
    private Integer programId;
    private String programName;

    @Override
    public Object getId() { return id; }

    @Override
    public String getDisplayName() {
        return name != null ? name : "";
    }

    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (name != null) sb.append(name).append(" ");
        if (description != null) sb.append(description).append(" ");
        if (programName != null) sb.append(programName).append(" ");
        return sb.toString().trim();
    }
}

