package com._42students.lms.service.impl;

import com._42students.lms.dto.request.BulkLearnerItem;
import com._42students.lms.dto.request.BulkRegisterRequest;
import com._42students.lms.dto.request.BulkValidateRequest;
import com._42students.lms.dto.response.BulkRegisterResponse;
import com._42students.lms.dto.response.BulkValidateResponse;
import com._42students.lms.model.Department;
import com._42students.lms.model.Learner;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model._Class;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LearnerServiceImpl bulk-validate and bulk-register (edge cases from checklist).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LearnerBulkServiceTest {

    @Mock
    private LearnerRepository learnerRepository;
    @Mock
    private _ClassRepository classRepository;
    @Mock
    private NewProgramRepository newProgramRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private com._42students.lms.access.ScopeResolutionService scopeResolutionService;

    @InjectMocks
    private LearnerServiceImpl learnerService;

    /**
     * bulkRegister persists each row through a self-injected proxy so every row gets its own
     * REQUIRES_NEW transaction (otherwise one bad row silently discards the whole batch after
     * the caller has been told those rows succeeded). @InjectMocks leaves that field null, so
     * point it back at the instance under test — the behaviour is identical here; only the
     * transaction boundary, which these unit tests do not exercise, differs.
     */
    @org.junit.jupiter.api.BeforeEach
    void wireSelfProxy() {
        org.springframework.test.util.ReflectionTestUtils.setField(learnerService, "self", learnerService);
    }

    private static final int COLLEGE_ID = 1;
    private static final int PROGRAM_ID = 10;
    private static final int CLASS_ID = 100;

    @Nested
    @DisplayName("bulkValidate")
    class BulkValidateTests {

        @Test
        @DisplayName("null request returns empty response (E56)")
        void nullRequest_returnsEmptyResponse() {
            BulkValidateResponse response = learnerService.bulkValidate(null);
            assertNotNull(response);
            assertTrue(response.getExistingMobiles().isEmpty());
            assertTrue(response.getExistingEmails().isEmpty());
            verifyNoInteractions(learnerRepository);
        }

        @Test
        @DisplayName("empty mobiles and emails returns empty lists")
        void emptyMobilesAndEmails_returnsEmptyLists() {
            BulkValidateRequest request = new BulkValidateRequest();
            request.setMobiles(Collections.emptyList());
            request.setEmails(Collections.emptyList());

            BulkValidateResponse response = learnerService.bulkValidate(request);

            assertNotNull(response);
            assertTrue(response.getExistingMobiles().isEmpty());
            assertTrue(response.getExistingEmails().isEmpty());
            verifyNoInteractions(learnerRepository);
        }

        @Test
        @DisplayName("normalizes mobiles to digits only and returns existing from DB")
        void normalizesMobiles_returnsExistingFromDb() {
            BulkValidateRequest request = new BulkValidateRequest();
            request.setMobiles(List.of(" 9876-500-001 ", "9876500002"));
            request.setEmails(null);

            Learner existing = new Learner();
            existing.setContactMobile("9876500001");
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(List.of(existing));

            BulkValidateResponse response = learnerService.bulkValidate(request);

            assertFalse(response.getExistingMobiles().isEmpty());
            assertTrue(response.getExistingMobiles().contains("9876500001"));
            assertTrue(response.getExistingEmails().isEmpty());
        }

        @Test
        @DisplayName("lowercase emails and returns existing from DB")
        void lowercaseEmails_returnsExistingFromDb() {
            BulkValidateRequest request = new BulkValidateRequest();
            request.setMobiles(null);
            request.setEmails(List.of("  Test@Example.COM  "));

            Learner existing = new Learner();
            existing.setContactMail("test@example.com");
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(List.of(existing));

            BulkValidateResponse response = learnerService.bulkValidate(request);

            assertTrue(response.getExistingMobiles().isEmpty());
            assertFalse(response.getExistingEmails().isEmpty());
            assertTrue(response.getExistingEmails().contains("test@example.com"));
        }

        @Test
        @DisplayName("null mobiles list does not NPE")
        void nullMobilesList_doesNotNpe() {
            BulkValidateRequest request = new BulkValidateRequest();
            request.setMobiles(null);
            request.setEmails(null);

            BulkValidateResponse response = learnerService.bulkValidate(request);

            assertNotNull(response);
            assertTrue(response.getExistingMobiles().isEmpty());
            assertTrue(response.getExistingEmails().isEmpty());
            verifyNoInteractions(learnerRepository);
        }

        @Test
        @DisplayName("filters null and empty strings in mobiles before batch call")
        void filtersNullAndEmptyInMobiles() {
            BulkValidateRequest request = new BulkValidateRequest();
            List<String> mobiles = new ArrayList<>();
            mobiles.add("");
            mobiles.add("  ");
            mobiles.add(null);
            mobiles.add("9876500001");
            request.setMobiles(mobiles);
            request.setEmails(null);

            when(learnerRepository.findByContactMobileInAndNotDeleted(List.of("9876500001"))).thenReturn(Collections.emptyList());

            BulkValidateResponse response = learnerService.bulkValidate(request);

            assertTrue(response.getExistingMobiles().isEmpty());
            verify(learnerRepository).findByContactMobileInAndNotDeleted(List.of("9876500001"));
        }
    }

    @Nested
    @DisplayName("bulkRegister")
    class BulkRegisterTests {

        private _Class validClass;
        private NewProgram validProgram;
        private Department validDept;

        @BeforeEach
        void setUp() {
            validClass = new _Class();
            validClass.setId(CLASS_ID);
            validClass.setProgramId(PROGRAM_ID);
            validProgram = new NewProgram();
            validProgram.setId(PROGRAM_ID);
            validProgram.setDeptId(20);
            validDept = new Department();
            validDept.setCollegeId(COLLEGE_ID);
            validDept.setId(20);
        }

        @Test
        @DisplayName("class not found or wrong program throws")
        void classNotFoundOrWrongProgram_throws() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "9876500001", null);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class, () -> learnerService.bulkRegister(request));
            verify(learnerRepository, never()).save(any());
        }

        @Test
        @DisplayName("class belongs to different program throws")
        void classDifferentProgram_throws() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "9876500001", null);
            validClass.setProgramId(999);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));

            assertThrows(RuntimeException.class, () -> learnerService.bulkRegister(request));
        }

        @Test
        @DisplayName("program not found throws")
        void programNotFound_throws() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "9876500001", null);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class, () -> learnerService.bulkRegister(request));
        }

        @Test
        @DisplayName("department not in college throws")
        void departmentNotInCollege_throws() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "9876500001", null);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            validDept.setCollegeId(999);
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));

            assertThrows(RuntimeException.class, () -> learnerService.bulkRegister(request));
        }

        @Test
        @DisplayName("duplicate mobile in DB fails row")
        void duplicateMobileInDb_failsRow() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "9876500001", null);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            Learner existingLearner = new Learner();
            existingLearner.setContactMobile("9876500001");
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(List.of(existingLearner));
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(COLLEGE_ID, "22CS001")).thenReturn(null);

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("mobile"));
            verify(learnerRepository, never()).save(any());
        }

        @Test
        @DisplayName("duplicate roll in college fails row")
        void duplicateRollInCollege_failsRow() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "9876500001", null);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            Learner existingByRoll = new Learner();
            when(learnerRepository.getLearnerByCollegeAndRoll(COLLEGE_ID, "22CS001")).thenReturn(existingByRoll);

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("roll"));
            verify(learnerRepository, never()).save(any());
        }

        @Test
        @DisplayName("valid row creates learner and returns created id")
        void validRow_createsAndReturnsId() {
            BulkRegisterRequest request = requestWithOneLearner("Rahul", "Kumar", "22CS001", "9876500001", "r@test.edu");
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(COLLEGE_ID, "22CS001")).thenReturn(null);
            Learner saved = new Learner();
            saved.setId(501);
            when(learnerRepository.save(any(Learner.class))).thenReturn(saved);
            when(scopeResolutionService.enrichLearnerHierarchy(any(Learner.class))).thenAnswer(inv -> inv.getArgument(0));

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertEquals(1, response.getCreatedIds().size());
            assertEquals(501, response.getCreatedIds().get(0));
            assertTrue(response.getFailed().isEmpty());
            verify(learnerRepository).save(any(Learner.class));
        }

        @Test
        @DisplayName("empty mobile fails row with reason")
        void emptyMobile_failsRow() {
            BulkLearnerItem item = new BulkLearnerItem();
            item.setFirstName("F");
            item.setLastName("L");
            item.setRollNumber("22CS001");
            item.setContactMobile("   ");
            item.setContactMail(null);
            BulkRegisterRequest request = new BulkRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setProgramId(PROGRAM_ID);
            request.setClassId(CLASS_ID);
            request.setLearners(List.of(item));

            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("mobile"));
        }

        @Test
        @DisplayName("mobile with only non-digits fails row")
        void mobileOnlyNonDigits_failsRow() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "abc-def-ghi", null);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("mobile"));
        }

        @Test
        @DisplayName("duplicate email in DB fails row")
        void duplicateEmailInDb_failsRow() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "9876500001", "existing@test.edu");
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            Learner existingByEmail = new Learner();
            existingByEmail.setContactMail("existing@test.edu");
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(List.of(existingByEmail));
            when(learnerRepository.getLearnerByCollegeAndRoll(COLLEGE_ID, "22CS001")).thenReturn(null);

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("email"));
            verify(learnerRepository, never()).save(any());
        }

        @Test
        @DisplayName("duplicate mobile in same file fails both rows")
        void duplicateMobileInFile_failsBothRows() {
            BulkLearnerItem item1 = new BulkLearnerItem();
            item1.setFirstName("First");
            item1.setLastName("One");
            item1.setRollNumber("22CS101");
            item1.setContactMobile("9876520002");
            item1.setContactMail(null);
            BulkLearnerItem item2 = new BulkLearnerItem();
            item2.setFirstName("Second");
            item2.setLastName("Two");
            item2.setRollNumber("22CS102");
            item2.setContactMobile("9876520002");
            item2.setContactMail(null);
            BulkRegisterRequest request = new BulkRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setProgramId(PROGRAM_ID);
            request.setClassId(CLASS_ID);
            request.setLearners(List.of(item1, item2));

            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(eq(COLLEGE_ID), any())).thenReturn(null);

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(2, response.getFailed().size());
            assertTrue(response.getFailed().stream().allMatch(f -> f.getReason().contains("Duplicate mobile in file")));
            assertEquals(1, response.getFailed().get(0).getRow());
            assertEquals(2, response.getFailed().get(1).getRow());
            verify(learnerRepository, never()).save(any());
        }

        @Test
        @DisplayName("duplicate email in same file fails both rows")
        void duplicateEmailInFile_failsBothRows() {
            BulkLearnerItem item1 = new BulkLearnerItem();
            item1.setFirstName("First");
            item1.setLastName("One");
            item1.setRollNumber("22CS201");
            item1.setContactMobile("9876530001");
            item1.setContactMail("same@test.edu");
            BulkLearnerItem item2 = new BulkLearnerItem();
            item2.setFirstName("Second");
            item2.setLastName("Two");
            item2.setRollNumber("22CS202");
            item2.setContactMobile("9876530002");
            item2.setContactMail("same@test.edu");
            BulkRegisterRequest request = new BulkRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setProgramId(PROGRAM_ID);
            request.setClassId(CLASS_ID);
            request.setLearners(List.of(item1, item2));

            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(eq(COLLEGE_ID), any())).thenReturn(null);

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(2, response.getFailed().size());
            assertTrue(response.getFailed().stream().allMatch(f -> f.getReason().contains("Duplicate email in file")));
            verify(learnerRepository, never()).save(any());
        }

        @Test
        @DisplayName("duplicate mobile in same file fails both rows (no partial success)")
        void partialSuccess_oneValidOneDuplicateInFile() {
            BulkLearnerItem item1 = new BulkLearnerItem();
            item1.setFirstName("Valid");
            item1.setLastName("One");
            item1.setRollNumber("22CS301");
            item1.setContactMobile("9876540001");
            item1.setContactMail(null);
            BulkLearnerItem item2 = new BulkLearnerItem();
            item2.setFirstName("Dup");
            item2.setLastName("Two");
            item2.setRollNumber("22CS302");
            item2.setContactMobile("9876540001");
            item2.setContactMail(null);
            BulkRegisterRequest request = new BulkRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setProgramId(PROGRAM_ID);
            request.setClassId(CLASS_ID);
            request.setLearners(List.of(item1, item2));

            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(2, response.getFailed().size());
            assertTrue(response.getFailed().stream().allMatch(f -> f.getReason().contains("Duplicate mobile in file")));
            assertEquals(1, response.getFailed().get(0).getRow());
            assertEquals(2, response.getFailed().get(1).getRow());
            verify(learnerRepository, never()).save(any(Learner.class));
        }

        @Test
        @DisplayName("partial success: first row save throws second row still created")
        void partialSuccess_saveThrowsOnFirstRow_secondStillProcessed() {
            BulkLearnerItem item1 = new BulkLearnerItem();
            item1.setFirstName("Fail");
            item1.setLastName("One");
            item1.setRollNumber("22CS401");
            item1.setContactMobile("9876550001");
            item1.setContactMail(null);
            BulkLearnerItem item2 = new BulkLearnerItem();
            item2.setFirstName("Ok");
            item2.setLastName("Two");
            item2.setRollNumber("22CS402");
            item2.setContactMobile("9876550002");
            item2.setContactMail(null);
            BulkRegisterRequest request = new BulkRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setProgramId(PROGRAM_ID);
            request.setClassId(CLASS_ID);
            request.setLearners(List.of(item1, item2));

            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(eq(COLLEGE_ID), any())).thenReturn(null);
            when(learnerRepository.save(any(Learner.class)))
                    .thenThrow(new RuntimeException("DB constraint violation"))
                    .thenAnswer(inv -> {
                        Learner l = inv.getArgument(0);
                        Learner saved = new Learner();
                        saved.setId(602);
                        return saved;
                    });
            when(scopeResolutionService.enrichLearnerHierarchy(any(Learner.class))).thenAnswer(inv -> inv.getArgument(0));

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertEquals(1, response.getCreatedIds().size());
            assertEquals(602, response.getCreatedIds().get(0));
            assertEquals(1, response.getFailed().size());
            assertEquals(1, response.getFailed().get(0).getRow());
            assertTrue(response.getFailed().get(0).getReason().contains("DB constraint"));
            verify(learnerRepository, times(2)).save(any(Learner.class));
        }

        @Test
        @DisplayName("valid row with null optional email creates")
        void validRowWithNullEmail_creates() {
            BulkRegisterRequest request = requestWithOneLearner("No", "Email", "22CS501", "9876560001", null);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(COLLEGE_ID, "22CS501")).thenReturn(null);
            Learner saved = new Learner();
            saved.setId(603);
            when(learnerRepository.save(any(Learner.class))).thenReturn(saved);
            when(scopeResolutionService.enrichLearnerHierarchy(any(Learner.class))).thenAnswer(inv -> inv.getArgument(0));

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertTrue(response.getFailed().isEmpty());
            verify(learnerRepository).save(any(Learner.class));
        }

        @Test
        @DisplayName("two rows same roll in file second fails after first created")
        void twoRowsSameRollInFile_secondFailsRollExists() {
            BulkLearnerItem item1 = new BulkLearnerItem();
            item1.setFirstName("A");
            item1.setLastName("One");
            item1.setRollNumber("22CS601");
            item1.setContactMobile("9876570001");
            item1.setContactMail(null);
            BulkLearnerItem item2 = new BulkLearnerItem();
            item2.setFirstName("B");
            item2.setLastName("Two");
            item2.setRollNumber("22CS601");
            item2.setContactMobile("9876570002");
            item2.setContactMail(null);
            BulkRegisterRequest request = new BulkRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setProgramId(PROGRAM_ID);
            request.setClassId(CLASS_ID);
            request.setLearners(List.of(item1, item2));

            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(COLLEGE_ID, "22CS601"))
                    .thenReturn(null)
                    .thenReturn(new Learner());
            Learner saved = new Learner();
            saved.setId(604);
            when(learnerRepository.save(any(Learner.class))).thenReturn(saved);
            when(scopeResolutionService.enrichLearnerHierarchy(any(Learner.class))).thenAnswer(inv -> inv.getArgument(0));

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertEquals(2, response.getFailed().get(0).getRow());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("roll"));
        }

        @Test
        @DisplayName("failed item has 1-based row number and reason and mobile")
        void failedItem_hasRowReasonMobile() {
            BulkRegisterRequest request = requestWithOneLearner("F", "L", "22CS001", "9876500001", null);
            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            Learner existing = new Learner();
            existing.setContactMobile("9876500001");
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(List.of(existing));
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(COLLEGE_ID, "22CS001")).thenReturn(null);

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(1, response.getFailed().size());
            assertEquals(1, response.getFailed().get(0).getRow());
            assertNotNull(response.getFailed().get(0).getReason());
            assertEquals("9876500001", response.getFailed().get(0).getMobile());
            assertEquals("22CS001", response.getFailed().get(0).getRollNumber());
        }

        @Test
        @DisplayName("createdIds order matches successful rows order")
        void createdIds_orderMatchesSuccessfulRows() {
            BulkLearnerItem item1 = new BulkLearnerItem();
            item1.setFirstName("A");
            item1.setLastName("One");
            item1.setRollNumber("22CS701");
            item1.setContactMobile("9876580001");
            item1.setContactMail(null);
            BulkLearnerItem item2 = new BulkLearnerItem();
            item2.setFirstName("B");
            item2.setLastName("Two");
            item2.setRollNumber("22CS702");
            item2.setContactMobile("9876580002");
            item2.setContactMail(null);
            BulkRegisterRequest request = new BulkRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setProgramId(PROGRAM_ID);
            request.setClassId(CLASS_ID);
            request.setLearners(List.of(item1, item2));

            when(classRepository.findByIdAndNotDeleted(CLASS_ID)).thenReturn(Optional.of(validClass));
            when(newProgramRepository.findByIdAndNotDeleted(PROGRAM_ID)).thenReturn(Optional.of(validProgram));
            when(departmentRepository.findByIdAndNotDeleted(20)).thenReturn(Optional.of(validDept));
            when(learnerRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(learnerRepository.getLearnerByCollegeAndRoll(eq(COLLEGE_ID), any())).thenReturn(null);
            when(learnerRepository.save(any(Learner.class)))
                    .thenAnswer(inv -> { Learner s = new Learner(); s.setId(701); return s; })
                    .thenAnswer(inv -> { Learner s = new Learner(); s.setId(702); return s; });
            when(scopeResolutionService.enrichLearnerHierarchy(any(Learner.class))).thenAnswer(inv -> inv.getArgument(0));

            BulkRegisterResponse response = learnerService.bulkRegister(request);

            assertEquals(2, response.getCreated());
            assertEquals(List.of(701, 702), response.getCreatedIds());
        }

        @Test
        @DisplayName("unsafe import undo is blocked without deleting learners")
        void undoBulkImport_rejectsUnsafeBatchDeletion() {
            IllegalStateException error = assertThrows(IllegalStateException.class,
                    () -> learnerService.undoBulkImport("batch-801", COLLEGE_ID));
            assertTrue(error.getMessage().contains("disabled"));
            verifyNoInteractions(learnerRepository);
        }

        private BulkRegisterRequest requestWithOneLearner(String first, String last, String roll, String mobile, String email) {
            BulkLearnerItem item = new BulkLearnerItem();
            item.setFirstName(first);
            item.setLastName(last);
            item.setRollNumber(roll);
            item.setContactMobile(mobile);
            item.setContactMail(email);
            BulkRegisterRequest request = new BulkRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setProgramId(PROGRAM_ID);
            request.setClassId(CLASS_ID);
            request.setLearners(List.of(item));
            return request;
        }
    }
}
