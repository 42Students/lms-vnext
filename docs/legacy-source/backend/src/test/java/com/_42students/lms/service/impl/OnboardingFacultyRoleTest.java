package com._42students.lms.service.impl;

import com._42students.lms.dto.request.BulkFacultyItem;
import com._42students.lms.dto.request.BulkFacultyRegisterRequest;
import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Faculty;
import com._42students.lms.repository.FacultyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OnboardingFacultyRoleTest {
    @Mock FacultyRepository facultyRepository;
    @InjectMocks FacultyServiceImpl service;

    private BulkFacultyItem item(String role) {
        BulkFacultyItem item = new BulkFacultyItem();
        item.setFirstName("Test");
        item.setLastName("Faculty");
        item.setContactMobile("9876543210");
        item.setDeptId(1);
        item.setFacultyType(role);
        return item;
    }

    @Test void bulkRowCanCreateMentor() {
        when(facultyRepository.save(any(Faculty.class))).thenAnswer(i -> i.getArgument(0));
        Faculty faculty = service.saveBulkFacultyRow(item("mentor"), 42, "9876543210", null);
        assertEquals(FacultyType.MENTOR, faculty.getFacultyType());
        assertEquals(42, faculty.getCollegeId());
    }

    @Test void missingRoleKeepsLecturerDefault() {
        when(facultyRepository.save(any(Faculty.class))).thenAnswer(i -> i.getArgument(0));
        assertEquals(FacultyType.LECTURER,
                service.saveBulkFacultyRow(item(null), 42, "9876543210", null).getFacultyType());
    }

    @Test void csvCannotCreateAdministrator() {
        assertThrows(IllegalArgumentException.class,
                () -> service.saveBulkFacultyRow(item("ADMIN"), 42, "9876543210", null));
        verifyNoInteractions(facultyRepository);
    }
}
