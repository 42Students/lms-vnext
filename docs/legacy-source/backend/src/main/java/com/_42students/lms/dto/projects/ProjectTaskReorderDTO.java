package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.List;

@Data
public class ProjectTaskReorderDTO {
    private List<Integer> orderedTaskIds;
}
