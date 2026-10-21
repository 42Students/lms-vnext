package com._42students.lms.search.learners;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for learner search
 * Used for fast in-memory search without database queries
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerSearchDTO implements SearchableDTO {

    private Integer id;
    private String firstName;
    private String lastName;
    private String uniqueId;
    private String rollNumber;
    private String contactMail;
    private String contactMobile;
    private String department;
    private Integer collegeId;
    private String collegeName;
    private Integer programId;
    private String programName;
    private Integer classId;
    private String className;
    private Integer organizationId;

    @Override
    public Object getId() {
        return id;
    }

    @Override
    public String getDisplayName() {
        // Prefer full name, fallback to first name or roll number
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        if (firstName != null) {
            return firstName;
        }
        if (rollNumber != null) {
            return rollNumber;
        }
        return uniqueId != null ? uniqueId : "";
    }

    /**
     * Get searchable text (all fields combined)
     */
    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (firstName != null) sb.append(firstName).append(" ");
        if (lastName != null) sb.append(lastName).append(" ");
        if (rollNumber != null) sb.append(rollNumber).append(" ");
        if (uniqueId != null) sb.append(uniqueId).append(" ");
        if (contactMail != null) sb.append(contactMail).append(" ");
        if (contactMobile != null) sb.append(contactMobile).append(" ");
        if (department != null) sb.append(department).append(" ");
        if (collegeName != null) sb.append(collegeName).append(" ");
        if (programName != null) sb.append(programName).append(" ");
        if (className != null) sb.append(className).append(" ");
        return sb.toString().trim();
    }
}

