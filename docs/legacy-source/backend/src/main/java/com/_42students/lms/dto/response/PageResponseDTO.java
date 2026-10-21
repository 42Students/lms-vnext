package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Generic paginated-response envelope. Use data.content for the list; data.totalElements /
 * data.totalPages for pager UI. Same shape as PagedApplicationsResponse, generic instead of
 * hardcoded to one entity — reused by the quiz and assignment list endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponseDTO<T> {
    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int size;
    private int number;
    private boolean first;
    private boolean last;

    /**
     * Optional whole-list counts (not just this page), e.g. {"submitted": 12} on a learner's quiz list.
     * Headline numbers used to be counted from the current page only (LRN-X-04).
     */
    private java.util.Map<String, Long> summary;
}
