package com._42students.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** B3 in the super-admin audit: one row per bulk-import batch, for an "Import History" list. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportBatchDTO {
    private String bulkImportBatchId;
    private long learnerCount;
    private LocalDateTime importedAt;
}
