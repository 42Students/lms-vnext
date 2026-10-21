package com._42students.lms.dto.projects;

import com._42students.lms.dto.response.PageDTO;
import lombok.Data;

@Data
public class ProjectActivityFeedDTO extends PageDTO<ProjectActivityDTO> {
    private Integer totalVisible;
}
