package com._42students.lms.service.impl;

import com._42students.lms.dto.request.CollegeDTO;
import com._42students.lms.dto.response.CollegeResponseDTO;
import com._42students.lms.model.College;
import com._42students.lms.model.TenantDomain;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.TenantDomainRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.service.CollegeService;
import com._42students.lms.util.RequestHostUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CollegeServiceImpl implements CollegeService {

    @Autowired
    CollegeRepository collegeRepository;

    @Autowired(required = false)
    DepartmentRepository departmentRepository;

    @Autowired(required = false)
    NewProgramRepository newProgramRepository;

    @Autowired(required = false)
    LearnerRepository learnerRepository;

    @Autowired(required = false)
    FacultyRepository facultyRepository;

    @Autowired(required = false)
    TenantDomainRepository tenantDomainRepository;

    @Autowired(required = false)
    JobRepository jobRepository;

    @Autowired(required = false)
    JobApplicationRepository jobApplicationRepository;

    @Override
    public College createCollege(CollegeDTO collegeDTO) {
        requireUniqueUniqueId(collegeDTO.getUniqueId(), null);
        College college = new College();
        setCollegeFields(college, collegeDTO);
        College saved = collegeRepository.save(college);
        upsertExplicitDomainIfProvided(saved, collegeDTO);
        return saved;
    }

    // college.unique_id feeds subdomain/tenant resolution (e.g. college2.42lms.com), so a
    // collision is a real routing conflict, not a cosmetic duplicate — createCollege/updateCollege
    // previously saved whatever was typed with no check at all.
    private void requireUniqueUniqueId(String uniqueId, Integer excludingCollegeId) {
        if (uniqueId == null || uniqueId.trim().isEmpty()) return;
        collegeRepository.findByUniqueIdIgnoreCase(uniqueId.trim()).ifPresent(existing -> {
            if (excludingCollegeId == null || existing.getId() != excludingCollegeId) {
                // IllegalArgumentException specifically: GlobalExceptionHandler only passes this
                // (and IllegalStateException) messages through to the client as 400s — a plain
                // RuntimeException here would be swallowed to a generic "unexpected error" 500.
                throw new IllegalArgumentException("uniqueId '" + uniqueId.trim() + "' is already used by another college");
            }
        });
    }

    @Override
    public List<College> fetchColleges(int orgId) {
        return collegeRepository.fetchColleges(orgId);
    }

    @Override
    public College fetchCollege(int collegeId) {
        return collegeRepository.fetchCollege(collegeId);
    }

    @Override
    public List<CollegeResponseDTO> fetchCollegeList() {
        List<College> colleges = collegeRepository.findAll().stream()
                .filter(c -> c != null && !Boolean.TRUE.equals(c.getIsDeleted()))
                .collect(Collectors.toList());
        List<CollegeResponseDTO> collegeResponseDTOS = new ArrayList<>();
        for (College college:
             colleges) {
            CollegeResponseDTO collegeResponseDTO = new CollegeResponseDTO();
            collegeResponseDTO.setId(college.getId());
            collegeResponseDTO.setLogo(college.getLogo());
            collegeResponseDTO.setName(college.getName());
            collegeResponseDTO.setUniqueId(college.getUniqueId());
            collegeResponseDTO.setOrgId(college.getOrgId());
            collegeResponseDTO.setCity(college.getCity());
            collegeResponseDTO.setState(college.getState());
            collegeResponseDTOS.add(collegeResponseDTO);
        }
        return collegeResponseDTOS;
    }

    @Override
    public List<CollegeResponseDTO> fetchOnlyNames(int orgId) {
        List<College> colleges = collegeRepository.fetchColleges(orgId).stream()
                .filter(c -> c != null && !Boolean.TRUE.equals(c.getIsDeleted()))
                .collect(Collectors.toList());
        List<CollegeResponseDTO> collegeResponseDTOS = new ArrayList<>();
        for (College college:
                colleges) {
            CollegeResponseDTO collegeResponseDTO = new CollegeResponseDTO();
            collegeResponseDTO.setId(college.getId());
            collegeResponseDTO.setLogo(college.getLogo());
            collegeResponseDTO.setName(college.getName());
            collegeResponseDTO.setUniqueId(college.getUniqueId());
            collegeResponseDTO.setOrgId(college.getOrgId());
            collegeResponseDTO.setCity(college.getCity());
            collegeResponseDTO.setState(college.getState());
            collegeResponseDTOS.add(collegeResponseDTO);
        }
        return collegeResponseDTOS;
    }

    @Override
    public Optional<College> findById(Integer id) {
        return collegeRepository.findById(id);
    }

    @Override
    public College updateCollege(Integer id, CollegeDTO collegeDTO) {
        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("College not found with id: " + id));
        requireUniqueUniqueId(collegeDTO.getUniqueId(), id);
        Integer previousOrgId = college.getOrgId();
        setCollegeFields(college, collegeDTO);
        College saved = collegeRepository.save(college);
        upsertExplicitDomainIfProvided(saved, collegeDTO);
        // Job/JobApplication denormalize organizationId from the college at creation/apply time
        // for query performance, and previously had no mechanism to re-derive it — a corrected
        // org_id here would silently leave every existing job/application under this college
        // scoped to the stale org, disappearing from admin views scoped to the corrected org.
        Integer newOrgId = saved.getOrgId();
        if (newOrgId != null && !newOrgId.equals(previousOrgId) && jobRepository != null && jobApplicationRepository != null) {
            jobRepository.reassignOrganizationForCollege(saved.getId(), newOrgId);
            jobApplicationRepository.reassignOrganizationForCollege(saved.getId(), newOrgId);
        }
        return saved;
    }

    private void upsertExplicitDomainIfProvided(College saved, CollegeDTO dto) {
        if (saved == null || saved.getId() <= 0) return;
        if (tenantDomainRepository == null || dto == null) return;
        if (dto.getDomainHost() == null || dto.getDomainHost().trim().isEmpty()) return;

        String normalized = RequestHostUtil.normalizeHostOnly(dto.getDomainHost());
        if (normalized == null || normalized.trim().isEmpty()) {
            throw new RuntimeException("Invalid domainHost");
        }
        normalized = normalized.trim().toLowerCase(java.util.Locale.ROOT);

        tenantDomainRepository.findActiveByHost(normalized).ifPresent(existing -> {
            if (existing.getCollegeId() != null && !existing.getCollegeId().equals(saved.getId())) {
                throw new RuntimeException("domainHost already exists for another college");
            }
        });

        // If host already exists for this college, update flags; else create new.
        TenantDomain domain = tenantDomainRepository.findActiveByHost(normalized).orElse(null);
        if (domain == null) {
            domain = new TenantDomain();
            domain.setCollegeId(saved.getId());
            domain.setHost(normalized);
            domain.setIsDeleted(false);
        }

        boolean primary = dto.getDomainPrimary() == null ? true : Boolean.TRUE.equals(dto.getDomainPrimary());
        domain.setIsPrimary(primary);
        if (primary) {
            tenantDomainRepository.clearPrimaryForCollege(saved.getId(), domain.getId());
        }

        // Verification is handled explicitly via superadmin verification flow for custom domains.
        // Keep isVerified as-is unless this is a brand new row (defaults false).
        tenantDomainRepository.save(domain);
    }

    @Override
    public void deleteCollege(Integer id) {
        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("College not found with id: " + id));

        // Safety: prevent deleting colleges that still have active dependencies.
        try {
            if (departmentRepository != null && departmentRepository.fetchAllDepartments(id).stream().anyMatch(d -> d != null && !Boolean.TRUE.equals(d.getIsDeleted()))) {
                throw new RuntimeException("Cannot delete college: departments exist under this college");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception ignored) {}
        try {
            if (newProgramRepository != null && newProgramRepository.findByCollegeId(id).stream().anyMatch(p -> p != null && !Boolean.TRUE.equals(p.getIsDeleted()))) {
                throw new RuntimeException("Cannot delete college: programs exist under this college");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception ignored) {}
        try {
            if (learnerRepository != null && learnerRepository.findLearnersByCollegeIdIncludingViaClass(id).stream().anyMatch(l -> l != null && !Boolean.TRUE.equals(l.getIsDeleted()))) {
                throw new RuntimeException("Cannot delete college: learners exist under this college");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception ignored) {}
        try {
            if (facultyRepository != null && facultyRepository.fetchContactsByCollegeId(id).stream().anyMatch(f -> f != null && !Boolean.TRUE.equals(f.getIsDeleted()))) {
                throw new RuntimeException("Cannot delete college: faculty exist under this college");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception ignored) {}
        try {
            if (tenantDomainRepository != null && tenantDomainRepository.findActiveByCollegeId(id).stream().anyMatch(d -> d != null && !Boolean.TRUE.equals(d.getIsDeleted()))) {
                throw new RuntimeException("Cannot delete college: tenant domains exist for this college");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception ignored) {}

        college.setIsDeleted(true);
        collegeRepository.save(college);
    }

    private void setCollegeFields(College college, CollegeDTO collegeDTO) {
        college.setCollegeChairId(collegeDTO.getCollegeChairId());
        college.setCity(collegeDTO.getCity());
        college.setLogo(collegeDTO.getLogo());
        college.setCountry(collegeDTO.getCountry());
        college.setName(collegeDTO.getName());
        college.setCollegeViceChairId(collegeDTO.getCollegeViceChairId());
        college.setState(collegeDTO.getState());
        college.setLandmark(collegeDTO.getLandmark());
        college.setAddressLine1(collegeDTO.getAddressLine1());
        college.setAddressLine2(collegeDTO.getAddressLine2());
        college.setPinCode(collegeDTO.getPinCode());
        college.setUniqueId(collegeDTO.getUniqueId());
        college.setOrgId(collegeDTO.getOrgId());
    }
}

