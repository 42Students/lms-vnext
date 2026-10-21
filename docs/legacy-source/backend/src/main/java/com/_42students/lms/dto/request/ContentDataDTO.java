package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class ContentDataDTO {
    private FileDTO fileDTO;
    private String htmlContent;
    private boolean allowDiscussions;
    private boolean viewAfterSchedule;
    private boolean viewBeforeSchedule;
    private String text;
    private Long duration;
    private String dueDate;
    private String link;
    /**
     * Additive JSON field for canonical Resources: multiple independently validated FILE/LINK
     * materials in a single lesson content row. Legacy fileDTO/link/htmlContent remain readable
     * during migration, so content IDs, progress, ordering and R2 references are preserved.
     */
    private List<ResourceMaterialDTO> resourceMaterials;
    private List<AssignmentResourceDTO> assignmentResources;
    private List<String> allowedSubmissionTypes;
    /** Calendar event id for scheduled live classes (e.g., Google Calendar event id). */
    private String calendarEventId;
    /** Timezone used for scheduled live class times (e.g., Asia/Kolkata). */
    private String timeZone;
    private String endTime;
    private String startTime;
    private String thumbnail;
}
