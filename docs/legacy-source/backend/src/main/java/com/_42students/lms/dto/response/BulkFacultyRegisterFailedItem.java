package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One failed row in bulk faculty register response (1-based row index).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BulkFacultyRegisterFailedItem {

    private int row;
    private String reason;
    private String mobile;
    private String email;
    private Integer deptId;
}

