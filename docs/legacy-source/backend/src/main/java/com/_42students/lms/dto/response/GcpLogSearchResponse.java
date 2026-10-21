package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class GcpLogSearchResponse {
    private String environment;
    private String namespace;
    private Instant queriedAt;
    private List<GcpLogSummaryResponse> items;
    private String nextPageToken;
}
