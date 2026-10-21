package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import javax.validation.constraints.Email;
import javax.validation.constraints.Pattern;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class ContactDTO {
    // contactMail previously had no format validation on either side — the profile UI's email
    // field accepted anything and the backend persisted it as-is. Mirrors the digit-pattern
    // enforcement already present for contactMobile/contactPhone below.
    // "^$|..." rather than plain "^\d{10}$": unlike @Email, PatternValidator only treats null as
    // valid, not "". The service layer (see FacultyProfileServiceImpl/LearnerProfileServiceImpl
    // updateContact) treats a blank value as "leave this optional field alone" — without the
    // empty-string allowance here, @Valid rejected that exact request shape with a 400 before the
    // service's own no-op check ever ran.
    @Pattern(regexp = "^$|^\\d{10}$", message = "Mobile number must be exactly 10 digits")
    private String contactMobile;

    @Pattern(regexp = "^$|^\\d{10,15}$", message = "Phone number must be 10-15 digits")
    private String contactPhone;

    @Email(message = "Enter a valid email address")
    private String contactMail;
}

