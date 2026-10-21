package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response for bulk faculty register: created count, created IDs, and per-row failures.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BulkFacultyRegisterResponse {

    private int created;
    private List<Integer> createdIds = new ArrayList<>();
    private List<BulkFacultyRegisterFailedItem> failed = new ArrayList<>();
}

