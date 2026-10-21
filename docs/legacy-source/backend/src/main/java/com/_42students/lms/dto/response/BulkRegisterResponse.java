package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response for bulk-register: created count, created IDs, and per-row failures.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BulkRegisterResponse {

    private int created;
    private List<Integer> createdIds = new ArrayList<>();
    private List<BulkRegisterFailedItem> failed = new ArrayList<>();
    // B3: lets the caller immediately offer "Undo this import" without a separate lookup.
    private String bulkImportBatchId;
}

