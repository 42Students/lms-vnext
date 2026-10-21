package com._42students.lms.service.impl;

import com._42students.lms.dto.request.BulkFacultyItem;
import com._42students.lms.dto.request.BulkFacultyRegisterRequest;
import com._42students.lms.dto.request.BulkValidateRequest;
import com._42students.lms.dto.response.BulkFacultyRegisterResponse;
import com._42students.lms.dto.response.BulkValidateResponse;
import com._42students.lms.model.Department;
import com._42students.lms.model.Faculty;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
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
import static org.mockito.Mockito.*;

/**
 * Unit tests for FacultyServiceImpl bulk-validate and bulk-register (edge cases from checklist).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FacultyBulkServiceTest {

    @Mock
    private FacultyRepository facultyRepository;
    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private FacultyServiceImpl facultyService;

    /**
     * bulkRegister persists each row through a self-injected proxy so every row gets its own
     * REQUIRES_NEW transaction (otherwise one bad row silently discards the whole batch after
     * the caller has been told those rows succeeded). @InjectMocks leaves that field null, so
     * point it back at the instance under test — the behaviour is identical here; only the
     * transaction boundary, which these unit tests do not exercise, differs.
     */
    @org.junit.jupiter.api.BeforeEach
    void wireSelfProxy() {
        org.springframework.test.util.ReflectionTestUtils.setField(facultyService, "self", facultyService);
    }

    private static final int COLLEGE_ID = 1;
    private static final int DEPT_ID = 5;

    @Nested
    @DisplayName("bulkValidate")
    class BulkValidateTests {

        @Test
        @DisplayName("null request returns empty response (E56)")
        void nullRequest_returnsEmptyResponse() {
            BulkValidateResponse response = facultyService.bulkValidate(null);
            assertNotNull(response);
            assertTrue(response.getExistingMobiles().isEmpty());
            assertTrue(response.getExistingEmails().isEmpty());
            verifyNoInteractions(facultyRepository);
        }

        @Test
        @DisplayName("empty mobiles and emails returns empty lists")
        void emptyMobilesAndEmails_returnsEmptyLists() {
            BulkValidateRequest request = new BulkValidateRequest();
            request.setMobiles(Collections.emptyList());
            request.setEmails(Collections.emptyList());

            BulkValidateResponse response = facultyService.bulkValidate(request);

            assertNotNull(response);
            assertTrue(response.getExistingMobiles().isEmpty());
            assertTrue(response.getExistingEmails().isEmpty());
            verifyNoInteractions(facultyRepository);
        }

        @Test
        @DisplayName("normalizes mobiles and returns existing from DB")
        void normalizesMobiles_returnsExistingFromDb() {
            BulkValidateRequest request = new BulkValidateRequest();
            request.setMobiles(List.of(" 9876-510-001 "));
            request.setEmails(null);

            Faculty existing = new Faculty();
            existing.setContactMobile("9876510001");
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(List.of(existing));

            BulkValidateResponse response = facultyService.bulkValidate(request);

            assertFalse(response.getExistingMobiles().isEmpty());
            assertTrue(response.getExistingMobiles().contains("9876510001"));
        }

        @Test
        @DisplayName("lowercase emails and returns existing from DB")
        void lowercaseEmails_returnsExistingFromDb() {
            BulkValidateRequest request = new BulkValidateRequest();
            request.setMobiles(null);
            request.setEmails(List.of("  Faculty@Test.EDU  "));

            Faculty existing = new Faculty();
            existing.setContactMail("faculty@test.edu");
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(List.of(existing));

            BulkValidateResponse response = facultyService.bulkValidate(request);

            assertFalse(response.getExistingEmails().isEmpty());
            assertTrue(response.getExistingEmails().contains("faculty@test.edu"));
        }

        @Test
        @DisplayName("null mobiles and emails lists do not NPE")
        void nullLists_doNotNpe() {
            BulkValidateRequest request = new BulkValidateRequest();
            request.setMobiles(null);
            request.setEmails(null);

            BulkValidateResponse response = facultyService.bulkValidate(request);

            assertNotNull(response);
            assertTrue(response.getExistingMobiles().isEmpty());
            assertTrue(response.getExistingEmails().isEmpty());
            verifyNoInteractions(facultyRepository);
        }

        @Test
        @DisplayName("filters empty and null in mobiles before batch call")
        void filtersEmptyAndNullInMobiles() {
            BulkValidateRequest request = new BulkValidateRequest();
            List<String> mobiles = new ArrayList<>();
            mobiles.add("");
            mobiles.add(null);
            mobiles.add("   ");
            mobiles.add("9876510001");
            request.setMobiles(mobiles);
            request.setEmails(null);

            when(facultyRepository.findByContactMobileInAndNotDeleted(List.of("9876510001"))).thenReturn(Collections.emptyList());

            BulkValidateResponse response = facultyService.bulkValidate(request);

            assertTrue(response.getExistingMobiles().isEmpty());
            verify(facultyRepository).findByContactMobileInAndNotDeleted(List.of("9876510001"));
        }
    }

    @Nested
    @DisplayName("bulkRegister")
    class BulkRegisterTests {

        @Test
        @DisplayName("null college_id throws")
        void nullCollegeId_throws() {
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(null);
            request.setFaculty(List.of(validItem()));

            assertThrows(RuntimeException.class, () -> facultyService.bulkRegister(request));
            verify(facultyRepository, never()).save(any());
        }

        @Test
        @DisplayName("department not found fails row")
        void departmentNotFound_failsRow() {
            BulkFacultyRegisterRequest request = requestWithOneFaculty("Rajesh", "Kulkarni", "9876510001", DEPT_ID, "r@test.edu");
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.empty());

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("department"));
            verify(facultyRepository, never()).save(any());
        }

        @Test
        @DisplayName("department not in college fails row")
        void departmentNotInCollege_failsRow() {
            BulkFacultyRegisterRequest request = requestWithOneFaculty("Rajesh", "Kulkarni", "9876510001", DEPT_ID, "r@test.edu");
            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(999);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("college"));
            verify(facultyRepository, never()).save(any());
        }

        @Test
        @DisplayName("duplicate mobile in DB fails row")
        void duplicateMobileInDb_failsRow() {
            BulkFacultyRegisterRequest request = requestWithOneFaculty("Rajesh", "Kulkarni", "9876510001", DEPT_ID, null);
            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            Faculty existing = new Faculty();
            existing.setContactMobile("9876510001");
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(List.of(existing));
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("mobile"));
            verify(facultyRepository, never()).save(any());
        }

        @Test
        @DisplayName("valid row creates faculty and returns created id")
        void validRow_createsAndReturnsId() {
            BulkFacultyRegisterRequest request = requestWithOneFaculty("Rajesh", "Kulkarni", "9876510001", DEPT_ID, "r@test.edu");
            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            Faculty saved = new Faculty();
            saved.setId(201);
            when(facultyRepository.save(any(Faculty.class))).thenReturn(saved);

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertEquals(1, response.getCreatedIds().size());
            assertEquals(201, response.getCreatedIds().get(0));
            assertTrue(response.getFailed().isEmpty());
            verify(facultyRepository).save(any(Faculty.class));
        }

        @Test
        @DisplayName("empty mobile fails row")
        void emptyMobile_failsRow() {
            BulkFacultyItem item = validItem();
            item.setContactMobile("   ");
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setFaculty(List.of(item));

            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("mobile"));
        }

        @Test
        @DisplayName("null deptId fails row")
        void nullDeptId_failsRow() {
            BulkFacultyItem item = validItem();
            item.setDeptId(null);
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setFaculty(List.of(item));

            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("department"));
            verify(facultyRepository, never()).save(any());
        }

        @Test
        @DisplayName("duplicate email in DB fails row")
        void duplicateEmailInDb_failsRow() {
            BulkFacultyRegisterRequest request = requestWithOneFaculty("R", "K", "9876510001", DEPT_ID, "existing@test.edu");
            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            Faculty existingByEmail = new Faculty();
            existingByEmail.setContactMail("existing@test.edu");
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(List.of(existingByEmail));

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("email"));
            verify(facultyRepository, never()).save(any());
        }

        @Test
        @DisplayName("duplicate mobile in same file fails both rows")
        void duplicateMobileInFile_failsBothRows() {
            BulkFacultyItem item1 = new BulkFacultyItem();
            item1.setFirstName("First");
            item1.setLastName("One");
            item1.setContactMobile("9876511001");
            item1.setDeptId(DEPT_ID);
            item1.setContactMail(null);
            BulkFacultyItem item2 = new BulkFacultyItem();
            item2.setFirstName("Second");
            item2.setLastName("Two");
            item2.setContactMobile("9876511001");
            item2.setDeptId(DEPT_ID);
            item2.setContactMail(null);
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setFaculty(List.of(item1, item2));

            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(2, response.getFailed().size());
            assertTrue(response.getFailed().stream().allMatch(f -> f.getReason().contains("Duplicate mobile in file")));
            assertEquals(1, response.getFailed().get(0).getRow());
            assertEquals(2, response.getFailed().get(1).getRow());
            verify(facultyRepository, never()).save(any());
        }

        @Test
        @DisplayName("duplicate email in same file fails both rows")
        void duplicateEmailInFile_failsBothRows() {
            BulkFacultyItem item1 = new BulkFacultyItem();
            item1.setFirstName("First");
            item1.setLastName("One");
            item1.setContactMobile("9876512001");
            item1.setDeptId(DEPT_ID);
            item1.setContactMail("same@test.edu");
            BulkFacultyItem item2 = new BulkFacultyItem();
            item2.setFirstName("Second");
            item2.setLastName("Two");
            item2.setContactMobile("9876512002");
            item2.setDeptId(DEPT_ID);
            item2.setContactMail("same@test.edu");
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setFaculty(List.of(item1, item2));

            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(2, response.getFailed().size());
            assertTrue(response.getFailed().stream().allMatch(f -> f.getReason().contains("Duplicate email in file")));
            verify(facultyRepository, never()).save(any());
        }

        @Test
        @DisplayName("partial success: one valid one duplicate mobile in DB")
        void partialSuccess_oneValidOneDuplicateInDb() {
            int dept2 = 6;
            BulkFacultyItem item1 = new BulkFacultyItem();
            item1.setFirstName("Valid");
            item1.setLastName("One");
            item1.setContactMobile("9876513001");
            item1.setDeptId(DEPT_ID);
            item1.setContactMail(null);
            BulkFacultyItem item2 = new BulkFacultyItem();
            item2.setFirstName("Dup");
            item2.setLastName("Two");
            item2.setContactMobile("9876513002");
            item2.setDeptId(dept2);
            item2.setContactMail(null);
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setFaculty(List.of(item1, item2));

            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            Department dept2Obj = new Department();
            dept2Obj.setId(dept2);
            dept2Obj.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(departmentRepository.findByIdAndNotDeleted(dept2)).thenReturn(Optional.of(dept2Obj));
            Faculty existing = new Faculty();
            existing.setContactMobile("9876513002");
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(List.of(existing));
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            Faculty saved = new Faculty();
            saved.setId(301);
            when(facultyRepository.save(any(Faculty.class))).thenReturn(saved);

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertEquals(1, response.getCreatedIds().size());
            assertEquals(301, response.getCreatedIds().get(0));
            assertEquals(1, response.getFailed().size());
            assertEquals(2, response.getFailed().get(0).getRow());
            verify(facultyRepository, times(1)).save(any(Faculty.class));
        }

        @Test
        @DisplayName("partial success: first row save throws second row still created")
        void partialSuccess_saveThrowsOnFirst_secondStillCreated() {
            BulkFacultyItem item1 = new BulkFacultyItem();
            item1.setFirstName("Fail");
            item1.setLastName("One");
            item1.setContactMobile("9876514001");
            item1.setDeptId(DEPT_ID);
            item1.setContactMail(null);
            BulkFacultyItem item2 = new BulkFacultyItem();
            item2.setFirstName("Ok");
            item2.setLastName("Two");
            item2.setContactMobile("9876514002");
            item2.setDeptId(DEPT_ID);
            item2.setContactMail(null);
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setFaculty(List.of(item1, item2));

            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.save(any(Faculty.class)))
                    .thenThrow(new RuntimeException("Constraint violation"))
                    .thenAnswer(inv -> { Faculty f = new Faculty(); f.setId(302); return f; });

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertEquals(1, response.getCreatedIds().size());
            assertEquals(302, response.getCreatedIds().get(0));
            assertEquals(1, response.getFailed().size());
            assertEquals(1, response.getFailed().get(0).getRow());
            verify(facultyRepository, times(2)).save(any(Faculty.class));
        }

        @Test
        @DisplayName("valid row with null optional email creates")
        void validRowWithNullEmail_creates() {
            BulkFacultyRegisterRequest request = requestWithOneFaculty("No", "Email", "9876515001", DEPT_ID, null);
            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            Faculty saved = new Faculty();
            saved.setId(303);
            when(facultyRepository.save(any(Faculty.class))).thenReturn(saved);

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertTrue(response.getFailed().isEmpty());
            verify(facultyRepository).save(any(Faculty.class));
        }

        @Test
        @DisplayName("two rows different depts one invalid one valid")
        void twoRows_oneInvalidDept_oneValid() {
            int badDept = 999;
            BulkFacultyItem item1 = new BulkFacultyItem();
            item1.setFirstName("Bad");
            item1.setLastName("Dept");
            item1.setContactMobile("9876516001");
            item1.setDeptId(badDept);
            item1.setContactMail(null);
            BulkFacultyItem item2 = new BulkFacultyItem();
            item2.setFirstName("Good");
            item2.setLastName("Dept");
            item2.setContactMobile("9876516002");
            item2.setDeptId(DEPT_ID);
            item2.setContactMail(null);
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setFaculty(List.of(item1, item2));

            when(departmentRepository.findByIdAndNotDeleted(badDept)).thenReturn(Optional.empty());
            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            Faculty saved = new Faculty();
            saved.setId(304);
            when(facultyRepository.save(any(Faculty.class))).thenReturn(saved);

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(1, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertEquals(1, response.getFailed().get(0).getRow());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("department"));
        }

        @Test
        @DisplayName("failed item has row reason mobile email deptId")
        void failedItem_hasRowReasonMobileEmailDeptId() {
            BulkFacultyRegisterRequest request = requestWithOneFaculty("F", "L", "9876510001", DEPT_ID, "f@test.edu");
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.empty());

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(1, response.getFailed().size());
            assertEquals(1, response.getFailed().get(0).getRow());
            assertNotNull(response.getFailed().get(0).getReason());
            assertEquals("9876510001", response.getFailed().get(0).getMobile());
            assertEquals("f@test.edu", response.getFailed().get(0).getEmail());
            assertEquals(DEPT_ID, response.getFailed().get(0).getDeptId());
        }

        @Test
        @DisplayName("mobile with only non-digits fails row")
        void mobileOnlyNonDigits_failsRow() {
            BulkFacultyRegisterRequest request = requestWithOneFaculty("F", "L", "no-digits", DEPT_ID, null);
            Department dept = new Department();
            dept.setId(DEPT_ID);
            dept.setCollegeId(COLLEGE_ID);
            when(departmentRepository.findByIdAndNotDeleted(DEPT_ID)).thenReturn(Optional.of(dept));
            when(facultyRepository.findByContactMobileInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());
            when(facultyRepository.findByContactMailLowerInAndNotDeleted(anyList())).thenReturn(Collections.emptyList());

            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);

            assertEquals(0, response.getCreated());
            assertEquals(1, response.getFailed().size());
            assertTrue(response.getFailed().get(0).getReason().toLowerCase().contains("mobile"));
        }

        private BulkFacultyItem validItem() {
            BulkFacultyItem item = new BulkFacultyItem();
            item.setFirstName("Rajesh");
            item.setLastName("Kulkarni");
            item.setContactMobile("9876510001");
            item.setDeptId(DEPT_ID);
            item.setContactMail("r@test.edu");
            return item;
        }

        private BulkFacultyRegisterRequest requestWithOneFaculty(String first, String last, String mobile, int deptId, String email) {
            BulkFacultyItem item = new BulkFacultyItem();
            item.setFirstName(first);
            item.setLastName(last);
            item.setContactMobile(mobile);
            item.setDeptId(deptId);
            item.setContactMail(email);
            BulkFacultyRegisterRequest request = new BulkFacultyRegisterRequest();
            request.setCollegeId(COLLEGE_ID);
            request.setFaculty(List.of(item));
            return request;
        }
    }
}
