package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.constraints.Size;
import java.util.List;

/**
 * Request for bulk-validate: check which mobiles/emails already exist (no creation).
 */
@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BulkValidateRequest {

    public static final int MAX_MOBILES = 500;
    public static final int MAX_EMAILS = 500;

    @Size(max = MAX_MOBILES, message = "mobiles list cannot exceed " + MAX_MOBILES + " items")
    private List<String> mobiles;

    @Size(max = MAX_EMAILS, message = "emails list cannot exceed " + MAX_EMAILS + " items")
    private List<String> emails;

    /** College-local roll numbers must also be checked BEFORE account creation. */
    @Size(max = 500, message = "rollNumbers cannot exceed 500 items")
    private List<String> rollNumbers;

    /** College to scope the validation to. Required so access control can enforce college scoping. */
    private Integer collegeId;
}

