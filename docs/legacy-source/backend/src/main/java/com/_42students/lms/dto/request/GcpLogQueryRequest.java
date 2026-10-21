package com._42students.lms.dto.request;

import lombok.Data;

import java.time.Instant;

@Data
public class GcpLogQueryRequest {
    private String environment;
    private String window;
    private String level;
    private String search;
    private String pageToken;
    private Instant anchor;
    private Integer size;
}
