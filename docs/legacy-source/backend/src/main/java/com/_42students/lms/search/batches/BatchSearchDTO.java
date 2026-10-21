package com._42students.lms.search.batches;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchSearchDTO implements SearchableDTO {

    private Long id;
    private String batchName;
    private Long programId;
    private String programName;
    private Integer organizationId;
    private Integer collegeId;
    private Date startDate;
    private Date endDate;

    @Override
    public Object getId() { return id; }

    @Override
    public String getDisplayName() {
        return batchName != null ? batchName : "";
    }

    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (batchName != null) sb.append(batchName).append(" ");
        if (programName != null) sb.append(programName).append(" ");
        return sb.toString().trim();
    }
}

