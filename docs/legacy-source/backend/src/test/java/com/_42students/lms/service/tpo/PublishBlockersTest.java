package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** The server refuses what the publish window blocks; it used to check only the job type, and the window did not show that one. */
class PublishBlockersTest {
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 6, 0, 0);

    private static Job ready() {
        Job j = new Job();
        j.setJobType("FULL_TIME");
        j.setRoleOptionsJson(List.of(Map.of("name", "SDE", "ctcLpa", 6)));
        j.setApplicationDeadline(NOW.plusDays(5));
        j.setDriveMode("ON_CAMPUS");
        return j;
    }

    @Test
    void aReadyDrivePublishesAndEachGapIsNamed() {
        assertTrue(TpoDriveService.publishBlockers(ready(), NOW).isEmpty());
        Job noType = ready(); noType.setJobType(null);
        assertTrue(TpoDriveService.publishBlockers(noType, NOW).get(0).contains("job type"));
        Job stipend = ready(); stipend.setRoleOptionsJson("[{\"name\":\"Intern\",\"stipendPerMonth\":15000}]");
        assertTrue(TpoDriveService.publishBlockers(stipend, NOW).isEmpty(), "a stipend is pay");
        Job past = ready(); past.setApplicationDeadline(NOW.minusHours(1));
        assertTrue(TpoDriveService.publishBlockers(past, NOW).get(0).contains("passed"));
        Job offCampus = ready(); offCampus.setDriveMode("OFF_CAMPUS");
        assertTrue(TpoDriveService.publishBlockers(offCampus, NOW).get(0).contains("application link"));
        Job outside = ready(); outside.setRecordedOutside(true); outside.setApplicationDeadline(null); outside.setDriveMode("OFF_CAMPUS");
        assertTrue(TpoDriveService.publishBlockers(outside, NOW).isEmpty(), "a drive recorded after it happened needs no deadline or link");
    }
}
