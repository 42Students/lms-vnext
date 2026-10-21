package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Recruiter phase 1, step 9 (N11): until the placement cell sets it, a company's communication status follows what is known. */
class CompanyCommunicationTest {

    private static Map<String, Object> person(String stage) {
        return Map.of("stage", stage);
    }

    @Test
    void derivedFromRecruitersAndDrives() {
        assertEquals("NOT_CONTACTED", TpoRecruiterLeadsHubService.derivedCommunication(List.of(), 0));
        assertEquals("NOT_CONTACTED", TpoRecruiterLeadsHubService.derivedCommunication(List.of(person("NEW")), 0));
        assertEquals("EMAILED", TpoRecruiterLeadsHubService.derivedCommunication(List.of(person("INVITED")), 0));
        assertEquals("REPLIED", TpoRecruiterLeadsHubService.derivedCommunication(List.of(person("JOINED")), 0));
        assertEquals("REPLIED", TpoRecruiterLeadsHubService.derivedCommunication(List.of(), 2));
        assertEquals("NOT_INTERESTED", TpoRecruiterLeadsHubService.derivedCommunication(List.of(person("NOT_NOW")), 0));
    }

    @Test
    void theFiveStatusesInOrder() {
        assertEquals(List.of("NOT_CONTACTED", "EMAILED", "REPLIED", "MEETING_SET", "NOT_INTERESTED"), TpoRecruiterLeadsHubService.COMMUNICATION);
    }
}
