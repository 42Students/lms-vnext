package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class AddressDTO {
    private String currentAddress;
    private String permanentAddress;
    private String city;
    private String state;
    private String pincode;
    private String currentCity;
    private String currentState;
    private String currentPincode;
    private String permanentCity;
    private String permanentState;
    private String permanentPincode;
}

