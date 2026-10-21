package com._42students.lms.dto.request;

import lombok.Data;

import java.time.Instant;

/** A bounded, explicit-time-range export -- see GcpCloudLoggingService#export. */
@Data
public class GcpLogExportRequest {
    private String environment;
    private String level;
    private String search;
    private Instant since;
    private Instant until;
    /** Leave out the Logs page's own requests (/api/v1/superadmin/logs*), which only add noise to a report. */
    private boolean excludeTooling;
}
