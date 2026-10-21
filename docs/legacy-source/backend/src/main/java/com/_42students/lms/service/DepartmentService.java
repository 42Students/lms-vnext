package com._42students.lms.service;

import com._42students.lms.dto.request.DepartmentDTO;
import com._42students.lms.model.Department;

import java.util.List;
import java.util.Optional;

public interface DepartmentService {
    Department createDepartment(DepartmentDTO departmentDTO);

    List<Department> fetchAllDepartments(int collegeId);

    List<Department> fetchAllDepartmentsByOrganizationId(int orgId);

    List<Department> findAll();

    Optional<Department> findById(Integer id);

    Department updateDepartment(Integer id, DepartmentDTO departmentDTO);

    void deleteDepartment(Integer id);

    /** A2: paged variant of the college-scoped list. Additive -- the unpaged method stays. */
    org.springframework.data.domain.Page<com._42students.lms.model.Department> fetchAllDepartmentsPaged(int collegeId, org.springframework.data.domain.Pageable pageable);
}

