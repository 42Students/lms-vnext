package com._42students.lms.projects;

import com._42students.lms.dto.projects.ProjectTaskUpsertDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** Request JSON contract for task edits, particularly backlog moves and optimistic versions.
 * These tests do not substitute for service-level authorization or persistence tests.
 */
class ProjectTaskPayloadContractRegressionTest {
    private final ObjectMapper mapper = new ObjectMapper();

    private ProjectTaskUpsertDTO parse(String json) throws Exception {
        return mapper.readValue(json, ProjectTaskUpsertDTO.class);
    }

    @Test void omittedClearSprintRemainsNull() throws Exception {
        assertNull(parse("{\"taskKey\":\"task-1\"}").getClearSprint());
    }
    @Test void explicitNullClearSprintRemainsNull() throws Exception {
        assertNull(parse("{\"clearSprint\":null}").getClearSprint());
    }
    @Test void explicitFalseClearSprintIsNotConfusedWithAbsent() throws Exception {
        assertEquals(Boolean.FALSE, parse("{\"clearSprint\":false}").getClearSprint());
    }
    @Test void explicitTrueClearSprintIsRetained() throws Exception {
        assertEquals(Boolean.TRUE, parse("{\"clearSprint\":true}").getClearSprint());
    }
    @Test void backlogMoveCanCarryTrueAndNullSprintKey() throws Exception {
        ProjectTaskUpsertDTO dto = parse("{\"clearSprint\":true,\"sprintKey\":null}");
        assertTrue(dto.getClearSprint()); assertNull(dto.getSprintKey());
    }
    @Test void backlogMoveCanCarryTrueAndEmptySprintKey() throws Exception {
        ProjectTaskUpsertDTO dto = parse("{\"clearSprint\":true,\"sprintKey\":\"\"}");
        assertTrue(dto.getClearSprint()); assertEquals("", dto.getSprintKey());
    }
    @Test void sprintAssignmentCanCarryFalseAndSprintKey() throws Exception {
        ProjectTaskUpsertDTO dto = parse("{\"clearSprint\":false,\"sprintKey\":\"sprint-2\"}");
        assertFalse(dto.getClearSprint()); assertEquals("sprint-2", dto.getSprintKey());
    }
    @Test void absentSprintKeyDoesNotBecomeEmptyString() throws Exception {
        assertNull(parse("{\"title\":\"Review\"}").getSprintKey());
    }
    @Test void explicitEmptySprintKeyIsRetained() throws Exception {
        assertEquals("", parse("{\"sprintKey\":\"\"}").getSprintKey());
    }
    @Test void explicitNullVersionIsRetained() throws Exception {
        assertNull(parse("{\"version\":null}").getVersion());
    }
    @Test void absentVersionIsNull() throws Exception {
        assertNull(parse("{\"title\":\"Review\"}").getVersion());
    }
    @Test void zeroVersionIsNotTreatedAsAbsent() throws Exception {
        assertEquals(0L, parse("{\"version\":0}").getVersion());
    }
    @Test void largeVersionRetainsLongPrecision() throws Exception {
        assertEquals(2147483648L, parse("{\"version\":2147483648}").getVersion());
    }
    @Test void assigneeIdAndTypeAreIndependentFields() throws Exception {
        ProjectTaskUpsertDTO dto = parse("{\"assigneeId\":17,\"assigneeType\":\"LEARNER\"}");
        assertEquals(17, dto.getAssigneeId()); assertEquals("LEARNER", dto.getAssigneeType());
    }
    @Test void missingAssigneeIdDoesNotDefaultToZero() throws Exception {
        assertNull(parse("{\"assigneeType\":\"FACULTY\"}").getAssigneeId());
    }
    @Test void zeroEstimatePointsIsNotTreatedAsAbsent() throws Exception {
        assertEquals(0, parse("{\"estimatePoints\":0}").getEstimatePoints());
    }
    @Test void nullEstimatePointsIsRetained() throws Exception {
        assertNull(parse("{\"estimatePoints\":null}").getEstimatePoints());
    }
    @Test void serializedBacklogMoveRetainsExplicitClearSignalAndVersion() throws Exception {
        ProjectTaskUpsertDTO dto = new ProjectTaskUpsertDTO();
        dto.setTaskKey("task-1"); dto.setClearSprint(true); dto.setVersion(42L);
        JsonNode json = mapper.readTree(mapper.writeValueAsString(dto));
        assertEquals("task-1", json.get("taskKey").asText());
        assertTrue(json.get("clearSprint").asBoolean());
        assertEquals(42L, json.get("version").asLong());
    }
}
