package com._42students.lms.dto.tpo;

import com._42students.lms.model.Learner;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The TPO student list must carry what a placement officer needs and none of the Learner entity's private fields. */
class StudentSummaryDTOTest {

    @Test void serialisesOnlyTheFieldsThePortalUses() throws Exception {
        Learner l = new Learner();
        l.setId(7);
        l.setFirstName("Asha");
        l.setLastName("Rao");
        l.setUniqueId("22CS001");
        l.setDepartment("CSE");
        l.setContactMail("asha@example.com");

        Map<?, ?> json = new ObjectMapper().readValue(new ObjectMapper().writeValueAsString(new StudentSummaryDTO(l)), Map.class);

        assertEquals("Asha", json.get("firstName"));
        assertEquals("CSE", json.get("department"));
        assertEquals(7, json.get("id"));
        Set<String> mustNotLeak = Set.of("dob", "bloodGroup", "tokenVersion", "suspensionReason", "suspendedAt",
                "address", "currentAddress", "permanentAddress", "pincode", "identity", "metadata", "hobbies");
        for (String field : mustNotLeak) {
            assertFalse(json.containsKey(field), field + " must not be exposed to the TPO student list");
        }
        assertTrue(json.keySet().containsAll(Set.of("id", "firstName", "lastName", "uniqueId", "department", "contactMail")));
    }
}
