package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ClassDTO;
import com._42students.lms.model._Class;
import com._42students.lms.repository._ClassRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** A rejected class edit must never dirty a managed JPA row inside the controller transaction. */
class ClassServiceImplInvariantTest {
    private _ClassRepository repository;
    private ClassServiceImpl service;
    private _Class stored;

    @BeforeEach
    void setUp() {
        repository = mock(_ClassRepository.class);
        service = new ClassServiceImpl();
        service.studentClassRepository = repository;
        stored = new _Class();
        stored.setId(9);
        stored.setName("Section A");
        stored.setDescription("Original");
        stored.setProgramId(4);
        stored.setBatchId(3);
        stored.setLowerLimit(1);
        stored.setUpperLimit(30);
        when(repository.findById(9)).thenReturn(Optional.of(stored));
    }

    private ClassDTO proposal() {
        ClassDTO dto = new ClassDTO();
        dto.setName("Section B");
        dto.setDescription("Changed");
        dto.setProgramId(8);
        dto.setBatchId(3);
        dto.setLowerLimit(2);
        dto.setUpperLimit(40);
        return dto;
    }

    private void assertOriginalUnchanged() {
        assertEquals("Section A", stored.getName());
        assertEquals("Original", stored.getDescription());
        assertEquals(4, stored.getProgramId());
        assertEquals(3, stored.getBatchId());
        assertEquals(1, stored.getLowerLimit());
        assertEquals(30, stored.getUpperLimit());
        verify(repository, never()).save(any(_Class.class));
    }

    @Test
    void rejectedDuplicateDoesNotDirtyManagedClass() {
        _Class duplicate = new _Class();
        duplicate.setId(10);
        when(repository.findByBatchIdAndNameIgnoreCase(3, "Section B")).thenReturn(List.of(duplicate));
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.updateClass(9, proposal()));
        assertTrue(error.getMessage().contains("already exists"));
        assertOriginalUnchanged();
    }

    @Test
    void invalidCapacityDoesNotDirtyManagedClass() {
        ClassDTO dto = proposal();
        dto.setUpperLimit(0);
        assertThrows(IllegalArgumentException.class, () -> service.updateClass(9, dto));
        assertOriginalUnchanged();
        verify(repository, never()).findByBatchIdAndNameIgnoreCase(anyInt(), anyString());
    }

    @Test
    void reversedDatesDoNotDirtyManagedClass() {
        ClassDTO dto = proposal();
        dto.setStartDate(Date.valueOf("2026-09-20"));
        dto.setEndDate(Date.valueOf("2026-09-19"));
        assertThrows(IllegalArgumentException.class, () -> service.updateClass(9, dto));
        assertOriginalUnchanged();
    }

    @Test
    void validEditUpdatesAndSavesExistingClass() {
        ClassDTO dto = proposal();
        when(repository.findByBatchIdAndNameIgnoreCase(3, "Section B")).thenReturn(List.of());
        when(repository.save(stored)).thenReturn(stored);
        assertSame(stored, service.updateClass(9, dto));
        assertEquals("Section B", stored.getName());
        assertEquals("Changed", stored.getDescription());
        assertEquals(8, stored.getProgramId());
        assertEquals(40, stored.getUpperLimit());
        verify(repository).save(stored);
    }
}
