package com._42students.lms.dto.projects;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberDTO {
    private Integer id;
    private Integer userId;
    private String name;
    private String role;
    private String status;
    private String userType;

    // #5: a mentor's real, already-collected profile substance (Faculty.description/experiences/
    // linkedin -- entered through the existing faculty profile editor, never previously surfaced
    // anywhere on a project) -- so the People & Meetings page can show who this person actually is
    // instead of rendering them identically to any other team member. Populated only for FACULTY
    // members; always null for a learner, so the common case (a roster of students) carries no
    // extra weight.
    private String bio;
    private String headlineRole;
    private String linkedin;
}
