package com._42students.lms.service.impl;

import com._42students.lms.dto.request.OrganizationDTO;
import com._42students.lms.model.Organization;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.OrganizationRepository;
import com._42students.lms.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrganizationServiceImpl implements OrganizationService {

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired(required = false)
    CollegeRepository collegeRepository;

    @Override
    public Organization createOrganisation(OrganizationDTO organizationDTO) {
        String name = organizationDTO != null && organizationDTO.getName() != null ? organizationDTO.getName().trim() : null;
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Organization name is required");
        }
        if (organizationRepository.findByNameIgnoreCase(name).isPresent()) {
            // IllegalArgumentException specifically: GlobalExceptionHandler only passes THIS
            // (and IllegalStateException) messages through to the client — a plain RuntimeException
            // here is swallowed to a generic "An unexpected error occurred", and this constructor
            // has no local try/catch in the controller either, so it would go straight there.
            throw new IllegalArgumentException("Organization name already exists");
        }
        Organization organization = new Organization();
        organization.setName(name);
        Organization organization1 = organizationRepository.save(organization);
        return organization1;
    }

    @Override
    public List<Organization> findAll() {
        return organizationRepository.findAll().stream()
                .filter(o -> o != null && !Boolean.TRUE.equals(o.getIsDeleted()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Organization> findById(Integer id) {
        return organizationRepository.findById(id);
    }

    @Override
    public Organization updateOrganization(Integer id, OrganizationDTO organizationDTO) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
        String name = organizationDTO != null && organizationDTO.getName() != null ? organizationDTO.getName().trim() : null;
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Organization name is required");
        }
        organizationRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (existing.getId() != organization.getId()) {
                throw new IllegalArgumentException("Organization name already exists");
            }
        });
        organization.setName(name);
        return organizationRepository.save(organization);
    }

    @Override
    public void deleteOrganization(Integer id) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
        if (collegeRepository != null) {
            try {
                if (collegeRepository.fetchColleges(id).stream().anyMatch(c -> c != null && !Boolean.TRUE.equals(c.getIsDeleted()))) {
                    throw new IllegalArgumentException("Cannot delete organization: colleges exist under this organization");
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception ignored) {}
        }
        // Soft-delete to preserve referential integrity
        organization.setIsDeleted(true);
        organizationRepository.save(organization);
    }
}

