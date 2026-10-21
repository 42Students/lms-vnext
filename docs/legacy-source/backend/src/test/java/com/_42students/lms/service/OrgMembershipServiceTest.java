package com._42students.lms.service;

import com._42students.lms.model.College;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.OrganizationRepository;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class OrgMembershipServiceTest {

    @Test
    void listMemberships_includesRealCrossRoleAccountsButUsesEachAccountsOwnIdentity() {
        CollegeRepository collegeRepo = Mockito.mock(CollegeRepository.class);
        LearnerRepository learnerRepo = Mockito.mock(LearnerRepository.class);
        FacultyRepository facultyRepo = Mockito.mock(FacultyRepository.class);
        OrganizationRepository orgRepo = Mockito.mock(OrganizationRepository.class);
        AppSettingsService appSettings = Mockito.mock(AppSettingsService.class);
        TenantDomainRepository domains = Mockito.mock(TenantDomainRepository.class);

        OrgMembershipService svc = new OrgMembershipService(collegeRepo, learnerRepo, facultyRepo, orgRepo, appSettings, domains);
        UserPrincipal principal = new UserPrincipal(101, "LEARNER", null, 1, 1, 0);

        Learner learner = new Learner();
        learner.setId(101);
        learner.setCollegeId(1);
        learner.setContactMobile("9000000000");

        // A real faculty account with the same mobile belongs to a different college.
        Faculty faculty = new Faculty();
        faculty.setId(202);
        faculty.setCollegeId(2);
        faculty.setContactMobile("9000000000");

        when(learnerRepo.findById(101)).thenReturn(Optional.of(learner));
        when(learnerRepo.findAllByContactMobileAndNotDeleted("9000000000")).thenReturn(List.of(learner));
        when(facultyRepo.findAllByContactMobileAndNotDeleted("9000000000")).thenReturn(List.of(faculty));

        College college1 = new College();
        college1.setId(1);
        college1.setUniqueId("c1");
        college1.setName("College 1");
        college1.setOrgId(1);
        College college2 = new College();
        college2.setId(2);
        college2.setUniqueId("c2");
        college2.setName("College 2");
        college2.setOrgId(2);
        when(collegeRepo.findById(1)).thenReturn(Optional.of(college1));
        when(collegeRepo.findById(2)).thenReturn(Optional.of(college2));

        List<Map<String, Object>> memberships = svc.listMemberships(principal);
        assertEquals(2, memberships.size());
        Map<String, Object> learnerMembership = memberships.stream()
                .filter(m -> "LEARNER".equals(m.get("userType"))).findFirst().orElseThrow();
        Map<String, Object> facultyMembership = memberships.stream()
                .filter(m -> "FACULTY".equals(m.get("userType"))).findFirst().orElseThrow();
        assertEquals(1, learnerMembership.get("collegeId"));
        assertEquals(101, learnerMembership.get("userId"));
        assertEquals("acc:LEARNER:101:college:1", learnerMembership.get("key"));
        assertEquals(2, facultyMembership.get("collegeId"));
        assertEquals(202, facultyMembership.get("userId"));
        assertEquals("acc:FACULTY:202:college:2", facultyMembership.get("key"));
        assertNotEquals(learnerMembership.get("key"), facultyMembership.get("key"));
    }
}
