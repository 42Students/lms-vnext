package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/** Response for bulk-validate: which mobiles/emails already exist in the system. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BulkValidateResponse {

    private List<String> existingMobiles = new ArrayList<>();
    private List<String> existingEmails = new ArrayList<>();
    private List<String> existingRollNumbers = new ArrayList<>();
}

