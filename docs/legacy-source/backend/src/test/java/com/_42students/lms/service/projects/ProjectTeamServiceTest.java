package com._42students.lms.service.projects;

import com._42students.lms.dto.projects.AdminProjectTeamsCreateDTO;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class ProjectTeamServiceTest {

    private final ProjectTeamService service = new ProjectTeamService(null, null, null, null, null, null,
            mock(org.springframework.transaction.PlatformTransactionManager.class));

    private static AdminProjectTeamsCreateDTO.Team team(String title, Integer... ids) {
        AdminProjectTeamsCreateDTO.Team t = new AdminProjectTeamsCreateDTO.Team();
        t.setTitle(title);
        t.setLearnerIds(Arrays.asList(ids));
        return t;
    }

    private static AdminProjectTeamsCreateDTO payload(AdminProjectTeamsCreateDTO.Team... teams) {
        AdminProjectTeamsCreateDTO p = new AdminProjectTeamsCreateDTO();
        p.setCollegeId(6);
        p.setTemplateId(8);
        p.setTeams(List.of(teams));
        return p;
    }

    @Test
    void aValidSplitPasses() {
        assertDoesNotThrow(() -> service.validate(payload(team("Team 1", 1, 2, 3), team("Team 2", 4, 5))));
    }

    @Test
    void aLearnerCannotBeInTwoTeams() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> service.validate(payload(team("Team 1", 1, 2), team("Team 2", 2, 3))));
        assertTrue(e.getMessage().contains("more than one team"));
    }

    @Test
    void everyTeamNeedsLearnersAndATitle() {
        assertThrows(IllegalArgumentException.class, () -> service.validate(payload(team("Team 1"))));
        assertThrows(IllegalArgumentException.class, () -> service.validate(payload(team(" ", 1))));
    }

    @Test
    void titlesMustBeDistinct() {
        assertThrows(IllegalArgumentException.class, () -> service.validate(payload(team("Team 1", 1), team("team 1", 2))));
    }

    @Test
    void aTemplateAndACollegeAreRequired() {
        AdminProjectTeamsCreateDTO p = payload(team("Team 1", 1));
        p.setTemplateId(null);
        assertThrows(IllegalArgumentException.class, () -> service.validate(p));
        AdminProjectTeamsCreateDTO q = payload(team("Team 1", 1));
        q.setCollegeId(null);
        assertThrows(IllegalArgumentException.class, () -> service.validate(q));
    }
}
