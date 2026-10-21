package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class JobPreferencesDTO {
    private String rolePreference;
    private String specificRolePreference;
    private String workShiftPreference;
    private String preferredEmploymentCity;
    private String examSlotPreference; // "Morning", "Afternoon", "Evening"
    private Boolean jobNotificationsEnabled;
}



