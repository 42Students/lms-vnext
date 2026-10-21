package com._42students.lms.dto.projects;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectReleaseUpsertDTO {
    // Present only when updating an existing release (create derives a key from title, same
    // slugify-the-title convention as sprint/task key generation elsewhere in this module).
    private String releaseKey;
    private String title;
    private LocalDate targetDate;
    private String notes;
    private Integer sortOrder;
    private Long version;
}
