package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ClassDTO;
import com._42students.lms.model._Class;
import com._42students.lms.repository._ClassRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassServiceLegacyDatePreservationTest {

    @Mock
    private _ClassRepository classRepository;

    private ClassServiceImpl classService;

    @BeforeEach
    void setUp() {
        classService = new ClassServiceImpl();
        ReflectionTestUtils.setField(classService, "studentClassRepository", classRepository);
    }

    @Test
    void updateWithoutLifecycleDatesPreservesLegacyValues() {
        _Class existing = new _Class();
        existing.setId(41);
        existing.setName("CSE-A");
        existing.setProgramId(7);
        existing.setBatchId(9);
        existing.setLowerLimit(0);
        existing.setUpperLimit(60);
        existing.setStartDate(Date.valueOf("2026-07-01"));
        existing.setEndDate(Date.valueOf("2026-12-20"));

        ClassDTO dto = new ClassDTO();
        dto.setName("CSE-A");
        dto.setProgramId(7);
        dto.setBatchId(9);
        dto.setLowerLimit(0);
        dto.setUpperLimit(60);

        when(classRepository.findById(41)).thenReturn(Optional.of(existing));
        when(classRepository.findByBatchIdAndNameIgnoreCase(9, "CSE-A")).thenReturn(List.of(existing));
        when(classRepository.save(any(_Class.class))).thenAnswer(invocation -> invocation.getArgument(0));

        _Class updated = classService.updateClass(41, dto);

        assertEquals(Date.valueOf("2026-07-01"), updated.getStartDate());
        assertEquals(Date.valueOf("2026-12-20"), updated.getEndDate());
    }
}
