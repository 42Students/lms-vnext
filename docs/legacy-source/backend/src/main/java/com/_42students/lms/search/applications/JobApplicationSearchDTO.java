package com._42students.lms.search.applications;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobApplicationSearchDTO implements SearchableDTO {
    private Integer id;
    private Integer learnerId;
    private String learnerName;
    private Integer jobId;
    private String jobTitle;
    private String companyName;
    private String applicationStatus;
    private Integer organizationId;
    
    @Override
    public Object getId() { return id; }
    
    @Override
    public String getDisplayName() {
        return learnerName != null ? learnerName + " - " + jobTitle : "";
    }
}


