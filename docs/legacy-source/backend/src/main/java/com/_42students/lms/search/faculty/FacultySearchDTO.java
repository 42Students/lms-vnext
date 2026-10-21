package com._42students.lms.search.faculty;

import com._42students.lms.search.core.SearchableDTO;
import com._42students.lms.enums.FacultyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight DTO for faculty search
 * Used for fast in-memory search without database queries
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultySearchDTO implements SearchableDTO {

    private Integer id;
    private String firstName;
    private String lastName;
    private String uniqueId;
    private String contactMail;
    private String contactMobile;
    private String department;
    private FacultyType facultyType;
    private Integer deptId;
    private String deptName;
    private Integer organizationId;
    private Integer collegeId;
    private String collegeName;

    @Override
    public Object getId() {
        return id;
    }

    @Override
    public String getDisplayName() {
        // Prefer full name, fallback to first name or unique ID
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        if (firstName != null) {
            return firstName;
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
        if (uniqueId != null) sb.append(uniqueId).append(" ");
        if (contactMail != null) sb.append(contactMail).append(" ");
        if (contactMobile != null) sb.append(contactMobile).append(" ");
        if (department != null) sb.append(department).append(" ");
        if (facultyType != null) sb.append(facultyType.toString()).append(" ");
        if (deptName != null) sb.append(deptName).append(" ");
        if (collegeName != null) sb.append(collegeName).append(" ");
        return sb.toString().trim();
    }
}

