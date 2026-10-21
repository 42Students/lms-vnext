package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One calendar event for a job important date (Application deadline, Screening round, etc.)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobImportantDateEventDTO {
    private Integer jobId;
    private String jobTitle;
    private String companyName;
    private String label;
    private LocalDateTime date;
    private String eventType = "JOB_IMPORTANT_DATE";
    // Was missing entirely — the frontend's own fallback path (built directly from
    // job.importantDates JSON when this endpoint returns nothing) preserves item.type/dateType
    // and classifyJobDate() prefers it when present, but this endpoint (the PRIMARY path, used
    // whenever it has data) never copied it through, silently falling back to free-text
    // label pattern-matching. The same underlying date could classify (and color/legend-bucket)
    // differently depending on which of the two paths happened to serve the request.
    private String type;
}

