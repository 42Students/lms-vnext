package com._42students.lms.search.notifications;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSearchDTO implements SearchableDTO {
    private Integer id;
    private String title;
    private String message;
    private Integer classId;
    private Integer courseId;
    private String courseSlug;

    // Internal search-scope metadata. Never expose recipient or scheduler internals in the v2 DTO.
    @JsonIgnore
    private Integer learnerId;
    @JsonIgnore
    private LocalDateTime scheduledAt;
    
    @Override
    public Object getId() { return id; }
    
    @Override
    public String getDisplayName() { return title != null ? title : ""; }
}


