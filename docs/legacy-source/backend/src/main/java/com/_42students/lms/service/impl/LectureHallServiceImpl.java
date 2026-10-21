package com._42students.lms.service.impl;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.LectureHallDTO;
import com._42students.lms.model.LectureHall;
import com._42students.lms.repository.ClassScheduleRepository;
import com._42students.lms.repository.LectureHallRepository;
import com._42students.lms.service.LectureHallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class LectureHallServiceImpl implements LectureHallService {

    // BE-0070/BE-0076/BE-0095: same-name creates take turns on the parent row, so the name check sees the other one.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate uniquenessJdbc;

    private void lockRow(String table, Object id) {
        if (uniquenessJdbc == null || id == null) return;
        uniquenessJdbc.queryForList("SELECT id FROM " + table + " WHERE id = :id FOR UPDATE",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("id", id));
    }
    @Autowired
    LectureHallRepository lectureHallRepository;

    @Autowired(required = false)
    ClassScheduleRepository classScheduleRepository;

    @Autowired
    ScopeResolutionService scopeResolutionService;

    private void setLectureHallFields(LectureHall lectureHall, LectureHallDTO dto) {
        if (dto.getName() != null) {
            String name = dto.getName().trim();
            if (name.isBlank()) throw new IllegalArgumentException("Room name is required");
            lectureHall.setName(name);
        }
        if (dto.getDescription() != null) lectureHall.setDescription(dto.getDescription().trim());
        if (dto.getCapacity() != null) {
            if (dto.getCapacity() < 1) throw new IllegalArgumentException("Capacity must be at least 1");
            if (dto.getCapacity() > 5000) throw new IllegalArgumentException("Capacity too large (max 5000)");
            lectureHall.setCapacity(dto.getCapacity());
        }
        if (dto.getCollegeId() != null) {
            if (dto.getCollegeId() < 1) throw new IllegalArgumentException("collegeId is required");
            lectureHall.setCollegeId(dto.getCollegeId());
        }
        if (dto.getDeptId() != null) {
            if (dto.getDeptId() < 0) throw new IllegalArgumentException("deptId cannot be negative");
            lectureHall.setDeptId(dto.getDeptId());
        }
        if (dto.getRoomType() != null) lectureHall.setRoomType(dto.getRoomType());
    }

    private void validateDepartmentScope(Integer collegeId, Integer deptId) {
        if (deptId == null || deptId == 0) return;
        if (collegeId == null || collegeId <= 0) {
            throw new IllegalArgumentException("A valid college is required before assigning a department");
        }
        Integer departmentCollegeId = scopeResolutionService.resolveDepartmentToCollegeId(deptId);
        if (departmentCollegeId == null) {
            throw new IllegalArgumentException("Department not found");
        }
        if (!collegeId.equals(departmentCollegeId)) {
            throw new IllegalArgumentException("Department must belong to the same college as the lecture hall");
        }
    }

    /**
     * App-level uniqueness guard (case-insensitive, scoped to college): no DB unique index exists
     * on lecture_hall.name, so this is enforced here, mirroring SemesterServiceImpl.createSemester.
     */
    private void checkNameUnique(int collegeId, String name, Integer excludeId) {
        if (collegeId < 1 || name == null || name.isBlank()) return;
        List<LectureHall> matches = lectureHallRepository.findByCollegeIdAndNameIgnoreCase(collegeId, name);
        boolean conflict = matches.stream().anyMatch(lh -> excludeId == null || lh.getId() != excludeId);
        if (conflict) {
            throw new IllegalArgumentException("A lecture hall named \"" + name + "\" already exists in this college");
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public LectureHall createLectureHall(LectureHallDTO lectureHallDTO) {
        LectureHall lectureHall = new LectureHall();
        setLectureHallFields(lectureHall, lectureHallDTO);
        if (lectureHall.getCollegeId() <= 0) {
            throw new IllegalArgumentException("collegeId is required");
        }
        validateDepartmentScope(lectureHall.getCollegeId(), lectureHall.getDeptId());
        lockRow("college", lectureHall.getCollegeId());
        checkNameUnique(lectureHall.getCollegeId(), lectureHall.getName(), null);
        return lectureHallRepository.save(lectureHall);
    }

    @Override
    public List<LectureHall> findAll() {
        return lectureHallRepository.findAll();
    }

    @Override
    public Optional<LectureHall> findById(Integer id) {
        return lectureHallRepository.findById(id);
    }

    @Override
    public List<LectureHall> findByCollegeId(int collegeId) {
        return lectureHallRepository.findByCollegeId(collegeId);
    }

    @Override
    public List<LectureHall> findByOrganizationId(int orgId) {
        return lectureHallRepository.findByOrganizationId(orgId);
    }

    @Override
    public List<LectureHall> findByDeptId(int deptId) {
        return lectureHallRepository.findByDeptId(deptId);
    }

    @Override
    public LectureHall updateLectureHall(Integer id, LectureHallDTO lectureHallDTO) {
        return lectureHallRepository.findById(id).map(lectureHall -> {
            Integer originalCollegeId = lectureHall.getCollegeId();
            if (lectureHallDTO.getCollegeId() != null
                    && !Objects.equals(originalCollegeId, lectureHallDTO.getCollegeId())) {
                throw new IllegalArgumentException("Changing a lecture hall's college is not supported");
            }
            setLectureHallFields(lectureHall, lectureHallDTO);
            validateDepartmentScope(originalCollegeId, lectureHall.getDeptId());
            checkNameUnique(lectureHall.getCollegeId(), lectureHall.getName(), id);
            return lectureHallRepository.save(lectureHall);
        }).orElseThrow(() -> new RuntimeException("Lecture hall not found with id " + id));
    }

    @Override
    public void deleteLectureHall(Integer id) {
        if (!lectureHallRepository.existsById(id)) {
            throw new RuntimeException("Lecture hall not found with id " + id);
        }
        if (classScheduleRepository != null && classScheduleRepository.countByLectureHallId(id) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete lecture hall: it has scheduled classes. Remove or reassign those schedules first.");
        }
        lectureHallRepository.deleteById(id);
    }

    @Override
    public org.springframework.data.domain.Page<com._42students.lms.model.LectureHall> findByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable) {
        return lectureHallRepository.findByCollegeIdPaged(collegeId, pageable);
    }
}
