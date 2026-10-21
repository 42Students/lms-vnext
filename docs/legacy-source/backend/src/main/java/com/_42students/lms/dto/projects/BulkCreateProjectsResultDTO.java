package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class BulkCreateProjectsResultDTO {
    private List<ProjectWorkspaceDTO> created = new ArrayList<>();
    private List<String> failures = new ArrayList<>();
}
