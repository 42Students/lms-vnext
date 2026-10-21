package com._42students.lms.dto.response;

import com._42students.lms.model.JobApplication;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Wrapper for paginated job applications with metadata.
 * Use data.content for the list; data.totalElements, data.totalPages for UI.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedApplicationsResponse {

    private List<JobApplication> content;
    private long totalElements;
    private int totalPages;
    private int size;
    private int number;
    private boolean first;
    private boolean last;
}

