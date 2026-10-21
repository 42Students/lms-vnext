package com._42students.lms.dto.projects;

import lombok.Data;

import java.util.List;

/**
 * Create several team workspaces at once, each backed by its own PROJECT_TEAM group
 * (docs/groups/PROJECT-TEAMS.md). The client decides the split (and lets the admin adjust it in a
 * preview); the server validates it and creates one workspace + one group per team.
 */
@Data
public class AdminProjectTeamsCreateDTO {
    private Integer collegeId;
    private Integer organizationId;
    private Integer classId;
    private Integer templateId;
    private Integer mentorId;
    private String status;
    private String summary;
    private List<Team> teams;

    @Data
    public static class Team {
        /** Workspace title, e.g. "Library Management - Team 3". */
        private String title;
        private List<Integer> learnerIds;
    }
}
