package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.Learner;
import com._42students.lms.model.tpo.PlacementRegistration;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.tpo.PlacementRegistrationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TpoApplicantServiceTest {

    private final JobRepository jobRepository = mock(JobRepository.class);
    private final JobApplicationRepository applicationRepository = mock(JobApplicationRepository.class);
    private final LearnerRepository learnerRepository = mock(LearnerRepository.class);
    private final PlacementRegistrationRepository registrationRepository = mock(PlacementRegistrationRepository.class);
    private final EligibilityService eligibilityService = mock(EligibilityService.class);
    private final ApplicationTransitionService transitionService = mock(ApplicationTransitionService.class);
    private final NotificationOutboxService outboxService = mock(NotificationOutboxService.class);
    private final PlacementEligibilityService placementEligibility = mock(PlacementEligibilityService.class);

    private final TpoApplicantService service = new TpoApplicantService(
            jobRepository, applicationRepository, learnerRepository, registrationRepository,
            eligibilityService, placementEligibility, transitionService, outboxService,
            mock(org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate.class));

    /** These learners are in placements (Eligible); everyone else is Not decided. */
    private void inPlacements(int... ids) {
        java.util.Map<Integer, PlacementEligibilityService.Resolved> m = new java.util.HashMap<>();
        for (int id : ids) { PlacementEligibilityService.Resolved r = new PlacementEligibilityService.Resolved(); r.status = PlacementEligibilityService.ELIGIBLE; m.put(id, r); }
        when(placementEligibility.resolveCollege(9)).thenReturn(m);
    }

    private Learner learner(int id, String branch) {
        Learner learner = new Learner();
        learner.setId(id);
        learner.setDepartment(branch);
        learner.setCollegeId(9); // the drive's college (the service only keeps learners of that college)
        return learner;
    }

    private PlacementRegistration registration(int learnerId, long seasonId, String choice) {
        PlacementRegistration registration = new PlacementRegistration();
        registration.setLearnerId(learnerId);
        registration.setSeasonId(seasonId);
        registration.setChoice(choice);
        return registration;
    }

    @Test
    void notAppliedMeansRegisteredEligibleAndNotAlreadyApplied() {
        Job job = new Job();
        job.setId(55);
        job.setCollegeId(9);
        job.setSeasonId(7L);
        when(jobRepository.findById(55)).thenReturn(Optional.of(job));

        Learner eligible = learner(1, "CSE");
        Learner alreadyApplied = learner(2, "CSE");
        Learner higherStudies = learner(3, "ECE");
        Learner ineligible = learner(4, "ME");

        JobApplication existing = new JobApplication();
        existing.setLearner(alreadyApplied);
        when(applicationRepository.findByJobId(55)).thenReturn(List.of(existing));
        // BE-0100: the service now loads the Eligible students by id (no 5,000-learner page).
        when(learnerRepository.findAllById(any())).thenAnswer(inv -> {
            java.util.Set<Object> wanted = new java.util.HashSet<>();
            ((Iterable<?>) inv.getArgument(0)).forEach(wanted::add);
            return List.of(eligible, alreadyApplied, higherStudies, ineligible).stream().filter(l -> wanted.contains(l.getId())).collect(java.util.stream.Collectors.toList());
        });

        when(registrationRepository.findByLearnerIdIn(any())).thenReturn(List.of(
                registration(1, 7L, "PLACEMENTS"),
                registration(3, 7L, "HIGHER_STUDIES"),
                registration(4, 7L, "PLACEMENTS")
        ));
        when(eligibilityService.eligibleLearnerIds(eq(job), any()))
                .thenReturn(java.util.Set.of(1));
        inPlacements(1, 2, 3, 4);

        List<Learner> result = service.notApplied(55);

        assertEquals(List.of(1), result.stream().map(Learner::getId).toList());
    }

    @Test
    void aDriveWithoutASeasonStillListsOnlyRegisteredStudents() {
        Job job = new Job();
        job.setId(56);
        job.setCollegeId(9);
        job.setSeasonId(null);
        when(jobRepository.findById(56)).thenReturn(Optional.of(job));

        Learner eligible = learner(10, "CSE");
        Learner ineligible = learner(11, "ECE");
        when(applicationRepository.findByJobId(56)).thenReturn(List.of());
        Learner neverRegistered = learner(12, "CSE");
        // BE-0100: the service now loads the Eligible students by id (no 5,000-learner page).
        when(learnerRepository.findAllById(any())).thenAnswer(inv -> {
            java.util.Set<Object> wanted = new java.util.HashSet<>();
            ((Iterable<?>) inv.getArgument(0)).forEach(wanted::add);
            return List.of(eligible, ineligible, neverRegistered).stream().filter(l -> wanted.contains(l.getId())).collect(java.util.stream.Collectors.toList());
        });
        // Registration rows are found whatever season they were stored under; student 12 never registered.
        when(registrationRepository.findByLearnerIdIn(any())).thenReturn(List.of(registration(10, 3L, "PLACEMENTS"), registration(11, 3L, "PLACEMENTS")));
        when(eligibilityService.eligibleLearnerIds(eq(job), any())).thenAnswer(i -> {
            java.util.Set<Integer> out = new java.util.HashSet<>();
            for (Object o : (List<?>) i.getArgument(1)) if (((Learner) o).getId() != 11) out.add(((Learner) o).getId());
            return out;
        });
        inPlacements(10, 11, 12);

        assertEquals(List.of(10), service.notApplied(56).stream().map(Learner::getId).toList(), "not the student who never registered");
    }

    @Test
    void aStudentNotInPlacementsIsNeverOnTheNotAppliedList() {
        Job job = new Job();
        job.setId(57);
        job.setCollegeId(9);
        when(jobRepository.findById(57)).thenReturn(Optional.of(job));
        Learner in = learner(20, "CSE");
        Learner notDecided = learner(21, "CSE");
        when(applicationRepository.findByJobId(57)).thenReturn(List.of());
        // BE-0100: the service now loads the Eligible students by id (no 5,000-learner page).
        when(learnerRepository.findAllById(any())).thenAnswer(inv -> {
            java.util.Set<Object> wanted = new java.util.HashSet<>();
            ((Iterable<?>) inv.getArgument(0)).forEach(wanted::add);
            return List.of(in, notDecided).stream().filter(l -> wanted.contains(l.getId())).collect(java.util.stream.Collectors.toList());
        });
        when(eligibilityService.eligibleLearnerIds(eq(job), any())).thenAnswer(i -> {
            java.util.Set<Integer> out = new java.util.HashSet<>();
            for (Object o : (List<?>) i.getArgument(1)) out.add(((Learner) o).getId());
            return out;
        });
        when(registrationRepository.findByLearnerIdIn(any())).thenReturn(List.of(registration(20, 7L, "PLACEMENTS"), registration(21, 7L, "PLACEMENTS")));
        inPlacements(20);
        assertEquals(List.of(20), service.notApplied(57).stream().map(Learner::getId).toList());
    }
}
