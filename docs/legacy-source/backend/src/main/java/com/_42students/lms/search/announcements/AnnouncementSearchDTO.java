package com._42students.lms.search.announcements;

import com._42students.lms.search.core.SearchableDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementSearchDTO implements SearchableDTO {
    private Long id;
    private String title;
    private String message;
    private String receiverType;
    private Long receiverValue;
    
    @Override
    public Object getId() { return id; }
    
    @Override
    public String getDisplayName() { return title != null ? title : ""; }
}


