package com._42students.lms.service.impl;

import com._42students.lms.dto.request.DepartmentDTO;
import com._42students.lms.model.Department;
import com._42students.lms.model.Faculty;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentServiceImpl implements DepartmentService {

    @Autowired
    DepartmentRepository departmentRepository;

    @Autowired
    NewProgramRepository newProgramRepository;

    @Autowired
    FacultyRepository facultyRepository;

    @Autowired
    CourseRepository courseRepository;

    @Override
    public Department createDepartment(DepartmentDTO departmentDTO) {
        requireUniqueName(null, departmentDTO.getCollegeId(), departmentDTO.getName());
        Department department = new Department();
        setDepartmentFields(department, departmentDTO);
        return departmentRepository.save(department);
    }

    @Override
    public List<Department> fetchAllDepartments(int collegeId) {
        return departmentRepository.fetchAllDepartments(collegeId);
    }

    @Override
    public List<Department> fetchAllDepartmentsByOrganizationId(int orgId) {
        return departmentRepository.fetchAllDepartmentsByOrganizationId(orgId);
    }

    @Override
    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    @Override
    public Optional<Department> findById(Integer id) {
        return departmentRepository.findById(id);
    }

    @Override
    public Department updateDepartment(Integer id, DepartmentDTO departmentDTO) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        requireUniqueName(id, departmentDTO.getCollegeId(), departmentDTO.getName());
        setDepartmentFields(department, departmentDTO);
        return departmentRepository.save(department);
    }

    @Override
    public void deleteDepartment(Integer id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        if (!newProgramRepository.findByDeptId(id).isEmpty()) {
            throw new IllegalStateException("Cannot delete department: it has programs linked to it. Delete/move the programs first.");
        }
        if (!facultyRepository.getFacultyByDeptId(id).isEmpty()) {
            throw new IllegalStateException("Cannot delete department: it has faculty assigned to it. Reassign the faculty first.");
        }
        if (!courseRepository.fetchCourses(id).isEmpty()) {
            throw new IllegalStateException("Cannot delete department: it has courses linked to it. Delete/move the courses first.");
        }
        department.setIsDeleted(true);
        departmentRepository.save(department);
    }

    private void requireUniqueName(Integer excludeId, Integer collegeId, String name) {
        if (collegeId == null || name == null || name.trim().isEmpty()) {
            return;
        }
        List<Department> existing = departmentRepository.findByExactName(collegeId, name.trim());
        boolean conflict = existing.stream().anyMatch(d -> excludeId == null || d.getId() != excludeId);
        if (conflict) {
            throw new IllegalArgumentException("Department name already exists");
        }
    }

    private void setDepartmentFields(Department department, DepartmentDTO departmentDTO) {
        validateLeadershipFaculty(departmentDTO.getDeptChairId(), departmentDTO.getCollegeId(), "Department chair");
        validateLeadershipFaculty(departmentDTO.getDeptViceChairId(), departmentDTO.getCollegeId(), "Department vice chair");
        department.setName(departmentDTO.getName());
        department.setCollegeId(departmentDTO.getCollegeId());
        department.setDeptChairId(departmentDTO.getDeptChairId());
        department.setDeptViceChairId(departmentDTO.getDeptViceChairId());
    }

    private void validateLeadershipFaculty(Integer facultyId, Integer collegeId, String roleLabel) {
        if (facultyId == null) {
            return;
        }
        Faculty faculty = facultyRepository.findByIdAndNotDeleted(facultyId)
                .orElseThrow(() -> new IllegalArgumentException(roleLabel + " faculty was not found"));
        if (collegeId == null || faculty.getCollegeId() == null || !collegeId.equals(faculty.getCollegeId())) {
            throw new IllegalArgumentException(roleLabel + " must belong to the same college as the department");
        }
    }

    @Override
    public org.springframework.data.domain.Page<com._42students.lms.model.Department> fetchAllDepartmentsPaged(int collegeId, org.springframework.data.domain.Pageable pageable) {
        return departmentRepository.fetchAllDepartmentsPaged(collegeId, pageable);
    }
}

