package com._42students.lms.dto.profile;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import java.util.List;
import java.util.Map;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Data
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class SocialProfileDTO {
    @Pattern(regexp = "^(https?://.*)?$", message = "URL must start with http:// or https://")
    @Size(max = 500)
    private String linkedIn;

    @Pattern(regexp = "^(https?://.*)?$", message = "URL must start with http:// or https://")
    @Size(max = 500)
    private String github;

    @Pattern(regexp = "^(https?://.*)?$", message = "URL must start with http:// or https://")
    @Size(max = 500)
    private String portfolio;

    @Pattern(regexp = "^(https?://.*)?$", message = "URL must start with http:// or https://")
    @Size(max = 500)
    private String twitter;

    @Pattern(regexp = "^(https?://.*)?$", message = "URL must start with http:// or https://")
    @Size(max = 500)
    private String googleScholar;

    @Pattern(regexp = "^(https?://.*)?$", message = "URL must start with http:// or https://")
    @Size(max = 500)
    private String researchGate;

    /**
     * Learners only: coding-platform usernames by platform key (common.CodingPlatforms). A pasted profile link is reduced to the
     * username. On update, null leaves them as they are; a map replaces them all (send {} to clear).
     */
    private Map<String, String> codingProfiles;

    /** Read-only: [{ key, label, username, url }] built from codingProfiles. */
    private List<Map<String, Object>> codingProfileLinks;
}

