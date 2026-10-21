package com._42students.lms.integration;

import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.*;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.tpo.*;
import com._42students.lms.service.tpo.NotificationOutboxService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoSeasonService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Opt-in (needs the same disposable lms_regression_test MySQL as MySqlRepositoryQueriesIT).
 *
 * MySqlRepositoryQueriesIT's sweep files every non-SQL exception under "notReached" instead of
 * failing, and the context runs with ddl-auto=none, so neither proves that the TPO V1 entities map
 * onto the V161/V162 tables or that the outbox's native FOR UPDATE SKIP LOCKED query runs. This
 * test does both: it persists one row of every new entity (including the JSON columns and the
 * NOT NULL created_at/updated_at columns) and runs the outbox claim and dispatch for real.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {
                "spring.flyway.enabled=false",
                "spring.jpa.hibernate.ddl-auto=none",
                "spring.jpa.open-in-view=false",
                "spring.main.allow-bean-definition-overriding=true",
                "STAGE=it",
                "JWT_SECRET=integration-test-only-jwt-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
                "GOOGLE_OAUTH_CLIENT_ID=dummy", "GOOGLE_OAUTH_CLIENT_SECRET=dummy",
                "GOOGLE_OAUTH_REDIRECT_URI=http://localhost/callback",
                "APP_FRONTEND_URL=http://localhost:3000", "APP_SUPER_ADMIN_PHONES=9000000000",
                "CORS_ALLOWED_ORIGINS=http://localhost:3000",
                "R2_ACCOUNT_ID=dummy", "R2_ACCESS_KEY=dummy", "R2_SECRET_KEY=dummy",
                "R2_BUCKET_NAME=dummy", "R2_PUBLIC_URL=http://localhost/r2",
                "SMS_API_KEY=dummy", "EXOTEL_API_KEY=dummy", "EXOTEL_API_TOKEN=dummy"
        })
class TpoV1MySqlIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        String url = System.getenv("LMS_MYSQL_IT_URL");
        String user = System.getenv("LMS_MYSQL_IT_USER");
        String password = System.getenv("LMS_MYSQL_IT_PASSWORD");
        assertTrue(url != null && url.matches(
                "^jdbc:mysql://(?:127\\.0\\.0\\.1|localhost):3306/lms_regression_test(?:\\?[^#]*)?$"),
                "BLOCKED: use only the dedicated localhost lms_regression_test database");
        assertTrue(user != null && !user.isBlank() && password != null && !password.isBlank());
        try (Connection connection = DriverManager.getConnection(url, user, password);
             Statement statement = connection.createStatement();
             ResultSet tables = statement.executeQuery(
                     "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")) {
            tables.next();
            if (tables.getInt(1) == 0) {
                try (Statement session = connection.createStatement()) {
                    session.execute("SET FOREIGN_KEY_CHECKS=0");
                    ScriptUtils.executeSqlScript(connection,
                            new EncodedResource(new ClassPathResource("db/mysql-schema-snapshot.sql"), StandardCharsets.UTF_8));
                    session.execute("SET FOREIGN_KEY_CHECKS=1");
                }
            }
        } catch (SQLException e) {
            throw new IllegalStateException("BLOCKED: could not prepare the disposable MySQL schema", e);
        }
        Flyway.configure().dataSource(url, user, password).locations("classpath:db/migration")
                .baselineOnMigrate(false).validateOnMigrate(true).cleanDisabled(true).load().migrate();
        registry.add("spring.datasource.url", () -> url);
        registry.add("spring.datasource.username", () -> user);
        registry.add("spring.datasource.password", () -> password);
        registry.add("LMS_JDBC_URL", () -> url);
        registry.add("LMS_DB_USER", () -> user);
        registry.add("LMS_DB_PASS", () -> password);
    }

    @Autowired PlatformTransactionManager transactionManager;
    @Autowired JobRepository jobs;
    @Autowired JobRoundRepository rounds;
    @Autowired RoundResultRepository results;
    @Autowired JobOfferRepository offers;
    @Autowired PlacementSeasonRepository seasons;
    @Autowired LearnerAcademicRecordRepository academic;
    @Autowired PlacementRegistrationRepository registrations;
    @Autowired PlacementDebarmentRepository debarments;
    @Autowired StudentRequestRepository requests;
    @Autowired RecruiterLeadRepository recruiterLeads;
    @Autowired RecruiterLeadActivityRepository activities;
    @Autowired FollowUpRepository followUps;
    @Autowired JobEligibilityOverrideRepository overrides;
    @Autowired PrepAssignmentRepository prep;
    @Autowired NotificationOutboxRepository outbox;
    @Autowired EmailSuppressionRepository suppression;
    @Autowired CollegePlacementRulesRepository rules;
    @Autowired CollegeWhatCompaniesSeeRepository whatCompaniesSee;
    @Autowired NotificationOutboxService outboxService;
    @Autowired TpoSeasonService seasonService;
    @Autowired TpoAccessGuard guard;
    @Autowired com._42students.lms.service.tpo.TpoRecruiterLeadService recruiterLeadService;
    @Autowired com._42students.lms.service.tpo.RecruiterInviteService recruiterInviteService;
    @Autowired com._42students.lms.service.tpo.RecruiterCollegeOverviewService overviewService;
    @Autowired com._42students.lms.service.tpo.TpoDriveService driveService;
    @Autowired com._42students.lms.service.recruiter.RecruiterAccessService recruiterAccessService;
    @Autowired com._42students.lms.repository.RecruiterRepository recruiters;
    @Autowired com._42students.lms.repository.RecruiterCollegeAccessRepository recruiterAccessRepo;
    @Autowired com._42students.lms.controller.RecruiterCollegeController recruiterCollegeController;
    @Autowired com._42students.lms.controller.tpo.TpoRecruiterAccessController tpoRecruiterAccessController;
    @javax.persistence.PersistenceContext javax.persistence.EntityManager em;

    private void inRolledBackTx(Runnable body) {
        new TransactionTemplate(transactionManager).execute(status -> {
            try { body.run(); } finally { status.setRollbackOnly(); }
            return null;
        });
    }

    @Test
    void everyNewEntityPersistsAndReadsBackAgainstTheRealSchema() {
        inRolledBackTx(() -> {
            Job job = new Job();
            job.setJobTitle("Software Engineer");
            job.setCompanyName("Acme");
            job.setOrganizationId(1);
            job.setCollegeId(6);
            job.setScreeningVersion("v1");
            job.setVisibilityType("INTERNAL_ONLY");
            job.setDriveMode("POOL");
            job.setLifecycleStatus("DRAFT");
            job.setEligibilityJson(Map.of("minCgpa", 7.0, "branches", List.of("CSE")));
            job.setRoleOptionsJson(List.of(Map.of("name", "Digital", "ctcLpa", 7)));
            job = jobs.saveAndFlush(job);
            Job reloaded = jobs.findById(job.getId()).orElseThrow();
            assertEquals("POOL", reloaded.getDriveMode());
            assertNotNull(reloaded.getEligibilityJson());

            JobRound round = new JobRound();
            round.setJobId(job.getId()); round.setSeq(1); round.setKind("TEST"); round.setName("Aptitude");
            round = rounds.saveAndFlush(round);
            assertNotNull(round.getCreatedAt(), "created_at must be filled by @CreationTimestamp, not sent as NULL");

            RoundResult result = new RoundResult();
            result.setApplicationId(1); result.setRoundId(round.getId()); result.setOutcome("PASS");
            result.setSource("RECRUITER"); result.setSubmittedByType("FACULTY"); result.setSubmittedAt(LocalDateTime.now());
            results.saveAndFlush(result);
            assertEquals(1, results.findByRoundIdAndAppliedAtIsNull(round.getId()).size());

            JobOffer offer = new JobOffer();
            offer.setApplicationId(1); offer.setCtcLpa(BigDecimal.valueOf(7.5));
            offer = offers.saveAndFlush(offer);
            assertEquals("SELECTED", offers.findById(offer.getId()).orElseThrow().getStatus());
            assertTrue(offers.findByJobId(job.getId()).isEmpty());
            assertNotNull(offers.findExpired());
            assertNotNull(offers.findExternalAcceptancesPastDisputeWindow());

            PlacementSeason season = new PlacementSeason();
            season.setCollegeId(6); season.setName("2026-27");
            season.setBlockedDates(List.of(Map.of("date", "2026-11-02", "label", "Mid-sem")));
            season = seasons.saveAndFlush(season);
            assertNotNull(season.getCreatedAt());

            LearnerAcademicRecord record = new LearnerAcademicRecord();
            record.setLearnerId(999001); record.setCgpa(BigDecimal.valueOf(8.1));
            academic.saveAndFlush(record);

            PlacementRegistration reg = new PlacementRegistration();
            reg.setLearnerId(999001); reg.setSeasonId(season.getId()); reg.setChoice("PLACEMENTS");
            registrations.saveAndFlush(reg);

            PlacementDebarment debar = new PlacementDebarment();
            debar.setLearnerId(999001); debar.setReason("No-show"); debar.setUntilDate(LocalDate.now().plusDays(30));
            debarments.saveAndFlush(debar);
            assertEquals(1, debarments.findByLearnerIdAndLiftedAtIsNull(999001).size());

            StudentRequest request = new StudentRequest();
            request.setLearnerId(999001); request.setType("WITHDRAWAL"); request.setPayloadJson(Map.of("why", "clash"));
            requests.saveAndFlush(request);

            RecruiterLead recruiterLead = new RecruiterLead();
            recruiterLead.setCollegeId(6); recruiterLead.setName("Ravi"); recruiterLead.setEmailNorm("ravi@acme.com");
            recruiterLead = recruiterLeads.saveAndFlush(recruiterLead);
            assertTrue(recruiterLeads.findFirstByCollegeIdAndEmailNorm(6, "ravi@acme.com").isPresent());
            RecruiterLeadActivity activity = new RecruiterLeadActivity();
            activity.setRecruiterLeadId(recruiterLead.getId()); activity.setType("CALL");
            activities.saveAndFlush(activity);
            FollowUp followUp = new FollowUp();
            followUp.setRecruiterLeadId(recruiterLead.getId()); followUp.setDueAt(LocalDateTime.now().minusMinutes(1));
            followUps.saveAndFlush(followUp);
            assertEquals(1, followUps.findByDoneAtIsNullAndDueAtLessThanEqualOrderByDueAtAsc(LocalDateTime.now()).size());

            JobEligibilityOverride override = new JobEligibilityOverride();
            override.setJobId(job.getId()); override.setLearnerId(999001);
            override.setOverrideType("INCLUDE"); override.setReason("Company agreed");
            overrides.saveAndFlush(override);

            PrepAssignment assignment = new PrepAssignment();
            assignment.setLearnerId(999001); assignment.setCourseId(1);
            prep.saveAndFlush(assignment);

            EmailSuppressionEntity suppressed = new EmailSuppressionEntity();
            suppressed.setEmailNorm("stop@acme.com");
            suppression.saveAndFlush(suppressed);

            CollegePlacementRules placementRules = new CollegePlacementRules();
            placementRules.setCollegeId(99001);
            rules.saveAndFlush(placementRules);
            CollegeWhatCompaniesSee see = new CollegeWhatCompaniesSee();
            see.setCollegeId(99001);
            whatCompaniesSee.saveAndFlush(see);
        });
    }

    @Test
    void startingASeasonWorksWithoutTheServiceSettingTimestamps() {
        inRolledBackTx(() -> {
            PlacementSeason season = seasonService.startSeason(6, "Overlapping season", LocalDate.now(), null);
            assertNotNull(season.getId());
            assertNotNull(seasonService.current(6));
        });
    }

    @Test
    void outboxClaimsOnlyDueRowsAndDispatchMarksThem() {
        inRolledBackTx(() -> {
            outboxService.enqueue("T_DUE_APP", "LEARNER", 1, "APP", Map.of("k", "v"), null, false);
            outboxService.enqueue("T_DUE_SMS", "LEARNER", 1, "SMS", Map.of("k", "v"), null, false);
            outboxService.enqueue("T_DUE_EMAIL", "LEARNER", 1, "EMAIL", Map.of("k", "v"), null, false);
            String group = outboxService.newUndoGroupId();
            outboxService.enqueue("T_HELD", "LEARNER", 1, "APP", Map.of("k", "v"), group, true);
            outbox.flush();

            List<NotificationOutboxEntry> claimed = outbox.claimDue(LocalDateTime.now(), 50);
            assertTrue(claimed.stream().anyMatch(e -> e.getEvent().equals("T_DUE_APP")));
            assertTrue(claimed.stream().noneMatch(e -> e.getEvent().equals("T_HELD")),
                    "a row held for the 30s Undo window must not be claimed yet");

            outboxService.dispatchDue();
            outbox.flush();
            assertEquals("SENT", find("T_DUE_APP").getStatus());
            assertEquals("FAILED", find("T_DUE_EMAIL").getStatus(), "an email with no template or no address is FAILED honestly, never falsely SENT");
            assertEquals("FAILED", find("T_DUE_SMS").getStatus(), "SMS must be marked FAILED, never falsely SENT");
            assertEquals("PENDING", find("T_HELD").getStatus());

            assertEquals(1, outboxService.cancelUndoGroup(group));
            outbox.flush();
            assertEquals("CANCELLED", find("T_HELD").getStatus());
        });
    }

    private Job jobIn(int college, String title) {
        Job job = new Job();
        job.setJobTitle(title);
        job.setCompanyName("Acme");
        job.setOrganizationId(1);
        job.setCollegeId(college);
        job.setScreeningVersion("v1");
        job.setVisibilityType("INTERNAL_ONLY");
        return jobs.saveAndFlush(job);
    }

    private void sql(String statement) {
        em.createNativeQuery(statement).executeUpdate();
    }

    private static void assertNotFound(Runnable call, String what) {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, call::run, what + " must be refused");
        assertEquals("Not found", e.getMessage(), what + ": a cross-college id must look exactly like a missing one");
    }

    /**
     * /api/v1/tpo/** is open to every TPO and every college ADMIN, so the role says nothing about
     * WHICH college. Seeds college 6 and college 7 and proves a college-7 caller reaches none of
     * college 6's data through any guard, while the college-6 caller reaches all of it.
     */
    @Test
    void aCallerCanOnlyReachTheirOwnCollegesData() {
        inRolledBackTx(() -> {
            Job job6 = jobIn(6, "College six drive");
            Job job7 = jobIn(7, "College seven drive");
            sql("insert into learner (id, college_id, token_version, version) values (990001, 6, 0, 0), (990002, 7, 0, 0)");
            sql("insert into job_application (id, learner_id, job_id, application_status, organization_id, pap_requested, version) values "
                    + "(990101, 990001, " + job6.getId() + ", 'APPLIED', 1, 0, 0), (990102, 990002, " + job7.getId() + ", 'APPLIED', 1, 0, 0)");
            JobRound round6 = new JobRound();
            round6.setJobId(job6.getId());
            round6.setSeq(1);
            round6.setKind("TEST");
            round6.setName("R1");
            round6 = rounds.saveAndFlush(round6);
            JobOffer offer6 = new JobOffer();
            offer6.setApplicationId(990101);
            offer6 = offers.saveAndFlush(offer6);
            RecruiterLead recruiterLead6 = new RecruiterLead();
            recruiterLead6.setCollegeId(6);
            recruiterLead6.setName("Six");
            recruiterLead6 = recruiterLeads.saveAndFlush(recruiterLead6);
            FollowUp followUp6 = new FollowUp();
            followUp6.setRecruiterLeadId(recruiterLead6.getId());
            followUp6.setDueAt(LocalDateTime.now().minusHours(1));
            followUp6 = followUps.saveAndFlush(followUp6);
            StudentRequest request6 = new StudentRequest();
            request6.setLearnerId(990001);
            request6.setType("WITHDRAWAL");
            request6 = requests.saveAndFlush(request6);
            PlacementDebarment debarment6 = new PlacementDebarment();
            debarment6.setLearnerId(990001);
            debarment6.setReason("x");
            debarment6 = debarments.saveAndFlush(debarment6);
            PlacementSeason season6 = new PlacementSeason();
            season6.setCollegeId(6);
            season6.setName("S");
            season6 = seasons.saveAndFlush(season6);
            em.flush();

            final Job fJob6 = job6;
            final JobRound fRound6 = round6;
            final JobOffer fOffer6 = offer6;
            final RecruiterLead fRecruiterLead6 = recruiterLead6;
            final FollowUp fFollowUp6 = followUp6;
            final StudentRequest fRequest6 = request6;
            final PlacementDebarment fDebarment6 = debarment6;
            final PlacementSeason fSeason6 = season6;
            UserPrincipal owner = new UserPrincipal(1, "FACULTY", "TPO", 1, 6, 0);
            UserPrincipal outsider = new UserPrincipal(2, "FACULTY", "ADMIN", 1, 7, 0);
            UserPrincipal noCollege = new UserPrincipal(3, "FACULTY", "TPO", 1, null, 0);
            UserPrincipal studentSix = new UserPrincipal(990001, "LEARNER", null, 1, 6, 0);
            UserPrincipal studentSeven = new UserPrincipal(990002, "LEARNER", null, 1, 7, 0);

            // the owning college reaches everything
            guard.requireJob(owner, fJob6.getId());
            guard.requireApplication(owner, 990101);
            guard.requireApplicationsInJob(owner, fJob6.getId(), List.of(990101));
            guard.requireRound(owner, fRound6.getId());
            guard.requireApplicationInRoundJob(owner, fRound6.getId(), 990101);
            guard.requireOffer(owner, fOffer6.getId());
            guard.requireRecruiterLead(owner, fRecruiterLead6.getId());
            guard.requireFollowUp(owner, fFollowUp6.getId());
            guard.requireLearner(owner, 990001);
            guard.requireRequest(owner, fRequest6.getId());
            guard.requireDebarment(owner, fDebarment6.getId());
            guard.requireSeason(owner, fSeason6.getId());
            guard.requireOwnApplication(990001, 990101);
            guard.requireJobVisibleToLearner(studentSix, fJob6.getId());

            // another college's admin reaches none of it
            assertNotFound(() -> guard.requireJob(outsider, fJob6.getId()), "job");
            assertNotFound(() -> guard.requireApplication(outsider, 990101), "application");
            assertNotFound(() -> guard.requireApplicationsInJob(outsider, fJob6.getId(), List.of(990101)), "bulk applications");
            assertNotFound(() -> guard.requireRound(outsider, fRound6.getId()), "round");
            assertNotFound(() -> guard.requireApplicationInRoundJob(outsider, fRound6.getId(), 990101), "result for a round");
            assertNotFound(() -> guard.requireOffer(outsider, fOffer6.getId()), "offer");
            assertNotFound(() -> guard.requireRecruiterLead(outsider, fRecruiterLead6.getId()), "recruiterLead");
            assertNotFound(() -> guard.requireFollowUp(outsider, fFollowUp6.getId()), "follow-up");
            assertNotFound(() -> guard.requireLearner(outsider, 990001), "student");
            assertNotFound(() -> guard.requireRequest(outsider, fRequest6.getId()), "student request");
            assertNotFound(() -> guard.requireDebarment(outsider, fDebarment6.getId()), "debarment");
            assertNotFound(() -> guard.requireSeason(outsider, fSeason6.getId()), "season");
            assertNotFound(() -> guard.requireJobVisibleToLearner(studentSeven, fJob6.getId()), "another college's drive for a student");

            // a bulk list that mixes in an application from another job is refused as a whole
            assertNotFound(() -> guard.requireApplicationsInJob(owner, fJob6.getId(), List.of(990101, 990102)), "mixed bulk list");
            // a result cannot be staged for an application that is not in the round's own job
            assertNotFound(() -> guard.requireApplicationInRoundJob(owner, fRound6.getId(), 990102), "cross-job result");
            // a student cannot point a request at someone else's application
            assertNotFound(() -> guard.requireOwnApplication(990001, 990102), "another student's application");
            // a missing id and a caller with no college are refused the same way
            assertNotFound(() -> guard.requireJob(owner, 2_000_000_000), "missing job");
            assertNotFound(() -> guard.requireJob(noCollege, fJob6.getId()), "caller with no college");

            // list endpoints are scoped, not global
            assertEquals(1, requests.findPendingForCollege(6).stream().filter(r -> r.getId().equals(fRequest6.getId())).count());
            assertEquals(0, requests.findPendingForCollege(7).stream().filter(r -> r.getId().equals(fRequest6.getId())).count());
            assertEquals(1, followUps.findDueForCollege(LocalDateTime.now(), 6).stream().filter(f -> f.getId().equals(fFollowUp6.getId())).count());
            assertEquals(0, followUps.findDueForCollege(LocalDateTime.now(), 7).stream().filter(f -> f.getId().equals(fFollowUp6.getId())).count());
        });
    }

    // ------------------------------------------------------------------ recruiter invite flow

    private static void signIn(UserPrincipal principal) {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }

    private static UserPrincipal recruiterPrincipal(int recruiterId, int college) {
        return new UserPrincipal(recruiterId, "RECRUITER", null, 1, college, 0);
    }

    private String freshToken(RecruiterLead recruiterLead) {
        return (String) recruiterLeadService.invite(recruiterLead.getId()).get("token");
    }

    private static com._42students.lms.service.tpo.RecruiterInviteService.AcceptInput input(String name, String phone) {
        com._42students.lms.service.tpo.RecruiterInviteService.AcceptInput in = new com._42students.lms.service.tpo.RecruiterInviteService.AcceptInput();
        in.firstName = name;
        in.phone = phone;
        return in;
    }

    /**
     * The whole TPO -> recruiter path on real MySQL: the link previews without being spent, a typo does not
     * burn it, accepting creates the recruiter + a college-only grant + marks the recruiter lead joined, and the link
     * then dies. Expired, rotated, withdrawn and blocked-number cases all fail closed.
     */
    @Test
    void anInviteLinkIsSpentExactlyOnceAndOnlyByAcceptingIt() {
        inRolledBackTx(() -> {
            sql("insert into college (id, name, org_id) values (99006, 'Invite Test College', 1), (99007, 'Other College', 1)");
            RecruiterLead recruiterLead = recruiterLeadService.addRecruiterLead(99006, "Ravi", "ravi@acme.com", null, 1);
            assertEquals("ACME", recruiterLead.getCompanyName(), "company comes from the email domain, not from the HR");

            String token = freshToken(recruiterLead);
            assertEquals("Invite Test College", recruiterInviteService.preview(token).get("collegeName"));
            recruiterInviteService.preview(token); // a mail scanner opening it again must not spend it
            assertNotNull(recruiterLeads.findById(recruiterLead.getId()).orElseThrow().getInviteTokenHash(), "previewing must never consume the link");

            // a typo must not burn the link
            com._42students.lms.service.tpo.RecruiterInviteService.InviteRejected bad = assertThrows(
                    com._42students.lms.service.tpo.RecruiterInviteService.InviteRejected.class,
                    () -> acceptWithCode(token, input("Ravi", "12345")));
            assertEquals("INVALID_MOBILE", bad.getCode());
            assertNotNull(recruiterInviteService.preview(token));

            Map<String, Object> joined = acceptWithCode(token, input("Ravi", "9876500001"));
            assertEquals("JOINED", joined.get("status"));
            assertEquals("0001", joined.get("phoneEnding"));

            RecruiterLead after = recruiterLeads.findById(recruiterLead.getId()).orElseThrow();
            assertNull(after.getInviteTokenHash(), "the link is spent");
            assertNotNull(after.getRecruiterId());
            com._42students.lms.model.Recruiter recruiter = recruiters.findByContactMobile("9876500001").orElseThrow();
            assertEquals(after.getRecruiterId().intValue(), recruiter.getId());
            assertNotNull(recruiter.getCompanyId());
            com._42students.lms.model.RecruiterCollegeAccess grant = recruiterAccessRepo.findForRecruiterAndCollege(recruiter.getId(), 99006).orElseThrow();
            assertEquals(com._42students.lms.service.recruiter.RecruiterCapability.KNOWN, grant.getCapabilities());
            assertTrue(recruiterAccessRepo.findForRecruiterAndCollege(recruiter.getId(), 99007).isEmpty(), "the grant is for the inviting college only");

            // the same link cannot be used again, by anyone
            assertThrows(com._42students.lms.service.tpo.RecruiterInviteService.InviteInvalid.class, () -> acceptWithCode(token, input("Someone", "9876500002")));
            assertThrows(com._42students.lms.service.tpo.RecruiterInviteService.InviteInvalid.class, () -> recruiterInviteService.preview(token));
            assertTrue(recruiters.findByContactMobile("9876500002").isEmpty());
            assertThrows(IllegalStateException.class, () -> recruiterLeadService.invite(recruiterLead.getId()), "an HR who joined cannot be re-invited");

            // the recruiter can use their own college and nothing else
            recruiterAccessService.requireCollege(recruiterPrincipal(recruiter.getId(), 99006), 99006, com._42students.lms.service.recruiter.RecruiterCapability.COLLEGE_OVERVIEW);
            assertThrows(org.springframework.security.access.AccessDeniedException.class,
                    () -> recruiterAccessService.requireCollege(recruiterPrincipal(recruiter.getId(), 99007), 99007, com._42students.lms.service.recruiter.RecruiterCapability.COLLEGE_OVERVIEW));
        });
    }

    @Test
    void expiredRotatedWithdrawnAndBlockedInvitesFailClosed() {
        inRolledBackTx(() -> {
            sql("insert into college (id, name, org_id) values (99006, 'Invite Test College', 1)");

            RecruiterLead expired = recruiterLeadService.addRecruiterLead(99006, "Old", "old@acme.com", null, 1);
            String expiredToken = freshToken(expired);
            RecruiterLead e = recruiterLeads.findById(expired.getId()).orElseThrow();
            e.setInviteSentAt(LocalDateTime.now().minusDays(8));
            recruiterLeads.saveAndFlush(e);
            assertThrows(com._42students.lms.service.tpo.RecruiterInviteService.InviteInvalid.class, () -> recruiterInviteService.preview(expiredToken));

            RecruiterLead rotated = recruiterLeadService.addRecruiterLead(99006, "Rot", "rot@acme.com", null, 1);
            String first = freshToken(rotated);
            String second = freshToken(rotated);
            assertThrows(com._42students.lms.service.tpo.RecruiterInviteService.InviteInvalid.class, () -> recruiterInviteService.preview(first), "re-inviting kills the old link");
            assertNotNull(recruiterInviteService.preview(second));

            RecruiterLead notNow = recruiterLeadService.addRecruiterLead(99006, "Nope", "nope@acme.com", null, 1);
            String notNowToken = freshToken(notNow);
            recruiterLeadService.markNotNow(notNow.getId(), "Not hiring", null);
            assertThrows(com._42students.lms.service.tpo.RecruiterInviteService.InviteInvalid.class, () -> recruiterInviteService.preview(notNowToken), "a withdrawn recruiterLead's link is dead");

            assertThrows(com._42students.lms.service.tpo.RecruiterInviteService.InviteInvalid.class, () -> recruiterInviteService.preview("not-a-real-token"));
            assertThrows(com._42students.lms.service.tpo.RecruiterInviteService.InviteInvalid.class, () -> recruiterInviteService.preview("x".repeat(500)));

            // a number belonging to a suspended recruiter is refused BEFORE the link is spent
            com._42students.lms.model.Recruiter blocked = new com._42students.lms.model.Recruiter();
            blocked.setFirstName("Blocked");
            blocked.setContactMobile("9876500009");
            blocked.setTokenVersion(0);
            blocked.setIsDeleted(false);
            blocked.setSuspendedAt(LocalDateTime.now());
            recruiters.saveAndFlush(blocked);
            RecruiterLead fresh = recruiterLeadService.addRecruiterLead(99006, "Fresh", "fresh@acme.com", null, 1);
            String freshTok = freshToken(fresh);
            com._42students.lms.service.tpo.RecruiterInviteService.InviteRejected r = assertThrows(
                    com._42students.lms.service.tpo.RecruiterInviteService.InviteRejected.class,
                    () -> acceptWithCode(freshTok, input("Fresh", "9876500009")));
            assertEquals("ACCOUNT_UNAVAILABLE", r.getCode());
            assertNotNull(recruiterInviteService.preview(freshTok), "a refused number must not burn the link");
        });
    }

    @Test
    void anRecruiterSeesOnlyGroupedRoundedCountsAndOnlyTheirOwnRequests() {
        inRolledBackTx(() -> {
            sql("insert into college (id, name, org_id) values (99006, 'Overview College', 1), (99007, 'Other College', 1)");
            StringBuilder rows = new StringBuilder();
            for (int i = 0; i < 12; i++) rows.append(i == 0 ? "" : ",").append("(").append(991000 + i).append(", 99006, 'CSE', 0, 0)");
            for (int i = 0; i < 3; i++) rows.append(",(").append(991100 + i).append(", 99006, 'ECE', 0, 0)");
            sql("insert into learner (id, college_id, department, token_version, version) values " + rows);
            em.flush();

            Map<String, Object> overview = overviewService.overview(99006);
            assertEquals(15, overview.get("studentsTotal"));
            @SuppressWarnings("unchecked") List<Map<String, Object>> byBranch = (List<Map<String, Object>>) overview.get("byBranch");
            assertEquals(1, byBranch.size(), "a branch under 10 students is left out of the breakdown");
            assertEquals("CSE", byBranch.get(0).get("branch"));
            assertEquals(10, byBranch.get(0).get("count"), "12 is shown rounded to the nearest 5");
            assertTrue(((List<?>) overview.get("cgpaBands")).isEmpty(), "no verified records, no bands");
            assertFalse(overview.toString().contains("firstName"), "no individual is ever named");

            // set up a recruiter at 99006 through the real invite path
            RecruiterLead recruiterLead = recruiterLeadService.addRecruiterLead(99006, "Priya", "priya@acme.com", null, 1);
            acceptWithCode(freshToken(recruiterLead), input("Priya", "9876500003"));
            com._42students.lms.model.Recruiter recruiter = recruiters.findByContactMobile("9876500003").orElseThrow();
            signIn(recruiterPrincipal(recruiter.getId(), 99006));

            assertEquals(200, recruiterCollegeController.overview(99006).getStatusCodeValue());
            assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> recruiterCollegeController.overview(99007),
                    "an HR cannot read a college they were not invited to");

            com._42students.lms.dto.tpo.DriveForm form = new com._42students.lms.dto.tpo.DriveForm();
            form.setJobTitle("Software Engineer");
            form.setCompanyName("Google"); // a recruiter cannot choose another company
            form.setJobDescription("Build and ship features");
            form.setLocation("Hyderabad");
            com._42students.lms.model.tpo.JobRoleOption role = new com._42students.lms.model.tpo.JobRoleOption();
            role.setCtcLpa(new java.math.BigDecimal("8.5"));
            form.setRoleOptions(java.util.List.of(role));
            com._42students.lms.model.tpo.JobEligibility eligibility = new com._42students.lms.model.tpo.JobEligibility();
            eligibility.setMinCgpa(6.5);
            form.setEligibility(eligibility);
            Map<String, Object> created = recruiterCollegeController.request(99006, form).getBody();
            assertEquals("Waiting for approval", created.get("status"));
            // "Edit and send again" needs every field back, not just the role title (UI/UX audit, 2026-10-01)
            assertEquals("Build and ship features", created.get("description"));
            assertEquals("Hyderabad", created.get("location"));
            assertEquals(0, new java.math.BigDecimal("8.5").compareTo((java.math.BigDecimal) created.get("ctcLpa")));
            assertEquals(6.5, created.get("minCgpa"));
            Job job = jobs.findById((Integer) created.get("id")).orElseThrow();
            assertEquals("ACME", job.getCompanyName(), "the company comes from the HR's own account");
            assertEquals("REQUEST", job.getLifecycleStatus());
            assertTrue(job.getIsDraft(), "a request is invisible to students");
            assertEquals(1, recruiterCollegeController.myRequests(99006).getBody().size());

            com._42students.lms.dto.tpo.DriveForm tooShort = new com._42students.lms.dto.tpo.DriveForm();
            tooShort.setJobTitle("ab");
            assertThrows(IllegalArgumentException.class, () -> recruiterCollegeController.request(99006, tooShort));

            // the TPO sends it back with a note, the recruiter resubmits, the TPO approves
            signIn(new UserPrincipal(1, "FACULTY", "TPO", 1, 99006, 0));
            driveService.sendBack(job.getId(), "Please add the CTC");
            signIn(recruiterPrincipal(recruiter.getId(), 99006));
            Map<String, Object> sentBack = recruiterCollegeController.myRequests(99006).getBody().get(0);
            assertEquals("Sent back", sentBack.get("status"));
            assertEquals("Please add the CTC", sentBack.get("noteFromPlacementCell"));
            for (String field : new String[]{"fixedLpa", "variableLpa", "minCgpa", "branches", "driveMode"}) {
                assertTrue(sentBack.containsKey(field), "Hire again and Fix and resend restore " + field);
            }
            assertEquals("Waiting for approval", recruiterCollegeController.resubmit(99006, job.getId(), form).getBody().get("status"));
            assertEquals("DRAFT", driveService.approveRequest(job.getId(), 1).getLifecycleStatus());
            assertThrows(IllegalStateException.class, () -> driveService.approveRequest(job.getId(), 1), "approving twice is refused");

            // a second recruiter (same college) cannot touch the first recruiter's request
            RecruiterLead other = recruiterLeadService.addRecruiterLead(99006, "Amit", "amit@beta.com", null, 1);
            acceptWithCode(freshToken(other), input("Amit", "9876500004"));
            com._42students.lms.model.Recruiter recruiter2 = recruiters.findByContactMobile("9876500004").orElseThrow();
            signIn(recruiterPrincipal(recruiter2.getId(), 99006));
            assertTrue(recruiterCollegeController.myRequests(99006).getBody().isEmpty(), "each HR sees only their own requests");
            assertThrows(IllegalArgumentException.class, () -> recruiterCollegeController.resubmit(99006, job.getId(), form));

            // the TPO lists their recruiter and revokes one: access ends on the very next call
            signIn(new UserPrincipal(1, "FACULTY", "TPO", 1, 99006, 0));
            assertEquals(2, tpoRecruiterAccessController.list().getBody().size());
            assertTrue(tpoRecruiterAccessController.list().getBody().get(0).get("phone").toString().startsWith("******"), "phone is masked");
            tpoRecruiterAccessController.revoke(recruiter.getId(), null);
            signIn(recruiterPrincipal(recruiter.getId(), 99006));
            assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> recruiterCollegeController.overview(99006));
            // another college's TPO cannot list or revoke this college's recruiter
            signIn(new UserPrincipal(9, "FACULTY", "TPO", 1, 99007, 0));
            assertTrue(tpoRecruiterAccessController.list().getBody().isEmpty());
            assertThrows(IllegalArgumentException.class, () -> tpoRecruiterAccessController.revoke(recruiter2.getId(), null));
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        });
    }

    private NotificationOutboxEntry find(String event) {
        return outbox.findAll().stream().filter(e -> event.equals(e.getEvent())).findFirst().orElseThrow();
    }

    /** Accepting an invite needs the emailed code (recruiter phase 1, step 4): store a known one for this link, then accept. */
    private java.util.Map<String, Object> acceptWithCode(String token, com._42students.lms.service.tpo.RecruiterInviteService.AcceptInput in) {
        String th = com._42students.lms.service.tpo.TpoRecruiterLeadService.sha256Hex(token);
        Object leadEmail = em.createNativeQuery("SELECT email_norm FROM recruiter_lead WHERE invite_token_hash = ?1").setParameter(1, th)
                .getResultList().stream().findFirst().orElse(null);
        String email = leadEmail != null ? String.valueOf(leadEmail) : (in.email == null ? null : in.email.trim().toLowerCase());
        if (email != null) {
            em.createNativeQuery("INSERT INTO recruiter_invite_code (invite_token_hash, email, code_hash, expires_at) VALUES (?1, ?2, ?3, ?4)")
                    .setParameter(1, th).setParameter(2, email)
                    .setParameter(3, com._42students.lms.service.tpo.TpoRecruiterLeadService.sha256Hex(th + ":123456"))
                    .setParameter(4, java.time.LocalDateTime.now().plusMinutes(10)).executeUpdate();
        }
        in.code = "123456";
        return recruiterInviteService.accept(token, in);
    }
}
