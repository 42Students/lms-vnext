package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class CollegeDTO {
    @NotBlank @Size(max = 255)
    private String name;
    @Size(max = 255)
    private String logo;
    @Size(max = 255)
    private String uniqueId;
    @Size(max = 255)
    private String addressLine1;
    @Size(max = 255)
    private String addressLine2;
    @Size(max = 255)
    private String landmark;
    @Size(max = 255)
    private String city;
    @Size(max = 255)
    private String state;
    @Size(max = 255)
    private String country;
    @Size(max = 255)
    private String pinCode;
    // Optional — nothing in the Create/Edit College UI sets a chair/vice-chair at creation time.
    // These were `int` (not `Integer`) with @Min(1), so an omitted field deserialized to the
    // primitive default 0 and @Min(1) rejected every single create/update request outright
    // (visible as "collegeChairId: must be greater than or equal to 1" on every submission).
    // The College entity itself already stores these as nullable Integer columns — Integer here
    // matches that: @Min only fires on a non-null value, so omitting the field now passes, while
    // an explicit 0 or negative value (if ever sent) is still correctly rejected.
    @Min(1)
    private Integer collegeChairId;
    @Min(1)
    private Integer collegeViceChairId;
    @Min(1)
    private int orgId;

    /**
     * Optional tenant domain/host for this college (e.g. nsrit.42lms.com or nsritcollege.edu).
     * If provided, backend will create a tenant_domain mapping for this college.
     */
    @Size(max = 255)
    private String domainHost;

    /**
     * Optional: mark the provided domain as primary for this college. Defaults to true when domainHost is provided.
     */
    private Boolean domainPrimary;
}

